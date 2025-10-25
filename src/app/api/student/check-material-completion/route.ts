import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { StageCompletionModel } from '@/models/StageCompletion';

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

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const materialId = searchParams.get('materialId');

    if (!courseId || !materialId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID and Material ID are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const studentEmail = payload.email;

    // Check if material is completed in MongoDB
    const completion = await StageCompletionModel.findOne({
      courseId,
      studentEmail,
      stageId: `material-${materialId}`
    });

    return NextResponse.json({
      success: true,
      completed: !!completion
    });

  } catch (error) {
    console.error('Check material completion API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
