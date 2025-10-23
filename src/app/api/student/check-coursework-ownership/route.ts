import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { google } from 'googleapis';
import { ensureValidToken } from '@/lib/token-refresh';

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

    if (!courseId || !courseWorkId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: courseId, courseWorkId' 
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

    try {
      // Get coursework details
      const courseworkResponse = await classroom.courses.courseWork.get({
        courseId: courseId,
        id: courseWorkId
      });

      const coursework = courseworkResponse.data;

      // Check if this coursework is associated with our developer project
      const isAssociatedWithDeveloper = coursework.associatedWithDeveloper || false;
      const canTurnIn = isAssociatedWithDeveloper;

      // Get student submissions for this coursework
      const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: courseId,
        courseWorkId: courseWorkId,
        userId: payload.email,
        pageSize: 10
      });

      const submissions = submissionsResponse.data.studentSubmissions || [];

      return NextResponse.json({
        success: true,
        coursework: {
          id: coursework.id,
          title: coursework.title,
          description: coursework.description,
          state: coursework.state,
          associatedWithDeveloper: isAssociatedWithDeveloper,
          canTurnIn: canTurnIn,
          creationTime: coursework.creationTime,
          updateTime: coursework.updateTime
        },
        submissions: submissions.map(sub => ({
          id: sub.id,
          state: sub.state,
          userId: sub.userId,
          creationTime: sub.creationTime,
          updateTime: sub.updateTime,
          canTurnIn: canTurnIn && (sub.state === 'CREATED' || sub.state === 'NEW')
        })),
        analysis: {
          ownership: isAssociatedWithDeveloper 
            ? 'This coursework was created by an API project and can be turned in via API'
            : 'This coursework was created manually in Google Classroom UI and CANNOT be turned in via API',
          recommendation: isAssociatedWithDeveloper
            ? 'You can use the turnIn API to turn in submissions for this coursework'
            : 'You cannot use the turnIn API for this coursework. Use local completion instead.',
          stackOverflowReference: 'https://stackoverflow.com/questions/41951405/permission-denied-when-trying-to-turnin-the-studentsubmission-in-google-classroo'
        }
      });

    } catch (error: any) {
      console.error('Error checking coursework ownership:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to check coursework ownership',
        details: error.message || 'Unknown error occurred'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in coursework ownership check:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
