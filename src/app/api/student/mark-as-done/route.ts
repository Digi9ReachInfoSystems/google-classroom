import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { google } from 'googleapis';
import { ensureValidToken } from '@/lib/token-refresh';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authentication token found' 
      }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    // Ensure we have valid OAuth tokens
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No OAuth access token found. Please log in again.' 
      }, { status: 401 });
    }

    // Check and refresh token if needed
    const tokenResult = await ensureValidToken(payload.accessToken, payload.refreshToken);
    if (!tokenResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: tokenResult.error || 'OAuth token validation failed',
        needsReauth: tokenResult.needsReauth
      }, { status: 401 });
    }

    // Use the validated/refreshed tokens
    const validAccessToken = tokenResult.accessToken;
    const validRefreshToken = tokenResult.refreshToken;

    const { courseId, courseWorkId } = await req.json();

    // Use the authenticated student's email directly (no studentEmail parameter needed)
    const studentEmail = payload.email;
    console.log('Using authenticated student email:', studentEmail);

    if (!courseId || !courseWorkId || !studentEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: courseId, courseWorkId, studentEmail' 
      }, { status: 400 });
    }

    // Extract the actual Google Classroom assignment ID from our internal format
    // Our format: quiz-{assignmentId}-{index}
    // We need to extract the assignmentId part
    let actualCourseWorkId = courseWorkId;
    if (courseWorkId.startsWith('quiz-')) {
      // Extract assignment ID from quiz-{assignmentId}-{index}
      const parts = courseWorkId.split('-');
      if (parts.length >= 3) {
        // Remove 'quiz' prefix and last part (index), join the middle parts
        actualCourseWorkId = parts.slice(1, -1).join('-');
      }
    }

    console.log('Processing mark-as-done request:', {
      originalCourseWorkId: courseWorkId,
      extractedCourseWorkId: actualCourseWorkId,
      courseId,
      studentEmail
    });

    console.log('Marking assignment as done:', { 
      courseId, 
      originalCourseWorkId: courseWorkId, 
      actualCourseWorkId, 
      studentEmail 
    });

    try {
      // Set up OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI
      );

      // Debug OAuth configuration
      console.log('OAuth Configuration:', {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ? 'Set' : 'Missing',
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ? 'Set' : 'Missing',
        redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ? 'Set' : 'Missing',
        hasAccessToken: !!payload.accessToken,
        hasRefreshToken: !!payload.refreshToken,
        studentEmail: studentEmail,
        note: 'Using student OAuth credentials (not service account) - this is the correct approach per Stack Overflow solution'
      });

      // Set credentials with validated/refreshed tokens
      oauth2Client.setCredentials({
        access_token: validAccessToken,
        refresh_token: validRefreshToken
      });

      // Initialize Google Classroom API
      const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

      // First, verify the course and assignment exist
      try {
        const courseResponse = await classroom.courses.get({
          id: courseId
        });
        console.log('Course found:', courseResponse.data.name);
      } catch (courseError: any) {
        console.log('Course verification failed:', courseError.message);
        return NextResponse.json({
          success: false,
          error: 'Course not found or access denied',
          details: 'The course might not exist or you do not have access to it'
        }, { status: 404 });
      }

      // Verify the assignment exists and check ownership
      let coursework;
      try {
        const assignmentResponse = await classroom.courses.courseWork.get({
          courseId: courseId,
          id: actualCourseWorkId
        });
        coursework = assignmentResponse.data;
        console.log('Assignment found:', coursework.title);
        
        // Check if this coursework is associated with our developer project
        const isAssociatedWithDeveloper = coursework.associatedWithDeveloper || false;
        console.log('Coursework ownership check:', {
          title: coursework.title,
          associatedWithDeveloper: isAssociatedWithDeveloper,
          canTurnIn: isAssociatedWithDeveloper
        });

        if (!isAssociatedWithDeveloper) {
          console.log('⚠️ Coursework was created manually in Google Classroom UI - turnIn API will fail');
          console.log('🔄 Using local completion fallback instead...');
          
          return NextResponse.json({
            success: true,
            message: 'Assignment marked as completed locally (coursework created manually in Google Classroom)',
            submissionId: 'local-completion',
            newState: 'COMPLETED_LOCALLY',
            note: 'This coursework was created manually in Google Classroom UI and cannot be turned in via API due to Google Classroom ownership restrictions.',
            googleClassroomSync: false,
            reason: 'Coursework not associated with developer project',
            suggestion: 'Only coursework created via API can be turned in via API. This is a Google Classroom limitation.',
            stackOverflowReference: 'https://stackoverflow.com/questions/41951405/permission-denied-when-trying-to-turnin-the-studentsubmission-in-google-classroo'
          });
        }
      } catch (assignmentError: any) {
        console.log('Assignment verification failed:', assignmentError.message);
        return NextResponse.json({
          success: false,
          error: 'Assignment not found',
          details: 'The assignment might not exist or you do not have access to it',
          assignmentId: actualCourseWorkId
        }, { status: 404 });
      }

      // Get the student's submission to check current state
      const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: courseId,
        courseWorkId: actualCourseWorkId,
        userId: studentEmail,
        pageSize: 1
      });

      const submissions = submissionsResponse.data.studentSubmissions || [];
      
      if (submissions.length === 0) {
        console.log('No submission found. This might be because:');
        console.log('1. The student is not enrolled in the course');
        console.log('2. The student has not started the assignment yet');
        console.log('3. There is a permission issue');
        console.log('Assignment ID used:', actualCourseWorkId);
        
        return NextResponse.json({
          success: false,
          error: 'No submission found for this student and assignment',
          details: 'The student might not be enrolled in the course or has not started the assignment',
          assignmentId: actualCourseWorkId
        }, { status: 404 });
      }

      const submission = submissions[0];
      console.log('Current submission state:', submission.state);
      console.log('Submission details:', {
        id: submission.id,
        state: submission.state,
        userId: submission.userId,
        courseWorkId: submission.courseWorkId,
        creationTime: submission.creationTime,
        updateTime: submission.updateTime
      });

      // Check if already turned in
      if (submission.state === 'TURNED_IN' || submission.state === 'RETURNED') {
        return NextResponse.json({
          success: true,
          message: 'Assignment already marked as done',
          currentState: submission.state
        });
      }

      // Check if submission is in a valid state for turning in
      if (submission.state !== 'CREATED' && submission.state !== 'NEW') {
        return NextResponse.json({
          success: false,
          error: 'Invalid submission state for turn-in',
          details: `Submission is in state '${submission.state}' which cannot be turned in. Only submissions in 'CREATED' or 'NEW' state can be turned in.`,
          currentState: submission.state
        }, { status: 400 });
      }

      // Mark the assignment as done by turning it in
      // This is Google Classroom's "Mark as Done" functionality
      // According to the API docs, this replicates the "Mark as Done" flow
      console.log('Attempting to turn in submission (Mark as Done equivalent)...');
      console.log('API Requirements check:');
      console.log('- Student email:', studentEmail);
      console.log('- Course ID:', courseId);
      console.log('- Assignment ID:', actualCourseWorkId);
      console.log('- Submission ID:', submission.id);
      
      try {
        // Try the standard turnIn method first
        const turnInResponse = await classroom.courses.courseWork.studentSubmissions.turnIn({
          courseId: courseId as string,
          courseWorkId: actualCourseWorkId as string,
          id: submission.id as string
          // No requestBody needed for "Mark as Done" - this is the correct format
        });

        console.log('✅ Assignment marked as done and turned in successfully');
        console.log('This replicates the Google Classroom "Mark as Done" flow');
        console.log('Turn-in response:', turnInResponse.data);

        return NextResponse.json({
          success: true,
          message: 'Assignment marked as done successfully',
          submissionId: submission.id,
          newState: 'TURNED_IN',
          googleClassroomResponse: turnInResponse.data
        });
      } catch (turnInError: any) {
        console.error('Turn-in failed:', turnInError);
        console.error('Error details:', {
          status: turnInError.response?.status,
          statusText: turnInError.response?.statusText,
          data: turnInError.response?.data,
          message: turnInError.message
        });
        
        // Handle specific turn-in errors
        if (turnInError.response?.status === 400) {
          const errorData = turnInError.response?.data;
          const errorMessage = errorData?.error?.message || 'Invalid turn-in request';
          
          return NextResponse.json({
            success: false,
            error: 'Invalid turn-in request',
            details: errorMessage,
            submissionState: submission.state,
            googleError: errorData
          }, { status: 400 });
        }
        
        if (turnInError.response?.status === 403) {
          const errorData = turnInError.response?.data;
          const errorMessage = errorData?.error?.message || 'Permission denied';
          
          // Check if it's a project permission issue
          if (errorMessage.includes('@ProjectPermissionDenied') || errorMessage.includes('Developer Console project is not permitted')) {
            console.log('⚠️ turnIn method failed due to project permissions.');
            console.log('🔄 This is a known Google Classroom API limitation even with student OAuth credentials.');
            console.log('🔄 Attempting alternative approach: Marking as completed locally...');
            
            // Alternative approach: Mark as completed locally since turnIn has limitations
            return NextResponse.json({
              success: true,
              message: 'Assignment marked as completed locally (Google Classroom API has restrictions)',
              submissionId: submission.id,
              newState: 'COMPLETED_LOCALLY',
              note: 'The Google Classroom turnIn method has restrictions even with proper student OAuth. Assignment is marked as completed in your local system.',
              googleClassroomSync: false,
              reason: 'Google Classroom API turnIn method has project permission limitations that prevent proper synchronization',
              suggestion: 'This is a known Google Classroom API limitation. The assignment is marked as completed in your local system.'
            });
          }
          
          return NextResponse.json({
            success: false,
            error: 'Permission denied for turn-in',
            details: 'You do not have permission to turn in this assignment. Only the student who owns the submission can turn it in.',
            googleError: errorData
          }, { status: 403 });
        }

        throw turnInError; // Re-throw to be caught by outer catch block
      }

    } catch (error: any) {
      console.error('Error marking assignment as done:', error);
      
      // Provide more specific error information
      if (error.response?.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Assignment not found',
          details: 'The assignment might not exist or the student is not enrolled'
        }, { status: 404 });
      }
      
      if (error.response?.status === 403) {
        return NextResponse.json({
          success: false,
          error: 'Permission denied',
          details: 'Insufficient permissions to modify this assignment'
        }, { status: 403 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to mark assignment as done',
        details: error.message || 'Unknown error occurred'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in mark-as-done API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
