import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { StageCompletionModel } from '@/models/StageCompletion';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Only allow students to access this endpoint
    if (payload.role !== 'student') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const { courseId, videoId, assignmentId, completed } = await req.json();

    if (!courseId || !videoId || !assignmentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // videoId now includes assignmentId and type (video/quiz/resource), so we use it directly
    const stageId = `video-${videoId}`;
    
    if (completed) {
      // Mark video as completed
      await StageCompletionModel.findOneAndUpdate(
        {
          courseId,
          studentEmail: payload.email,
          stageId
        },
        {
          courseId,
          studentEmail: payload.email,
          stageId,
          completed: true,
          completedAt: new Date(),
          assignmentId,
          videoId
        },
        { upsert: true, new: true }
      );
    } else {
      // Remove completion if marking as incomplete
      await StageCompletionModel.deleteOne({
        courseId,
        studentEmail: payload.email,
        stageId
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Video completion updated successfully'
    });

  } catch (error) {
    console.error('Video completion API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Only allow students to access this endpoint
    if (payload.role !== 'student') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const assignmentId = searchParams.get('assignmentId');

    if (!courseId || !assignmentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Get all completions for this assignment (videos, resources, and quizzes)
    const completions = await StageCompletionModel.find({
      courseId,
      studentEmail: payload.email,
      stageId: { $regex: `^video-${assignmentId}-` }
    });

    // Create a map of all completions (videos, resources, quizzes)
    const completionMap: Record<string, boolean> = {};
    completions.forEach(completion => {
      // Extract the ID from stageId format: "video-assignmentId-itemIndex"
      // This works for videos, resources, and quizzes since they all use the same format
      const itemId = completion.stageId.replace('video-', '');
      completionMap[itemId] = completion.completed;
    });

    return NextResponse.json({
      success: true,
      completions: completionMap
    });

  } catch (error) {
    console.error('Video completion fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
