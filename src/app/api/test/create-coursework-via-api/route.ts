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

    const { courseId, title, description } = await req.json();

    if (!courseId || !title) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: courseId, title' 
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
      // Create coursework via API
      console.log('Creating coursework via API...');
      const courseworkResponse = await classroom.courses.courseWork.create({
        courseId: courseId,
        requestBody: {
          title: title,
          description: description || 'Assignment created via API - this should allow turnIn',
          workType: 'ASSIGNMENT',
          state: 'PUBLISHED',
          maxPoints: 100,
          dueDate: {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate() + 7
          },
          dueTime: {
            hours: 23,
            minutes: 59
          }
        }
      });

      const coursework = courseworkResponse.data;
      console.log('✅ Coursework created via API:', coursework.id);

      // Check if it's associated with our developer project
      const isAssociatedWithDeveloper = coursework.associatedWithDeveloper || false;
      
      return NextResponse.json({
        success: true,
        message: 'Coursework created via API',
        coursework: {
          id: coursework.id,
          title: coursework.title,
          description: coursework.description,
          state: coursework.state,
          associatedWithDeveloper: isAssociatedWithDeveloper,
          canTurnIn: isAssociatedWithDeveloper,
          creationTime: coursework.creationTime
        },
        analysis: {
          ownership: isAssociatedWithDeveloper 
            ? '✅ This coursework was created by our API project and CAN be turned in via API'
            : '❌ This coursework is NOT associated with our developer project',
          recommendation: isAssociatedWithDeveloper
            ? 'You can now use the turnIn API for this coursework'
            : 'Something went wrong - coursework should be associated with our project',
          testNextStep: isAssociatedWithDeveloper
            ? 'Try using the manual turnIn API with this coursework ID'
            : 'Check Google Cloud Console project settings'
        },
        testInstructions: {
          manualTurnIn: `POST /api/student/manual-turnin with {"courseId":"${courseId}","courseWorkId":"${coursework.id}","submissionId":"SUBMISSION_ID"}`,
          markAsDone: `POST /api/student/mark-as-done with {"courseId":"${courseId}","courseWorkId":"${coursework.id}"}`
        }
      });

    } catch (error: any) {
      console.error('Error creating coursework via API:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create coursework via API',
        details: error.message || 'Unknown error occurred',
        googleError: error.response?.data
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in create coursework API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
