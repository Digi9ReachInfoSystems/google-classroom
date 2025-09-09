import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { getClassroom } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AddTeacherRequest {
  userId: string; // Email address of the teacher
}

interface GoogleError {
  code?: number;
  message?: string;
  status?: string;
  errors?: Record<string, unknown>[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value;
    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;

    // Initialize Google Classroom API
    const classroom = getClassroom();

    try {
      // Get teachers from the course
      const result = await classroom.courses.teachers.list({
        courseId: courseId
      });

      const teachers = result.data.teachers || [];

      return NextResponse.json({
        success: true,
        teachers: teachers
      });

    } catch (googleError: unknown) {
      console.error('Error fetching teachers from course:', googleError);
      
      const error = googleError as GoogleError;
      
      if ((error as { code?: number }).code === 403) {
        return NextResponse.json({
          success: false,
          message: 'Permission denied. You must be a teacher in this course to view teachers.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 403 });
      } else if ((error as { code?: number }).code === 404) {
        return NextResponse.json({
          success: false,
          message: 'Course not found.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 404 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch teachers from course',
          error: error instanceof Error ? error.message : String(error) || 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in fetch teachers:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch teachers',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value;
    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const body: AddTeacherRequest = await request.json();

    // Validate required fields
    if (!body.userId || !body.userId.trim()) {
      return NextResponse.json({ 
        message: 'Teacher email is required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.userId.trim())) {
      return NextResponse.json({ 
        message: 'Invalid email format' 
      }, { status: 400 });
    }

    // Initialize Google Classroom API
    const classroom = getClassroom();

    try {
      // Add teacher to the course
      const result = await classroom.courses.teachers.create({
        courseId: courseId,
        requestBody: {
          userId: body.userId.trim()
        }
      });

      const teacher = result.data;

      return NextResponse.json({
        success: true,
        message: 'Teacher added successfully',
        teacher: {
          userId: teacher.userId,
          profile: teacher.profile,
          courseId: teacher.courseId
        }
      });

    } catch (googleError: unknown) {
      console.error('Error adding teacher to course:', googleError);
      
      const error = googleError as GoogleError;
      
      if ((error as { code?: number }).code === 400) {
        return NextResponse.json({
          success: false,
          message: 'Invalid request. Please check the teacher email and course ID.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 400 });
      } else if ((error as { code?: number }).code === 403) {
        return NextResponse.json({
          success: false,
          message: 'Permission denied. You must be a teacher in this course to add other teachers.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 403 });
      } else if ((error as { code?: number }).code === 404) {
        return NextResponse.json({
          success: false,
          message: 'Course not found or teacher email not found in your domain.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 404 });
      } else if ((error as { code?: number }).code === 409) {
        return NextResponse.json({
          success: false,
          message: 'This teacher is already added to the course.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 409 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to add teacher to course',
          error: error instanceof Error ? error.message : String(error) || 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in add teacher:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to add teacher',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value;
    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        message: 'Teacher email is required' 
      }, { status: 400 });
    }

    // Initialize Google Classroom API
    const classroom = getClassroom();

    try {
      // Remove teacher from the course
      await classroom.courses.teachers.delete({
        courseId: courseId,
        userId: userId
      });

      return NextResponse.json({
        success: true,
        message: 'Teacher removed successfully'
      });

    } catch (googleError: unknown) {
      console.error('Error removing teacher from course:', googleError);
      
      const error = googleError as GoogleError;
      
      if ((error as { code?: number }).code === 403) {
        return NextResponse.json({
          success: false,
          message: 'Permission denied. You cannot remove this teacher.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 403 });
      } else if ((error as { code?: number }).code === 404) {
        return NextResponse.json({
          success: false,
          message: 'Teacher not found in this course.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 404 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to remove teacher from course',
          error: error instanceof Error ? error.message : String(error) || 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in remove teacher:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to remove teacher',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
    }, { status: 500 });
  }
}