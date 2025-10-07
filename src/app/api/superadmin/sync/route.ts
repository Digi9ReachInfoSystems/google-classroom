import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';
import { UserModel } from '@/models/User';
import { getClassroom } from '@/lib/google';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'super-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    console.log('Starting sync for superadmin:', payload.email);
    console.log('Using delegated admin email:', process.env.GOOGLE_DELEGATED_ADMIN || 'admin@digi9.co.in');

    // Connect to database
    await connectToDatabase();

    // Get Google Classroom service
    const classroom = getClassroom();

    // Sync courses using delegated admin email
    console.log('Syncing courses...');
    let coursesResponse;
    try {
      coursesResponse = await classroom.courses.list({
        pageSize: 100
      });
    } catch (error) {
      console.error('Error fetching courses from Google Classroom:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch courses from Google Classroom. Check service account permissions.',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    console.log('Courses response:', coursesResponse.data);
    
    if (!coursesResponse.data.courses || coursesResponse.data.courses.length === 0) {
      console.log('No courses found in response');
      return NextResponse.json({ 
        success: false, 
        message: 'No courses found. The delegated admin may not have access to any courses.' 
      }, { status: 404 });
    }

    const courses = coursesResponse.data.courses;
    console.log(`Found ${courses.length} courses`);

    // Sync courses to database
    let syncedCourses = 0;
    for (const course of courses) {
      if (!course.id || !course.name) continue;

      try {
        await CourseModel.findOneAndUpdate(
          { courseId: course.id },
          {
            courseId: course.id,
            name: course.name,
            description: course.description || '',
            ownerId: course.ownerId || '',
            creationTime: course.creationTime || new Date(),
            updateTime: course.updateTime || new Date(),
            enrollmentCode: course.enrollmentCode || '',
            courseState: course.courseState || 'ACTIVE',
            alternateLink: course.alternateLink || '',
            teacherGroupEmail: course.teacherGroupEmail || '',
            courseGroupEmail: course.courseGroupEmail || '',
            guardianEnabled: course.guardianEnabled || false,
            calendarId: course.calendarId || '',
            teacherFolder: course.teacherFolder?.id || '',
            courseMaterialSets: course.courseMaterialSets || []
          },
          { upsert: true, new: true }
        );
        console.log(`Synced course: ${course.name} (${course.id})`);
        syncedCourses++;
      } catch (error) {
        console.error(`Error syncing course ${course.id}:`, error);
      }
    }

    // Sync students for each course
    console.log('Syncing students...');
    let syncedStudents = 0;
    for (const course of courses) {
      if (!course.id) continue;

      try {
        // Get students for this course
        const studentsResponse = await classroom.courses.students.list({
          courseId: course.id,
          pageSize: 100
        });

        if (studentsResponse.data.students) {
          for (const student of studentsResponse.data.students) {
            if (!student.userId || !student.profile) continue;

            try {
              await UserModel.findOneAndUpdate(
                { email: student.profile.emailAddress },
                {
                  email: student.profile.emailAddress || '',
                  name: {
                    givenName: student.profile.name?.givenName || '',
                    familyName: student.profile.name?.familyName || '',
                    fullName: student.profile.name?.fullName || ''
                  },
                  role: 'student',
                  courseId: course.id,
                  courseName: course.name || ''
                },
                { upsert: true, new: true }
              );
              console.log(`Synced student: ${student.profile.emailAddress}`);
              syncedStudents++;
            } catch (error) {
              console.error(`Error syncing student ${student.userId}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching students for course ${course.id}:`, error);
      }
    }

    console.log(`Sync completed: ${syncedCourses} courses, ${syncedStudents} students`);

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      data: {
        courses: syncedCourses,
        students: syncedStudents,
        syncTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sync failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
