import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';
import { UserModel } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'district-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    console.log('Seeding sample data for district admin...');

    // Connect to database
    await connectToDatabase();

    // Create sample courses
    const sampleCourses = [
      {
        courseId: 'course-1',
        name: 'Mathematics Grade 10',
        description: 'Advanced mathematics course for grade 10 students',
        ownerId: 'teacher1@digi9.co.in',
        creationTime: new Date('2024-01-15'),
        updateTime: new Date(),
        enrollmentCode: 'MATH10',
        courseState: 'ACTIVE',
        alternateLink: 'https://classroom.google.com/c/course-1',
        teacherGroupEmail: 'teachers@digi9.co.in',
        courseGroupEmail: 'math10@digi9.co.in',
        guardianEnabled: true,
        calendarId: 'calendar-1',
        teacherFolder: 'folder-1',
        courseMaterialSets: []
      },
      {
        courseId: 'course-2',
        name: 'Science Grade 9',
        description: 'General science course for grade 9 students',
        ownerId: 'teacher2@digi9.co.in',
        creationTime: new Date('2024-01-20'),
        updateTime: new Date(),
        enrollmentCode: 'SCI9',
        courseState: 'ACTIVE',
        alternateLink: 'https://classroom.google.com/c/course-2',
        teacherGroupEmail: 'teachers@digi9.co.in',
        courseGroupEmail: 'sci9@digi9.co.in',
        guardianEnabled: true,
        calendarId: 'calendar-2',
        teacherFolder: 'folder-2',
        courseMaterialSets: []
      },
      {
        courseId: 'course-3',
        name: 'English Literature',
        description: 'English literature and language course',
        ownerId: 'teacher3@digi9.co.in',
        creationTime: new Date('2024-02-01'),
        updateTime: new Date(),
        enrollmentCode: 'ENG101',
        courseState: 'ACTIVE',
        alternateLink: 'https://classroom.google.com/c/course-3',
        teacherGroupEmail: 'teachers@digi9.co.in',
        courseGroupEmail: 'eng101@digi9.co.in',
        guardianEnabled: true,
        calendarId: 'calendar-3',
        teacherFolder: 'folder-3',
        courseMaterialSets: []
      }
    ];

    // Create sample students
    const sampleStudents = [
      {
        email: 'student1@digi9.co.in',
        name: {
          givenName: 'John',
          familyName: 'Doe',
          fullName: 'John Doe'
        },
        role: 'student',
        courseId: 'course-1',
        courseName: 'Mathematics Grade 10'
      },
      {
        email: 'student2@digi9.co.in',
        name: {
          givenName: 'Jane',
          familyName: 'Smith',
          fullName: 'Jane Smith'
        },
        role: 'student',
        courseId: 'course-1',
        courseName: 'Mathematics Grade 10'
      },
      {
        email: 'student3@digi9.co.in',
        name: {
          givenName: 'Bob',
          familyName: 'Johnson',
          fullName: 'Bob Johnson'
        },
        role: 'student',
        courseId: 'course-2',
        courseName: 'Science Grade 9'
      },
      {
        email: 'student4@digi9.co.in',
        name: {
          givenName: 'Alice',
          familyName: 'Brown',
          fullName: 'Alice Brown'
        },
        role: 'student',
        courseId: 'course-2',
        courseName: 'Science Grade 9'
      },
      {
        email: 'student5@digi9.co.in',
        name: {
          givenName: 'Charlie',
          familyName: 'Wilson',
          fullName: 'Charlie Wilson'
        },
        role: 'student',
        courseId: 'course-3',
        courseName: 'English Literature'
      }
    ];

    // Insert courses
    let syncedCourses = 0;
    for (const course of sampleCourses) {
      try {
        await CourseModel.findOneAndUpdate(
          { courseId: course.courseId },
          course,
          { upsert: true, new: true }
        );
        syncedCourses++;
        console.log(`Seeded course: ${course.name}`);
      } catch (error) {
        console.error(`Error seeding course ${course.courseId}:`, error);
      }
    }

    // Insert students
    let syncedStudents = 0;
    for (const student of sampleStudents) {
      try {
        await UserModel.findOneAndUpdate(
          { email: student.email },
          student,
          { upsert: true, new: true }
        );
        syncedStudents++;
        console.log(`Seeded student: ${student.email}`);
      } catch (error) {
        console.error(`Error seeding student ${student.email}:`, error);
      }
    }

    console.log(`Seed completed: ${syncedCourses} courses, ${syncedStudents} students`);

    return NextResponse.json({
      success: true,
      message: 'Sample data seeded successfully',
      data: {
        courses: syncedCourses,
        students: syncedStudents,
        seedTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Seed data error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to seed sample data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
