import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { getClassroom } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AddStudentRequest {
  userId: string; // Email address of the student
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
      // Get students from the course
      const result = await classroom.courses.students.list({
        courseId: courseId
      });

      const students = result.data.students || [];

      return NextResponse.json({
        success: true,
        students: students
      });

    } catch (googleError: unknown) {
      console.error('Error fetching students from course:', googleError);
      
      const error = googleError as GoogleError;
      
      if ((error as { code?: number }).code === 403) {
        return NextResponse.json({
          success: false,
          message: 'Permission denied. You must be a teacher in this course to view students.',
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
          message: 'Failed to fetch students from course',
          error: error instanceof Error ? error.message : String(error) || 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in fetch students:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch students',
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
    const body: AddStudentRequest = await request.json();

    // Validate required fields
    if (!body.userId || !body.userId.trim()) {
      return NextResponse.json({ 
        message: 'Student email is required' 
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
      // Add student to the course
      const result = await classroom.courses.students.create({
        courseId: courseId,
        requestBody: {
          userId: body.userId.trim()
        }
      });

      const student = result.data;

      return NextResponse.json({
        success: true,
        message: 'Student added successfully',
        student: {
          userId: student.userId,
          profile: student.profile,
          courseId: student.courseId
        }
      });

    } catch (googleError: unknown) {
      console.error('Error adding student to course:', googleError);
      
      const error = googleError as GoogleError;
      
      if ((error as { code?: number }).code === 400) {
        return NextResponse.json({
          success: false,
          message: 'Invalid request. Please check the student email and course ID.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 400 });
      } else if ((error as { code?: number }).code === 403) {
        return NextResponse.json({
          success: false,
          message: 'Permission denied. You must be a teacher in this course to add students.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 403 });
      } else if ((error as { code?: number }).code === 404) {
        return NextResponse.json({
          success: false,
          message: 'Course not found or student email not found in your domain.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 404 });
      } else if ((error as { code?: number }).code === 409) {
        return NextResponse.json({
          success: false,
          message: 'This student is already enrolled in the course.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 409 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to add student to course',
          error: error instanceof Error ? error.message : String(error) || 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in add student:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to add student',
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
        message: 'Student email is required' 
      }, { status: 400 });
    }

    // Initialize Google Classroom API
    const classroom = getClassroom();

    try {
      // Remove student from the course
      await classroom.courses.students.delete({
        courseId: courseId,
        userId: userId
      });

      return NextResponse.json({
        success: true,
        message: 'Student removed successfully'
      });

    } catch (googleError: unknown) {
      console.error('Error removing student from course:', googleError);
      
      const error = googleError as GoogleError;
      
      if ((error as { code?: number }).code === 403) {
        return NextResponse.json({
          success: false,
          message: 'Permission denied. You cannot remove this student.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 403 });
      } else if ((error as { code?: number }).code === 404) {
        return NextResponse.json({
          success: false,
          message: 'Student not found in this course.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 404 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to remove student from course',
          error: error instanceof Error ? error.message : String(error) || 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in remove student:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to remove student',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
    }, { status: 500 });
  }
}