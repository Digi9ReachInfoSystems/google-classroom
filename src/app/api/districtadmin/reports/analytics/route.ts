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
    if (!payload || payload.role !== 'district-admin') {
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
    const courseIdParam = searchParams.get('courseId');
    const ageFilter = searchParams.get('age');
    const gradeFilter = searchParams.get('grade');
    const genderFilter = searchParams.get('gender');
    const disabilityFilter = searchParams.get('disability');
    const districtFilter = searchParams.get('district');

    if (!courseIdParam) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // TypeScript type assertion after null check
    const courseId: string = courseIdParam;

    await connectToDatabase();

    // Initialize Google Classroom API with user's OAuth credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });
    
    const classroom = getClassroomWithUserAuth(oauth2Client);

    try {
      console.log('Fetching district admin report analytics for course:', courseId);

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
      if (districtFilter && districtFilter !== 'All') userQuery.district = districtFilter;

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

      // Calculate analytics and build detailed report data
      let preSurveyCompleted = 0;
      let preSurveyPending = 0;
      let ideaSubmitted = 0;
      let ideaPending = 0;
      let postSurveyCompleted = 0;
      let postSurveyPending = 0;
      let courseCompleted = 0;
      let courseInProgress = 0;
      
      // Detailed report data for table and Excel export
      const reportData = [];

      for (const student of matchingStudents) {
        if (!student.profile?.emailAddress) continue;

        let studentCompletedAll = true;
        let studentPreSurvey = 'Not Started';
        let studentIdea = 'Not Started';
        let studentPostSurvey = 'Not Started';
        let studentCourse = 'Not Started';

        // Get student details from database
        const studentDetails = await UserModel.findOne({ 
          email: student.profile.emailAddress 
        }).select('givenName familyName fullName age grade gender disability schoolName').lean() as any;

        // Check each assignment for this student
        for (const work of courseWork) {
          if (!work.id || work.workType !== 'ASSIGNMENT' || work.state !== 'PUBLISHED') continue;

          try {
            const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
              courseId: courseId as string,
              courseWorkId: work.id as string,
              userId: student.profile!.id as string
            });

            const submissions = submissionsResponse.data.studentSubmissions || [];
            const studentSubmission = submissions.find((sub: any) => 
              sub.userId === student.profile?.id
            );

            const isCompleted = studentSubmission && 
              (studentSubmission.state === 'TURNED_IN' || studentSubmission.state === 'RETURNED');

            const title = work.title?.toLowerCase() || '';
            
            if (title.includes('pre-survey') || title.includes('pre survey')) {
              if (isCompleted) {
                preSurveyCompleted++;
                studentPreSurvey = 'Completed';
              } else if (studentSubmission) {
                preSurveyPending++;
                studentPreSurvey = 'In Progress';
                studentCompletedAll = false;
              } else {
                studentCompletedAll = false;
              }
            } else if (title.includes('idea') || title.includes('ideas')) {
              if (isCompleted) {
                ideaSubmitted++;
                studentIdea = 'Submitted';
              } else if (studentSubmission) {
                ideaPending++;
                studentIdea = 'In Progress';
                studentCompletedAll = false;
              } else {
                studentCompletedAll = false;
              }
            } else if (title.includes('post-survey') || title.includes('post survey')) {
              if (isCompleted) {
                postSurveyCompleted++;
                studentPostSurvey = 'Completed';
              } else if (studentSubmission) {
                postSurveyPending++;
                studentPostSurvey = 'In Progress';
                studentCompletedAll = false;
              } else {
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
          studentCourse = 'Completed';
        } else {
          courseInProgress++;
          studentCourse = 'In Progress';
        }

        // Add to report data
        const studentName = studentDetails?.fullName || 
                           (studentDetails?.givenName && studentDetails?.familyName ? 
                             `${studentDetails.givenName} ${studentDetails.familyName}` : null) ||
                           student.profile.name?.fullName || 
                           'Unknown';

        reportData.push({
          studentName,
          email: student.profile.emailAddress || 'N/A',
          age: (studentDetails && studentDetails.age) ? studentDetails.age : 'N/A',
          grade: (studentDetails && studentDetails.grade) ? studentDetails.grade : 'N/A',
          gender: (studentDetails && studentDetails.gender) ? studentDetails.gender : 'N/A',
          disability: (studentDetails && studentDetails.disability) ? studentDetails.disability : 'N/A',
          schoolName: (studentDetails && studentDetails.schoolName) ? studentDetails.schoolName : 'N/A',
          preSurveyStatus: studentPreSurvey,
          ideaStatus: studentIdea,
          postSurveyStatus: studentPostSurvey,
          courseStatus: studentCourse
        });
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
        reportData, // Detailed student data for table and Excel export
        filters: {
          age: ageFilter || 'All',
          grade: gradeFilter || 'All',
          gender: genderFilter || 'All',
          disability: disabilityFilter || 'All',
          district: districtFilter || 'All'
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

