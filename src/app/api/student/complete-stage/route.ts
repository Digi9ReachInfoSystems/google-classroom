import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { StageCompletionModel } from '@/models/StageCompletion';

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

    // Connect to database
    await connectToDatabase();

    const body = await req.json();
    const { courseId, stageId } = body;

    if (!courseId || !stageId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID and Stage ID are required' 
      }, { status: 400 });
    }

    const studentEmail = payload.email;

    // Store completion in MongoDB
    console.log(`Marking ${stageId} complete for ${studentEmail} in course ${courseId}`);
    
    await StageCompletionModel.findOneAndUpdate(
      {
        courseId,
        studentEmail,
        stageId
      },
      {
        courseId,
        studentEmail,
        stageId,
        completedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`${stageId} marked as complete successfully`);

    return NextResponse.json({
      success: true,
      message: 'Stage completed successfully'
    });

  } catch (error) {
    console.error('Complete stage API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
