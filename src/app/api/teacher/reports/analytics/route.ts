import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';

interface ReportFilters {
  age?: string;
  grade?: string;
  gender?: string;
  disability?: string;
}

interface PieChartData {
  submit: number;
  pending: number;
  reviewed: number;
}

interface ReportAnalytics {
  preSurvey: PieChartData;
  courseProgress: PieChartData;
  ideaSubmission: PieChartData;
  postSurvey: PieChartData;
  totalStudents: number;
}

export async function GET(req: NextRequest) {
  try {
    console.log('Analytics API called');
    
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      console.log('No token found');
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

    // Get course ID and filters from query parameters
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const filters: ReportFilters = {
      age: searchParams.get('age') || undefined,
      grade: searchParams.get('grade') || undefined,
      gender: searchParams.get('gender') || undefined,
      disability: searchParams.get('disability') || undefined,
    };

    console.log('Analytics request params:', { courseId, filters });

    if (!courseId) {
      console.log('No course ID provided');
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Initialize Google Classroom API with user's OAuth credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });
    
    const classroom = getClassroomWithUserAuth(oauth2Client);

    try {
      console.log('Fetching report analytics for course:', courseId, 'with filters:', filters);

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

      // Calculate analytics for each student
      let preSurveyCompleted = 0;
      let preSurveyPending = 0;
      let preSurveyNotStarted = 0;

      let courseCompleted = 0;
      let courseInProgress = 0;
      let courseNotStarted = 0;

      let ideaSubmitted = 0;
      let ideaInDraft = 0;
      let ideaNotStarted = 0;

      let postSurveyCompleted = 0;
      let postSurveyPending = 0;
      let postSurveyNotStarted = 0;

      for (const student of students) {
        if (!student.profile?.emailAddress) continue;

        let completedAssignments = 0;
        let totalAssignments = 0;
        let preSurveyCompletedForStudent = false;
        let ideaSubmissionCompletedForStudent = false;
        let postSurveyCompletedForStudent = false;

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

            if (studentSubmission && (studentSubmission.state === 'TURNED_IN' || studentSubmission.state === 'RETURNED')) {
              completedAssignments++;

              // Check for specific assignment types
              const title = work.title?.toLowerCase() || '';
              if (title.includes('pre-survey') || title.includes('pre survey')) {
                preSurveyCompletedForStudent = true;
              } else if (title.includes('idea') || title.includes('ideas')) {
                ideaSubmissionCompletedForStudent = true;
              } else if (title.includes('post-survey') || title.includes('post survey')) {
                postSurveyCompletedForStudent = true;
              }
            }
          } catch (error) {
            console.warn(`Error fetching submission for student ${student.profile.emailAddress} in assignment ${work.id}:`, error);
          }
        }

        const courseProgress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

        // Categorize pre-survey status
        if (preSurveyCompletedForStudent) {
          preSurveyCompleted++;
        } else if (courseProgress > 0) {
          preSurveyPending++;
        } else {
          preSurveyNotStarted++;
        }

        // Categorize course progress
        if (courseProgress >= 80) {
          courseCompleted++;
        } else if (courseProgress > 0) {
          courseInProgress++;
        } else {
          courseNotStarted++;
        }

        // Categorize idea submission status
        if (ideaSubmissionCompletedForStudent) {
          ideaSubmitted++;
        } else if (courseProgress > 50) {
          ideaInDraft++;
        } else {
          ideaNotStarted++;
        }

        // Categorize post-survey status
        if (postSurveyCompletedForStudent) {
          postSurveyCompleted++;
        } else if (courseProgress > 80) {
          postSurveyPending++;
        } else {
          postSurveyNotStarted++;
        }
      }

      const totalStudents = students.length;

      // Calculate percentages
      const analytics: ReportAnalytics = {
        preSurvey: {
          submit: totalStudents > 0 ? Math.round((preSurveyCompleted / totalStudents) * 100) : 0,
          pending: totalStudents > 0 ? Math.round((preSurveyPending / totalStudents) * 100) : 0,
          reviewed: totalStudents > 0 ? Math.round((preSurveyNotStarted / totalStudents) * 100) : 0,
        },
        courseProgress: {
          submit: totalStudents > 0 ? Math.round((courseNotStarted / totalStudents) * 100) : 0,
          pending: totalStudents > 0 ? Math.round((courseInProgress / totalStudents) * 100) : 0,
          reviewed: totalStudents > 0 ? Math.round((courseCompleted / totalStudents) * 100) : 0,
        },
        ideaSubmission: {
          submit: totalStudents > 0 ? Math.round((ideaSubmitted / totalStudents) * 100) : 0,
          pending: totalStudents > 0 ? Math.round((ideaInDraft / totalStudents) * 100) : 0,
          reviewed: totalStudents > 0 ? Math.round((ideaNotStarted / totalStudents) * 100) : 0,
        },
        postSurvey: {
          submit: totalStudents > 0 ? Math.round((postSurveyCompleted / totalStudents) * 100) : 0,
          pending: totalStudents > 0 ? Math.round((postSurveyPending / totalStudents) * 100) : 0,
          reviewed: totalStudents > 0 ? Math.round((postSurveyNotStarted / totalStudents) * 100) : 0,
        },
        totalStudents
      };

      console.log('Report analytics calculated:', analytics);

      return NextResponse.json({
        success: true,
        analytics
      });

    } catch (googleError: any) {
      console.error('Error fetching report analytics from Google Classroom:', googleError);
      
      if (googleError.code === 403) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch report analytics from Google Classroom' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Report analytics API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
