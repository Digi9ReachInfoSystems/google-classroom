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
    console.log('Analytics API - Token payload:', { 
      email: payload?.email, 
      role: payload?.role, 
      hasAccessToken: !!payload?.accessToken,
      hasRefreshToken: !!payload?.refreshToken 
    });
    
    if (!payload || payload.role !== 'teacher') {
      console.log('Analytics API - Access denied, payload:', payload);
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if we have OAuth tokens
    if (!payload.accessToken) {
      console.log('Analytics API - No OAuth tokens found');
      return NextResponse.json({ 
        success: false, 
        error: 'No OAuth tokens found. Please log in again.' 
      }, { status: 401 });
    }

    // Get course ID from query parameters
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Initialize Google Classroom API with user's OAuth credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });
    
    const classroom = getClassroomWithUserAuth(oauth2Client);

    try {
      console.log('Fetching teacher analytics for course:', courseId);

      // Verify that the current user is a teacher in this course
      const teachersResponse = await classroom.courses.teachers.list({
        courseId: courseId
      });

      const teachers = teachersResponse.data.teachers || [];
      const isTeacher = teachers.some(teacher => 
        teacher.profile?.emailAddress?.toLowerCase() === payload.email.toLowerCase()
      );

      if (!isTeacher) {
        return NextResponse.json(
          { success: false, error: 'You are not a teacher in this course.' },
          { status: 403 }
        );
      }

      // Fetch students enrolled in the course
      const studentsResponse = await classroom.courses.students.list({
        courseId: courseId,
        pageSize: 100
      });

      const students = studentsResponse.data.students || [];
      console.log(`Found ${students.length} students in course`);

      // Fetch all coursework for the course
      const courseWorkResponse = await classroom.courses.courseWork.list({
        courseId: courseId,
        pageSize: 100
      });

      const courseWork = courseWorkResponse.data.courseWork || [];
      console.log(`Found ${courseWork.length} coursework items`);

      // Calculate analytics
      let totalCompletedAssignments = 0;
      let totalAssignments = 0;
      let totalProgress = 0;
      let studentsWithProgress = 0;

      // Calculate completion data for each student
      for (const student of students) {
        if (!student.profile?.emailAddress) continue;

        let completedAssignments = 0;
        let studentTotalAssignments = 0;

        // Check each assignment for this student
        for (const work of courseWork) {
          if (!work.id || work.workType !== 'ASSIGNMENT' || work.state !== 'PUBLISHED') continue;
          
          studentTotalAssignments++;
          totalAssignments++;

          try {
            // Get student's submission for this assignment
            const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
              courseId: courseId as string,
              courseWorkId: work.id as string,
              userId: student.profile.id as string
            });

            const submissions = submissionsResponse.data.studentSubmissions || [];
            const studentSubmission = submissions.find(sub => 
              sub.userId === student.profile?.id
            );

            if (studentSubmission && (studentSubmission.state === 'TURNED_IN' || studentSubmission.state === 'RETURNED')) {
              completedAssignments++;
              totalCompletedAssignments++;
            }
          } catch (error) {
            console.warn(`Error fetching submission for student ${student.profile.emailAddress} in assignment ${work.id}:`, error);
          }
        }

        if (studentTotalAssignments > 0) {
          const studentProgress = Math.round((completedAssignments / studentTotalAssignments) * 100);
          totalProgress += studentProgress;
          studentsWithProgress++;
        }
      }

      const avgProgress = studentsWithProgress > 0 ? Math.round(totalProgress / studentsWithProgress) : 0;
      const pendingAssignments = totalAssignments - totalCompletedAssignments;

      const analytics = {
        totalStudents: students.length,
        totalCourses: 1, // Single course analytics
        avgProgress,
        pendingAssignments,
        completedAssignments: totalCompletedAssignments,
        totalAssignments
      };

      console.log('Analytics calculated:', analytics);

      return NextResponse.json({
        success: true,
        analytics
      });

    } catch (googleError: any) {
      console.error('Error fetching teacher analytics from Google Classroom:', googleError);
      
      if (googleError.code === 403) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics from Google Classroom' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Teacher analytics API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}