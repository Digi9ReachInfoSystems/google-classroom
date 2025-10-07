import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    console.log('Courses API - Token payload:', { 
      email: payload?.email, 
      role: payload?.role, 
      hasAccessToken: !!payload?.accessToken,
      hasRefreshToken: !!payload?.refreshToken 
    });
    
    if (!payload || payload.role !== 'teacher') {
      console.log('Courses API - Access denied, payload:', payload);
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if we have OAuth tokens
    if (!payload.accessToken) {
      console.log('Courses API - No OAuth tokens found');
      return NextResponse.json({ 
        success: false, 
        error: 'No OAuth tokens found. Please log in again.' 
      }, { status: 401 });
    }

    // Initialize Google Classroom API with user's OAuth credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });
    
    const classroom = getClassroomWithUserAuth(oauth2Client);

    try {
      console.log('Fetching teacher courses for:', payload.email);

      // Fetch all courses
      const coursesResponse = await classroom.courses.list({
        pageSize: 100
      });

      const allCourses = coursesResponse.data.courses || [];
      console.log(`Found ${allCourses.length} total courses`);

      // Filter courses where the user is a teacher
      const teacherCourses = [];
      
      for (const course of allCourses) {
        if (!course.id) continue;
        
        try {
          // Check if the user is a teacher in this course
          const teachersResponse = await classroom.courses.teachers.list({
            courseId: course.id
          });
          
          const teachers = teachersResponse.data.teachers || [];
          const isTeacher = teachers.some(teacher => 
            teacher.profile?.emailAddress?.toLowerCase() === payload.email.toLowerCase()
          );
          
          if (isTeacher) {
            // Get student and teacher counts
            const studentsResponse = await classroom.courses.students.list({
              courseId: course.id,
              pageSize: 1 // We only need the count
            });
            
            const studentCount = studentsResponse.data.students?.length || 0;
            const teacherCount = teachers.length;
            
            teacherCourses.push({
              id: course.id,
              name: course.name || 'Untitled Course',
              section: course.section,
              description: course.description,
              room: course.room,
              courseState: course.courseState,
              studentCount,
              teacherCount
            });
          }
        } catch (error) {
          console.warn(`Error checking teachers for course ${course.id}:`, error);
          // Continue to next course
        }
      }
      
      console.log(`Found ${teacherCourses.length} courses where user is a teacher`);

      return NextResponse.json({
        success: true,
        courses: teacherCourses,
        total: teacherCourses.length
      });

    } catch (googleError: any) {
      console.error('Error fetching teacher courses from Google Classroom:', googleError);
      
      if (googleError.code === 403) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses from Google Classroom' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Teacher courses API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}