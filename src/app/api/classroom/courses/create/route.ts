import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';
import { getClassroom } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreateCourseRequest {
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  courseState?: 'COURSE_STATE_UNSPECIFIED' | 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  ownerId?: string;
}

interface GoogleError {
  code?: number;
  message?: string;
  status?: string;
  errors?: Record<string, unknown>[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value;
    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateCourseRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ 
        message: 'Course name is required' 
      }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Initialize Google Classroom API
    const classroom = getClassroom();

    // Prepare course data for Google Classroom
    const courseData: Record<string, unknown> = {
      name: body.name.trim(),
      section: body.section?.trim() || undefined,
      descriptionHeading: body.descriptionHeading?.trim() || undefined,
      description: body.description?.trim() || undefined,
      room: body.room?.trim() || undefined,
      courseState: body.courseState || 'ACTIVE',
      ownerId: body.ownerId || undefined
    };

    // Remove undefined values
    Object.keys(courseData).forEach(key => {
      if (courseData[key] === undefined) {
        delete courseData[key];
      }
    });

    try {
      // Create course in Google Classroom
      const createdCourse = await classroom.courses.create({
        requestBody: courseData
      });

      const course = createdCourse.data;

      if (!course.id) {
        throw new Error('Course created but no ID returned');
      }

      // Save course to our database
      const dbCourseData = {
        courseId: course.id,
        name: course.name,
        section: course.section,
        descriptionHeading: course.descriptionHeading,
        description: course.description,
        room: course.room,
        ownerId: course.ownerId,
        enrollmentCode: course.enrollmentCode,
        courseState: course.courseState,
        updateTime: course.updateTime ? new Date(course.updateTime) : undefined,
        createdTime: course.creationTime ? new Date(course.creationTime) : undefined,
      };

      await CourseModel.findOneAndUpdate(
        { courseId: course.id },
        { $set: dbCourseData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Course created successfully',
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
      console.error('Error creating course in Google Classroom:', googleError);
      
      const error = googleError as GoogleError;
      
      if ((error as { code?: number }).code === 400) {
        return NextResponse.json({
          success: false,
          message: 'Invalid course data',
          error: error instanceof Error ? error.message : String(error),
          details: error.errors
        }, { status: 400 });
      } else if ((error as { code?: number }).code === 403) {
        return NextResponse.json({
          success: false,
          message: 'Permission denied. Make sure you have permission to create courses.',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 403 });
      } else if ((error as { code?: number }).code === 409) {
        return NextResponse.json({
          success: false,
          message: 'Course with this name already exists',
          error: error instanceof Error ? error.message : String(error)
        }, { status: 409 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to create course in Google Classroom',
          error: error instanceof Error ? error.message : String(error) || 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in course creation:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to create course',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
    }, { status: 500 });
  }
}
