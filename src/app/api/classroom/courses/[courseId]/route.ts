import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';
import { getClassroom } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    console.log('Fetching course details for courseId:', courseId);

    // Initialize Google Classroom API
    const classroom = getClassroom();

    try {
      // Get course details
      const result = await classroom.courses.get({
        id: courseId
      });

      const course = result.data;

      return NextResponse.json({
        success: true,
        course: {
          id: course.id,
          name: course.name,
          section: course.section,
          descriptionHeading: course.descriptionHeading,
          description: course.description,
          room: course.room,
          ownerId: course.ownerId,
          enrollmentCode: course.enrollmentCode,
          courseState: course.courseState,
          creationTime: course.creationTime,
          updateTime: course.updateTime
        }
      });

    } catch (googleError: unknown) {
      console.error('Error fetching course from Google Classroom:', googleError);
      
      const error = googleError as GoogleError;
      
      // Try to fetch from database as fallback
      try {
        console.log('Attempting to fetch course from database as fallback...');
        await connectToDatabase();
        const dbCourse = await CourseModel.findOne({ courseId: courseId });
        
        if (dbCourse) {
          console.log('Found course in database:', dbCourse);
          return NextResponse.json({
            success: true,
            course: {
              id: dbCourse.courseId,
              name: dbCourse.name,
              section: dbCourse.section,
              descriptionHeading: dbCourse.descriptionHeading,
              description: dbCourse.description,
              room: dbCourse.room,
              ownerId: dbCourse.ownerId,
              enrollmentCode: dbCourse.enrollmentCode,
              courseState: dbCourse.courseState,
              creationTime: dbCourse.createdTime,
              updateTime: dbCourse.updateTime
            },
            source: 'database'
          });
        }
      } catch (dbError) {
        console.error('Error fetching from database:', dbError);
      }
      
      if ((error as { code?: number }).code === 403) {
        return NextResponse.json({
          success: false,
          message: 'Permission denied. You must be a teacher in this course to view details.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 403 });
      } else if ((error as { code?: number }).code === 404) {
        return NextResponse.json({
          success: false,
          message: 'Course not found in Google Classroom or database.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 404 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch course details',
          error: error instanceof Error ? error.message : String(error) || 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in fetch course:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch course',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
    }, { status: 500 });
  }
}
