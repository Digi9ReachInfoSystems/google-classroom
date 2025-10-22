import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { SubmissionModel } from '@/models/Submission';
import { CourseworkModel } from '@/models/Coursework';
import { UserModel } from '@/models/User';
import { StageCompletionModel } from '@/models/StageCompletion';
import { google } from 'googleapis';
import { getPublicFormUrl } from '@/lib/form-utils';

export async function GET(req: NextRequest) {
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

    // Check if user has OAuth credentials
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No Google OAuth credentials found. Please log in again.' 
      }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    const studentEmail = payload.email;

    // Create OAuth2 client with user's credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });

    // Fetch coursework directly from Google Classroom API using user's OAuth
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    
    let courseworkResponse;
    try {
      courseworkResponse = await classroom.courses.courseWork.list({
        courseId: courseId,
        pageSize: 100
      });
    } catch (error: any) {
      console.error('Error fetching coursework from Google Classroom:', error);
      
      // Check if it's a 404 error
      if (error.code === 404) {
        return NextResponse.json({
          success: false,
          message: 'Course not found or you do not have access to this course.',
          error: 'Course not found',
          courseId: courseId,
          studentEmail: studentEmail
        }, { status: 404 });
      }
      
      throw error;
    }

    const allCoursework = courseworkResponse.data.courseWork || [];
    console.log(`Found ${allCoursework.length} coursework items for course ${courseId}`);

    // Find Pre-Survey coursework (title contains "pre-survey" or "pre survey")
    const preSurveyWork = allCoursework.find((cw: any) => {
      if (!cw.title) return false;
      const title = cw.title.toLowerCase();
      return title.includes('pre-survey') || title.includes('pre survey') || 
             (title.includes('pre') && title.includes('survey'));
    });

    // Find Ideas coursework (title contains "idea")
    const ideasWork = allCoursework.find((cw: any) => 
      cw.title && cw.title.toLowerCase().includes('idea')
    );

    // Find Post-Survey coursework (title contains "post-survey" or "post survey")
    const postSurveyWork = allCoursework.find((cw: any) => {
      if (!cw.title) return false;
      const title = cw.title.toLowerCase();
      return title.includes('post-survey') || title.includes('post survey') || 
             (title.includes('post') && title.includes('survey'));
    });

    // Fetch all submissions for this student across all coursework
    const allSubmissions: any[] = [];
    
    for (const coursework of allCoursework) {
      if (!coursework.id) continue;
      
      try {
        const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
          courseId: courseId,
          courseWorkId: coursework.id,
          userId: studentEmail,
          pageSize: 10
        });
        
        const submissions = submissionsResponse.data.studentSubmissions || [];
        allSubmissions.push(...submissions);
      } catch (error) {
        console.warn(`Error fetching submissions for coursework ${coursework.id}:`, error);
        // Continue with other coursework
      }
    }

    // Check MongoDB for stage completions (for form-based stages)
    const preSurveyCompletion = await StageCompletionModel.findOne({
      courseId,
      studentEmail,
      stageId: 'pre-survey'
    });

    const ideasCompletion = await StageCompletionModel.findOne({
      courseId,
      studentEmail,
      stageId: 'ideas'
    });

    const postSurveyCompletion = await StageCompletionModel.findOne({
      courseId,
      studentEmail,
      stageId: 'post-survey'
    });

    // Calculate course completion (all non-survey/idea coursework)
    const regularCoursework = allCoursework.filter((cw: any) => {
      const title = cw.title ? cw.title.toLowerCase() : '';
      return !title.includes('survey') && !title.includes('idea');
    });

    // Check MongoDB for material completions
    const materialCompletions = await StageCompletionModel.find({
      courseId,
      studentEmail,
      stageId: { $regex: '^material-' }
    });

    const completedMaterialIds = new Set(
      materialCompletions.map(mc => mc.stageId.replace('material-', ''))
    );

    // Count completed materials (either from Google submissions or MongoDB)
    let completedCount = 0;
    for (const coursework of regularCoursework) {
      const hasGoogleSubmission = allSubmissions.some(
        (sub: any) => sub.courseWorkId === coursework.id && sub.state === 'TURNED_IN'
      );
      const hasLocalCompletion = completedMaterialIds.has(coursework.id);
      
      if (hasGoogleSubmission || hasLocalCompletion) {
        completedCount++;
      }
    }

    // Check if course stage is marked complete in MongoDB
    const courseStageCompletion = await StageCompletionModel.findOne({
      courseId,
      studentEmail,
      stageId: 'course'
    });

    // Check for learning module completions (videos and quizzes)
    const learningModuleCompletions = await StageCompletionModel.find({
      courseId,
      studentEmail,
      stageId: { $regex: '^video-' }
    });

    console.log(`Found ${learningModuleCompletions.length} learning module completions for ${studentEmail}`);
    
    // If there are learning module completions, check if we should auto-complete the course stage
    if (learningModuleCompletions.length > 0 && !courseStageCompletion) {
      // For now, if there are any learning module completions, consider the course as having progress
      // In a more sophisticated implementation, you'd check if ALL learning modules are completed
      console.log(`Learning modules have progress, but course stage not explicitly marked complete`);
    }
    
    // Consider course completed if:
    // 1. Course stage is explicitly marked complete, OR
    // 2. All regular coursework is completed, OR  
    // 3. There are learning module completions (indicating progress through learning modules)
    // Note: This is a simplified check - ideally we'd verify ALL learning modules are complete
    const courseCompleted = !!courseStageCompletion || 
                           (regularCoursework.length > 0 && completedCount >= regularCoursework.length) ||
                           learningModuleCompletions.length > 0;

    // Extract form URLs from coursework materials
    const getFormUrl = (coursework: any) => {
      if (!coursework) {
        console.log('No coursework provided to getFormUrl');
        return '';
      }
      
      console.log('Checking coursework for form URL:', {
        title: coursework.title,
        id: coursework.id,
        hasMaterials: !!coursework.materials,
        materials: coursework.materials
      });
      
      if (!coursework.materials) {
        console.log('No materials found in coursework');
        return '';
      }
      
      for (const material of coursework.materials) {
        console.log('Checking material:', material);
        
        if (material.form && material.form.formUrl) {
          console.log('Found form URL:', material.form.formUrl);
          return material.form.formUrl;
        }
        if (material.link && material.link.url) {
          const url = material.link.url;
          console.log('Found link URL:', url);
          if (url.includes('docs.google.com/forms')) {
            return url;
          }
        }
      }
      
      console.log('No form URL found in materials');
      return '';
    };

    console.log('Pre-survey work found:', preSurveyWork ? preSurveyWork.title : 'None');
    console.log('Ideas work found:', ideasWork ? ideasWork.title : 'None');
    console.log('Post-survey work found:', postSurveyWork ? postSurveyWork.title : 'None');
    
    // Log all coursework titles for debugging
    console.log('All coursework in this course:', allCoursework.map((cw: any) => cw.title));

    const progress = {
      preSurveyCompleted: !!preSurveyCompletion,
      courseCompleted,
      ideasCompleted: !!ideasCompletion,
      postSurveyCompleted: !!postSurveyCompletion,
      preSurveyUrl: getPublicFormUrl(getFormUrl(preSurveyWork)),
      ideasUrl: getPublicFormUrl(getFormUrl(ideasWork)),
      postSurveyUrl: getPublicFormUrl(getFormUrl(postSurveyWork)),
      regularCourseworkCount: regularCoursework.length,
      completedCourseworkCount: completedCount
    };

    console.log('Progress data:', progress);

    return NextResponse.json({
      success: true,
      progress,
      debug: {
        courseId,
        totalCoursework: allCoursework.length,
        courseworkTitles: allCoursework.map((cw: any) => cw.title),
        foundPreSurvey: !!preSurveyWork,
        foundIdeas: !!ideasWork,
        foundPostSurvey: !!postSurveyWork
      }
    });

  } catch (error) {
    console.error('Student stage progress API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
