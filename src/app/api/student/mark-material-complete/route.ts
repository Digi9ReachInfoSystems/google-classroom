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
    await StageCompletionModel.findOneAndUpdate(
      {
        courseId,
        studentEmail,
        stageId: `material-${courseWorkId}`
      },
      {
        courseId,
        studentEmail,
        stageId: `material-${courseWorkId}`,
        completedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`Material ${courseWorkId} marked complete for ${studentEmail}`);

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

