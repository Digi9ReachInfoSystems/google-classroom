import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { StageCompletionModel } from '@/models/StageCompletion';
import { BadgeModel } from '@/models/Badge';
import { google } from 'googleapis';
import { CourseworkModel } from '@/models/Coursework';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check OAuth credentials
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No OAuth credentials found' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, courseWorkId } = body;

    if (!courseId || !courseWorkId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID and CourseWork ID are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const studentEmail = payload.email;

    // Store completion in MongoDB (for video-based assignments without submissions)
    const completionData = {
      courseId,
      studentEmail,
      stageId: `material-${courseWorkId}`,
      completedAt: new Date()
    };
    
    console.log('Storing completion data:', completionData);
    
    const result = await StageCompletionModel.findOneAndUpdate(
      {
        courseId,
        studentEmail,
        stageId: `material-${courseWorkId}`
      },
      completionData,
      { upsert: true, new: true }
    );

    console.log(`Material ${courseWorkId} marked complete for ${studentEmail}. Stored result:`, result);

    // Check if this was Module 6 completion and auto-complete course stage
    try {
      // Get the coursework title to check if it's Module 6
      const coursework = await CourseworkModel.findOne({ courseWorkId });
      const title = coursework?.title?.toLowerCase() || '';
      
      // Check if this is Module 6 (various patterns)
      const isModule6 = title.includes('module 6') || 
                       title.includes('mod 6') || 
                       title.includes('module6') ||
                       title.includes('mod6') ||
                       (title.includes('module') && title.includes('6')) ||
                       (title.includes('mod') && title.includes('6'));
      
      if (isModule6) {
        console.log('Module 6 completed! Checking if all modules are done...');
        
        // Get all material completions for this course
        const allMaterialCompletions = await StageCompletionModel.find({
          courseId,
          studentEmail,
          stageId: { $regex: '^material-' }
        });
        
        console.log(`Found ${allMaterialCompletions.length} material completions`);
        
        // Get all coursework for this course to count total modules
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        
        oauth2Client.setCredentials({
          access_token: payload.accessToken,
          refresh_token: payload.refreshToken
        });
        
        const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
        
        const courseworkResponse = await classroom.courses.courseWork.list({
          courseId: courseId,
          pageSize: 100
        });
        
        const allCoursework = courseworkResponse.data.courseWork || [];
        
        // Filter for learning modules (exclude surveys and ideas)
        const learningModules = allCoursework.filter((cw: any) => {
          const title = cw.title?.toLowerCase() || '';
          return !title.includes('survey') && !title.includes('idea');
        });
        
        console.log(`Total learning modules: ${learningModules.length}`);
        console.log(`Completed materials: ${allMaterialCompletions.length}`);
        
        // If all modules are completed, auto-complete the course stage
        if (learningModules.length > 0 && allMaterialCompletions.length >= learningModules.length) {
          console.log('🎉 All learning modules completed! Auto-completing course stage...');
          
          await StageCompletionModel.findOneAndUpdate(
            {
              courseId,
              studentEmail,
              stageId: 'course'
            },
            {
              courseId,
              studentEmail,
              stageId: 'course',
              completedAt: new Date()
            },
            { upsert: true, new: true }
          );
          
          console.log('✅ Course stage auto-completed successfully!');
        }
      }
    } catch (autoCompleteError) {
      // Log error but don't fail the main request
      console.error('Error in auto-completion logic:', autoCompleteError);
    }

    // Award badge for this learning module
    try {
      // Get coursework details for badge title
      const coursework = await CourseworkModel.findOne({ courseWorkId });
      const badgeTitle = coursework?.title || 'Learning Module';

      await BadgeModel.findOneAndUpdate(
        {
          courseId,
          studentEmail,
          badgeIdentifier: courseWorkId
        },
        {
          courseId,
          studentEmail,
          badgeType: 'learning-module',
          badgeIdentifier: courseWorkId,
          title: badgeTitle,
          description: `Awarded for completing ${badgeTitle}`,
          awardedAt: new Date()
        },
        { upsert: true, new: true }
      );
      console.log(`Badge awarded for module ${courseWorkId}`);
    } catch (badgeError) {
      // Log error but don't fail the request
      console.error('Error awarding badge:', badgeError);
    }

    return NextResponse.json({
      success: true,
      message: 'Material marked as complete'
    });

  } catch (error) {
    console.error('Mark material complete API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

