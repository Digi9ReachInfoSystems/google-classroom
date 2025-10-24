import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';
import { connectToDatabase } from '@/lib/mongodb';
import { CertificateModel } from '@/models/Certificate';
import { StageCompletionModel } from '@/models/StageCompletion';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    console.log('Students API - Token payload:', { 
      email: payload?.email, 
      role: payload?.role, 
      hasAccessToken: !!payload?.accessToken,
      hasRefreshToken: !!payload?.refreshToken 
    });
    
    if (!payload || payload.role !== 'teacher') {
      console.log('Students API - Access denied, payload:', payload);
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if we have OAuth tokens
    if (!payload.accessToken) {
      console.log('Students API - No OAuth tokens found');
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
      console.log('Fetching teacher students for course:', courseId);

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

      // Get course details
      const courseResponse = await classroom.courses.get({ id: courseId });
      const course = courseResponse.data;

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

      // Connect to database for certificates and stage completions
      await connectToDatabase();

      // Calculate student progress data
      const studentData = [];

      for (const student of students) {
        if (!student.profile?.emailAddress) continue;

        const studentEmail = student.profile.emailAddress;

        let completedAssignments = 0;
        let totalAssignments = 0;
        let preSurveyCompleted = false;
        let ideaSubmissionCompleted = false;
        let postSurveyCompleted = false;
        
        // Check if student has earned a certificate (from database)
        const certificateExists = await CertificateModel.findOne({
          courseId,
          studentEmail
        });
        const certificateEarned = !!certificateExists;

        // Check stage completion status from database
        const stageCompletions = await StageCompletionModel.find({
          courseId,
          studentEmail
        });

        // Check for specific stage completions
        const preSurveyStage = stageCompletions.find(stage => stage.stageId === 'pre-survey');
        const ideasStage = stageCompletions.find(stage => stage.stageId === 'ideas');
        const postSurveyStage = stageCompletions.find(stage => stage.stageId === 'post-survey');

        if (preSurveyStage) {
          preSurveyCompleted = true;
        }
        if (ideasStage) {
          ideaSubmissionCompleted = true;
        }
        if (postSurveyStage) {
          postSurveyCompleted = true;
        }

        // Check each assignment for this student
        for (const work of courseWork) {
          if (!work.id || work.workType !== 'ASSIGNMENT' || work.state !== 'PUBLISHED') continue;
          
          const title = work.title?.toLowerCase() || '';
          
          // Filter out surveys, ideas, and materials - only count learning assignments
          const isSurvey = title.includes('survey');
          const isIdea = title.includes('idea');
          const isMaterial = title.includes('course') || title.includes('cours ') || 
                            title.includes('material') || title.includes('mat '); // legacy support
          
          // Only count learning assignments (exclude surveys, ideas, and materials)
          if (!isSurvey && !isIdea && !isMaterial) {
            totalAssignments++;
          }

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
              // Only count learning assignments for progress calculation
              if (!isSurvey && !isIdea && !isMaterial) {
                completedAssignments++;
              }

              // Check for specific assignment types - only override if not already completed in database
              if (title.includes('pre-survey') || title.includes('pre survey')) {
                // Only set to true if not already completed in database
                if (!preSurveyCompleted) {
                  preSurveyCompleted = true;
                }
              } else if (title.includes('idea') || title.includes('ideas')) {
                // Only set to true if not already completed in database
                if (!ideaSubmissionCompleted) {
                  ideaSubmissionCompleted = true;
                }
              } else if (title.includes('post-survey') || title.includes('post survey')) {
                // Only set to true if not already completed in database
                if (!postSurveyCompleted) {
                  postSurveyCompleted = true;
                }
              }
            }
          } catch (error) {
            console.warn(`Error fetching submission for student ${studentEmail} in assignment ${work.id}:`, error);
          }
        }

        const lessonProgress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

        studentData.push({
          userId: student.profile.id || '',
          profile: {
            name: {
              givenName: student.profile.name?.givenName,
              familyName: student.profile.name?.familyName,
              fullName: student.profile.name?.fullName || 
                `${student.profile.name?.givenName || ''} ${student.profile.name?.familyName || ''}`.trim()
            },
            emailAddress: student.profile.emailAddress,
            photoUrl: student.profile.photoUrl
          },
          courseId: courseId,
          courseName: course.name || 'Unknown Course',
          courseSection: course.section,
          progress: {
            lessonProgress,
            preSurveyCompleted,
            ideaSubmissionCompleted,
            postSurveyCompleted,
            certificateEarned,
            completedAssignments,
            totalAssignments
          }
        });
      }

      console.log(`Processed ${studentData.length} students with progress data`);

      return NextResponse.json({
        success: true,
        students: studentData,
        totalStudents: studentData.length
      });

    } catch (googleError: any) {
      console.error('Error fetching teacher students from Google Classroom:', googleError);
      
      if (googleError.code === 403) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students from Google Classroom' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Teacher students API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}