import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';
import { getClassroom } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CourseData {
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  ownerId?: string;
  rowNumber: number;
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

    const { data } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ message: 'No data to upload' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Initialize Google Classroom API
    const classroom = getClassroom();

    const results = {
      total: data.length,
      success: 0,
      errors: [] as string[],
      duplicates: 0,
      skipped: 0
    };

    // Process each course
    for (const row of data as CourseData[]) {
      try {
        // Validate required fields
        if (!row.name || row.name.trim().length === 0) {
          results.errors.push(`Row ${row.rowNumber}: Course name is required`);
          results.skipped++;
          continue;
        }

        // Check if course with same name already exists
        try {
          const existingCourses = await classroom.courses.list({
            pageSize: 100
          });

          const duplicateCourse = existingCourses.data.courses?.find(
            (course) => course.name?.toLowerCase() === row.name.toLowerCase()
          );

          if (duplicateCourse) {
            results.duplicates++;
            continue;
          }
        } catch (error) {
          console.error('Error checking existing courses:', error);
          // Continue with creation attempt
        }

        // Prepare course data for Google Classroom
        const courseData: Record<string, unknown> = {
          name: row.name.trim(),
          section: row.section?.trim() || undefined,
          descriptionHeading: row.descriptionHeading?.trim() || undefined,
          description: row.description?.trim() || undefined,
          room: row.room?.trim() || undefined,
          courseState: row.courseState,
          ownerId: row.ownerId || undefined
        };

        // Remove undefined values
        Object.keys(courseData).forEach(key => {
          if (courseData[key] === undefined) {
            delete courseData[key];
          }
        });

        // Create course in Google Classroom
        try {
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

          results.success++;

        } catch (googleError: unknown) {
          console.error(`Error creating course ${row.name}:`, googleError);
          
          const error = googleError as GoogleError;
          
          if ((error as { code?: number }).code === 400) {
            results.errors.push(`Row ${row.rowNumber}: ${row.name} - Invalid course data: ${error instanceof Error ? error.message : String(error)}`);
            results.skipped++;
          } else if ((error as { code?: number }).code === 403) {
            results.errors.push(`Row ${row.rowNumber}: ${row.name} - Permission denied. Make sure you have permission to create courses.`);
            results.skipped++;
          } else if ((error as { code?: number }).code === 409) {
            results.duplicates++;
          } else {
            results.errors.push(`Row ${row.rowNumber}: ${row.name} - ${error instanceof Error ? error.message : String(error) || 'Unknown error creating course'}`);
            results.skipped++;
          }
        }

      } catch (error) {
        console.error(`Error processing row ${row.rowNumber}:`, error);
        results.errors.push(`Row ${row.rowNumber}: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      message: 'Course creation completed',
      results
    });

  } catch (error) {
    console.error('Error in bulk course creation:', error);
    return NextResponse.json({ 
      message: 'Failed to create courses',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
    }, { status: 500 });
  }
}
