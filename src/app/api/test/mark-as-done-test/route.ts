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

    const { courseId, courseWorkId, studentEmail } = await req.json();

    // Use the provided student email for testing
    console.log('Using provided student email for testing:', studentEmail);
    console.log('Authenticated user:', payload.email);

    if (!courseId || !courseWorkId || !studentEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: courseId, courseWorkId, studentEmail' 
      }, { status: 400 });
    }

    // Extract the actual Google Classroom assignment ID from our internal format
    let actualCourseWorkId = courseWorkId;
    if (courseWorkId.startsWith('quiz-')) {
      const parts = courseWorkId.split('-');
      if (parts.length >= 2) {
        actualCourseWorkId = parts[1];
      }
    }

    console.log('Processing mark-as-done request:', {
      courseId,
      courseWorkId,
      actualCourseWorkId,
      studentEmail,
      authenticatedUser: payload.email
    });

    let submission: any = null;
    
    try {
      // Set up OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI
      );

      // Set credentials with validated/refreshed tokens
      oauth2Client.setCredentials({
        access_token: tokenResult.accessToken,
        refresh_token: tokenResult.refreshToken
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
          courseId: courseId as string,
          id: actualCourseWorkId as string
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
        courseId: courseId as string,
        courseWorkId: actualCourseWorkId as string,
        userId: studentEmail,
        pageSize: 1
      });

      const submissions = submissionsResponse.data.studentSubmissions || [];
      
      if (submissions.length === 0) {
        console.log('No submission found. This might be because:');
        console.log('1. The student is not enrolled in the course');
        console.log('2. The student has not started the assignment');
        console.log('3. The student email is incorrect');
        return NextResponse.json({
          success: false,
          error: 'No submission found for this student and assignment',
          details: 'The student might not be enrolled in the course or has not started the assignment',
          assignmentId: actualCourseWorkId,
          studentEmail: studentEmail
        }, { status: 404 });
      }

      // Find the submission in CREATED or NEW state
      submission = submissions.find(sub => 
        sub.state === 'CREATED' || sub.state === 'NEW'
      );

      if (!submission) {
        return NextResponse.json({
          success: false,
          error: 'No eligible submission found',
          details: `No submission in CREATED or NEW state found for student ${studentEmail}. Available states: ${submissions.map(s => s.state).join(', ')}`
        }, { status: 400 });
      }

      console.log('Found eligible submission:', {
        id: submission.id,
        state: submission.state,
        userId: submission.userId
      });

      // Attempt to turn in the submission
      console.log('Attempting to turn in submission...');
      const turnInResponse = await classroom.courses.courseWork.studentSubmissions.turnIn({
        courseId: courseId as string,
        courseWorkId: actualCourseWorkId as string,
        id: submission.id as string
        // No requestBody needed for "Mark as Done"
      });

      console.log('✅ turnIn successful');
      console.log('Turn-in response:', turnInResponse.data);

      return NextResponse.json({
        success: true,
        message: 'Assignment marked as done successfully',
        submissionId: submission.id,
        newState: 'TURNED_IN',
        googleClassroomResponse: turnInResponse.data
      });

    } catch (error: any) {
      console.error('turnIn failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Handle specific errors
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.error?.message || 'Invalid turn-in request';
        
        return NextResponse.json({
          success: false,
          error: 'Invalid turn-in request',
          details: errorMessage,
          submissionState: submission?.state,
          googleError: errorData
        }, { status: 400 });
      }
      
      if (error.response?.status === 403) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.error?.message || 'Permission denied';
        
        // Check if it's a project permission issue
        if (errorMessage.includes('@ProjectPermissionDenied') || errorMessage.includes('Developer Console project is not permitted')) {
          return NextResponse.json({
            success: false,
            error: 'Project permissions required',
            details: 'The Google Cloud project needs additional permissions to use the Google Classroom API. This is a known limitation of the turnIn method.',
            googleError: errorData,
            suggestion: 'The turnIn method has restrictions that prevent it from working even with proper student OAuth credentials.'
          }, { status: 403 });
        }
        
        return NextResponse.json({
          success: false,
          error: 'Permission denied for turn-in',
          details: 'You do not have permission to turn in this submission. Only the student who owns the submission can turn it in.',
          googleError: errorData
        }, { status: 403 });
      }

      if (error.response?.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Submission not found',
          details: 'The submission might not exist or you do not have access to it'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        error: 'Turn-in failed',
        details: error.message || 'Unknown error occurred',
        googleError: error.response?.data
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in mark-as-done test API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

