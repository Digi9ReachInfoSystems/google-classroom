import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No OAuth tokens found. Please log in again.' 
      }, { status: 401 });
    }

    // Get filters from query parameters
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const ageFilter = searchParams.get('age');
    const gradeFilter = searchParams.get('grade');
    const genderFilter = searchParams.get('gender');
    const disabilityFilter = searchParams.get('disability');

    if (!courseId) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Initialize Google Classroom API with user's OAuth credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });
    
    const classroom = getClassroomWithUserAuth(oauth2Client);

    try {
      console.log('Fetching super admin report analytics for course:', courseId);

      // Fetch students enrolled in the course
      const studentsResponse = await classroom.courses.students.list({
        courseId: courseId,
        pageSize: 100
      });

      const students = studentsResponse.data.students || [];
      console.log(`Found ${students.length} students in course`);

      // Build filter query for MongoDB
      const userQuery: any = { role: 'student' };
      if (ageFilter && ageFilter !== 'All') userQuery.age = ageFilter;
      if (gradeFilter && gradeFilter !== 'All') userQuery.grade = gradeFilter;
      if (genderFilter && genderFilter !== 'All') userQuery.gender = genderFilter;
      if (disabilityFilter && disabilityFilter !== 'All') userQuery.disability = disabilityFilter;

      // Get filtered student emails from database
      const filteredStudents = await UserModel.find(userQuery).select('email');
      const filteredEmails = new Set(filteredStudents.map(s => s.email));

      // Filter Google Classroom students based on database filters
      const matchingStudents = students.filter(student => 
        filteredEmails.has(student.profile?.emailAddress || '')
      );

      console.log(`Filtered to ${matchingStudents.length} students matching criteria`);

      // Fetch coursework
      const courseWorkResponse = await classroom.courses.courseWork.list({
        courseId: courseId,
        pageSize: 100
      });

      const courseWork = courseWorkResponse.data.courseWork || [];

      // Calculate analytics
      let preSurveyCompleted = 0;
      let preSurveyPending = 0;
      let ideaSubmitted = 0;
      let ideaPending = 0;
      let postSurveyCompleted = 0;
      let postSurveyPending = 0;
      let courseCompleted = 0;
      let courseInProgress = 0;

      for (const student of matchingStudents) {
        if (!student.profile?.emailAddress) continue;

        let studentCompletedAll = true;

        // Check each assignment for this student
        for (const work of courseWork) {
          if (!work.id || work.workType !== 'ASSIGNMENT' || work.state !== 'PUBLISHED') continue;

          try {
            const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
              courseId: courseId,
              courseWorkId: work.id,
              userId: student.profile.id
            });

            const submissions = submissionsResponse.data.studentSubmissions || [];
            const studentSubmission = submissions.find(sub => 
              sub.userId === student.profile.id
            );

            const isCompleted = studentSubmission && 
              (studentSubmission.state === 'TURNED_IN' || studentSubmission.state === 'RETURNED');

            const title = work.title?.toLowerCase() || '';
            
            if (title.includes('pre-survey') || title.includes('pre survey')) {
              if (isCompleted) {
                preSurveyCompleted++;
              } else {
                preSurveyPending++;
                studentCompletedAll = false;
              }
            } else if (title.includes('idea') || title.includes('ideas')) {
              if (isCompleted) {
                ideaSubmitted++;
              } else {
                ideaPending++;
                studentCompletedAll = false;
              }
            } else if (title.includes('post-survey') || title.includes('post survey')) {
              if (isCompleted) {
                postSurveyCompleted++;
              } else {
                postSurveyPending++;
                studentCompletedAll = false;
              }
            } else {
              // Regular assignment
              if (!isCompleted) {
                studentCompletedAll = false;
              }
            }
          } catch (error) {
            console.warn(`Error fetching submission for student ${student.profile.emailAddress}:`, error);
            studentCompletedAll = false;
          }
        }

        if (studentCompletedAll) {
          courseCompleted++;
        } else {
          courseInProgress++;
        }
      }

      const analytics = {
        totalStudents: matchingStudents.length,
        preSurvey: {
          completed: preSurveyCompleted,
          pending: preSurveyPending,
          notStarted: matchingStudents.length - preSurveyCompleted - preSurveyPending
        },
        course: {
          completed: courseCompleted,
          inProgress: courseInProgress,
          notStarted: matchingStudents.length - courseCompleted - courseInProgress
        },
        ideas: {
          submitted: ideaSubmitted,
          pending: ideaPending,
          notStarted: matchingStudents.length - ideaSubmitted - ideaPending
        },
        postSurvey: {
          completed: postSurveyCompleted,
          pending: postSurveyPending,
          notStarted: matchingStudents.length - postSurveyCompleted - postSurveyPending
        }
      };

      console.log('District admin report analytics calculated:', analytics);

      return NextResponse.json({
        success: true,
        analytics,
        filters: {
          age: ageFilter || 'All',
          grade: gradeFilter || 'All',
          gender: genderFilter || 'All',
          disability: disabilityFilter || 'All'
        }
      });

    } catch (googleError: any) {
      console.error('Error fetching district admin reports analytics:', googleError);
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('District admin reports analytics API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

