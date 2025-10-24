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

    const { courseId, courseWorkId, submissionId } = await req.json();

    // Use the authenticated student's email directly
    const studentEmail = payload.email;
    console.log('Manual turnIn using authenticated student email:', studentEmail);

    if (!courseId || !courseWorkId || !submissionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: courseId, courseWorkId, submissionId' 
      }, { status: 400 });
    }

    console.log('Manual turnIn request:', {
      courseId,
      courseWorkId,
      submissionId,
      studentEmail: payload.email
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
        access_token: validAccessToken,
        refresh_token: validRefreshToken
      });

      // Initialize Google Classroom API
      const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

      // First, get the submission details to verify it exists and check its state
      console.log('Fetching submission details...');
      const submissionResponse = await classroom.courses.courseWork.studentSubmissions.get({
        courseId: courseId,
        courseWorkId: courseWorkId,
        id: submissionId
      });

      submission = submissionResponse.data;
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
          message: 'Submission already turned in',
          submissionId: submission.id,
          currentState: submission.state,
          alreadyTurnedIn: true
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

      // Perform the turnIn operation
      console.log('Attempting manual turnIn...');
      console.log('API call details:', {
        courseId,
        courseWorkId,
        submissionId,
        studentEmail: payload.email
      });

      const turnInResponse = await classroom.courses.courseWork.studentSubmissions.turnIn({
        courseId: courseId,
        courseWorkId: courseWorkId,
        id: submissionId
        // No requestBody needed for "Mark as Done"
      });

      console.log('✅ Manual turnIn successful');
      console.log('Turn-in response:', turnInResponse.data);

      return NextResponse.json({
        success: true,
        message: 'Submission turned in successfully',
        submissionId: submission.id,
        newState: 'TURNED_IN',
        googleClassroomResponse: turnInResponse.data,
        method: 'manual-turnin'
      });

    } catch (error: any) {
      console.error('Manual turnIn failed:', error);
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
        error: 'Manual turnIn failed',
        details: error.message || 'Unknown error occurred',
        googleError: error.response?.data
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in manual turnIn API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

// GET method to retrieve submission details without turning in
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const courseWorkId = searchParams.get('courseWorkId');
    const submissionId = searchParams.get('submissionId');

    if (!courseId || !courseWorkId || !submissionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: courseId, courseWorkId, submissionId' 
      }, { status: 400 });
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: tokenResult.accessToken,
      refresh_token: tokenResult.refreshToken
    });

    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

    // Get submission details
    const submissionResponse = await classroom.courses.courseWork.studentSubmissions.get({
      courseId: courseId,
      courseWorkId: courseWorkId,
      id: submissionId
    });

    const submission = submissionResponse.data;

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        state: submission.state,
        userId: submission.userId,
        courseWorkId: submission.courseWorkId,
        creationTime: submission.creationTime,
        updateTime: submission.updateTime,
        canTurnIn: submission.state === 'CREATED' || submission.state === 'NEW',
        isTurnedIn: submission.state === 'TURNED_IN' || submission.state === 'RETURNED'
      }
    });

  } catch (error: any) {
    console.error('Error fetching submission details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch submission details',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
