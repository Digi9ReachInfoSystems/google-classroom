import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';

interface StudentData {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  completionPercentage: number;
  totalAssignments: number;
  completedAssignments: number;
  averageGrade?: number;
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if we have OAuth tokens
    if (!payload.accessToken) {
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
      console.log('Fetching teacher leaderboard data for course:', courseId);

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

      // Calculate completion data for each student
      const studentData: StudentData[] = [];

      for (const student of students) {
        if (!student.profile?.emailAddress) continue;

        let completedAssignments = 0;
        let totalAssignments = 0;
        let totalGrade = 0;
        let gradedAssignments = 0;

        // Check each assignment for this student
        for (const work of courseWork) {
          if (!work.id || work.workType !== 'ASSIGNMENT' || work.state !== 'PUBLISHED') continue;
          
          totalAssignments++;

          try {
            // Get student's submission for this assignment
            const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
              courseId: courseId,
              courseWorkId: work.id,
              userId: student.profile.id
            });

            const submissions = submissionsResponse.data.studentSubmissions || [];
            const studentSubmission = submissions.find(sub => 
              sub.userId === student.profile.id
            );

            if (studentSubmission) {
              // Check if assignment is completed
              if (studentSubmission.state === 'TURNED_IN' || studentSubmission.state === 'RETURNED') {
                completedAssignments++;
              }

              // Track grades for average calculation
              if (studentSubmission.assignedGrade !== null && studentSubmission.assignedGrade !== undefined) {
                totalGrade += studentSubmission.assignedGrade;
                gradedAssignments++;
              }
            }
          } catch (error) {
            console.warn(`Error fetching submission for student ${student.profile.emailAddress} in assignment ${work.id}:`, error);
          }
        }

        const completionPercentage = totalAssignments > 0 
          ? Math.round((completedAssignments / totalAssignments) * 100) 
          : 0;

        const averageGrade = gradedAssignments > 0 
          ? Math.round(totalGrade / gradedAssignments) 
          : undefined;

        studentData.push({
          id: student.profile.id || '',
          name: student.profile.name?.fullName || 
                `${student.profile.name?.givenName || ''} ${student.profile.name?.familyName || ''}`.trim() ||
                student.profile.emailAddress || 'Unknown Student',
          email: student.profile.emailAddress || '',
          profilePicture: student.profile.photoUrl,
          completionPercentage,
          totalAssignments,
          completedAssignments,
          averageGrade
        });
      }

      // Sort students by completion percentage (descending)
      studentData.sort((a, b) => {
        if (b.completionPercentage !== a.completionPercentage) {
          return b.completionPercentage - a.completionPercentage;
        }
        // If completion is the same, sort by average grade
        if (a.averageGrade && b.averageGrade) {
          return b.averageGrade - a.averageGrade;
        }
        // Finally, sort by name
        return a.name.localeCompare(b.name);
      });

      // Add rank to each student
      const rankedStudents = studentData.map((student, index) => ({
        ...student,
        rank: index + 1,
        isCurrentUser: false // Teachers don't appear in their own leaderboard
      }));

      console.log(`Processed ${rankedStudents.length} students for teacher leaderboard`);

      return NextResponse.json({
        success: true,
        students: rankedStudents,
        totalStudents: rankedStudents.length,
        courseId: courseId
      });

    } catch (googleError: any) {
      console.error('Error fetching teacher leaderboard data from Google Classroom:', googleError);
      
      if (googleError.code === 403) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leaderboard data from Google Classroom' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Teacher leaderboard API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
