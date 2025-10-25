import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No OAuth credentials found' 
      }, { status: 401 });
    }

    // Test different scope combinations
    const scopeTests = [
      {
        name: 'Current Application Scopes',
        scopes: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/classroom.courses.readonly',
          'https://www.googleapis.com/auth/classroom.rosters.readonly',
          'https://www.googleapis.com/auth/classroom.profile.emails',
          'https://www.googleapis.com/auth/classroom.announcements',
          'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
          'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
          'https://www.googleapis.com/auth/classroom.coursework.me',
          'https://www.googleapis.com/auth/classroom.coursework.students',
          'https://www.googleapis.com/auth/user.addresses.read',
          'https://www.googleapis.com/auth/user.phonenumbers.read',
          'https://www.googleapis.com/auth/user.birthday.read',
          'https://www.googleapis.com/auth/user.emails.read',
          'https://www.googleapis.com/auth/admin.directory.user.readonly'
        ]
      },
      {
        name: 'Minimal Classroom Access',
        scopes: [
          'https://www.googleapis.com/auth/classroom.courses.readonly',
          'https://www.googleapis.com/auth/classroom.rosters.readonly'
        ]
      },
      {
        name: 'Student Coursework Access',
        scopes: [
          'https://www.googleapis.com/auth/classroom.courses.readonly',
          'https://www.googleapis.com/auth/classroom.coursework.me',
          'https://www.googleapis.com/auth/classroom.student-submissions.me'
        ]
      },
      {
        name: 'Teacher Full Access',
        scopes: [
          'https://www.googleapis.com/auth/classroom.courses',
          'https://www.googleapis.com/auth/classroom.rosters',
          'https://www.googleapis.com/auth/classroom.coursework.students',
          'https://www.googleapis.com/auth/classroom.student-submissions.students',
          'https://www.googleapis.com/auth/classroom.announcements'
        ]
      }
    ];

    const results = [];

    for (const test of scopeTests) {
      try {
        console.log(`Testing: ${test.name}`);
        
        // Create OAuth2 client with test scopes
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_OAUTH_CLIENT_ID,
          process.env.GOOGLE_OAUTH_CLIENT_SECRET,
          process.env.GOOGLE_OAUTH_REDIRECT_URI
        );

        oauth2Client.setCredentials({
          access_token: payload.accessToken,
          refresh_token: payload.refreshToken
        });

        // Test Classroom API access
        const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
        
        let classroomTest = null;
        try {
          const coursesResponse = await classroom.courses.list({ pageSize: 1 });
          classroomTest = {
            success: true,
            coursesCount: coursesResponse.data.courses?.length || 0,
            message: 'Successfully accessed Classroom API'
          };
        } catch (classroomError: any) {
          classroomTest = {
            success: false,
            error: classroomError.message,
            status: classroomError.response?.status,
            message: 'Failed to access Classroom API'
          };
        }

        // Test People API access
        const people = google.people({ version: 'v1', auth: oauth2Client });
        let peopleTest = null;
        try {
          const profileResponse = await people.people.get({
            resourceName: 'people/me',
            personFields: 'emailAddresses,names'
          });
          peopleTest = {
            success: true,
            email: profileResponse.data.emailAddresses?.[0]?.value,
            name: profileResponse.data.names?.[0]?.displayName,
            message: 'Successfully accessed People API'
          };
        } catch (peopleError: any) {
          peopleTest = {
            success: false,
            error: peopleError.message,
            status: peopleError.response?.status,
            message: 'Failed to access People API'
          };
        }

        results.push({
          name: test.name,
          scopes: test.scopes,
          tests: {
            classroom: classroomTest,
            people: peopleTest
          },
          overallSuccess: classroomTest.success && peopleTest.success
        });

      } catch (error: any) {
        results.push({
          name: test.name,
          scopes: test.scopes,
          error: error.message,
          overallSuccess: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalTests: results.length,
        successfulTests: results.filter(r => r.overallSuccess).length,
        failedTests: results.filter(r => !r.overallSuccess).length
      },
      userInfo: {
        email: payload.email,
        role: payload.role,
        hasAccessToken: !!payload.accessToken,
        hasRefreshToken: !!payload.refreshToken
      }
    });

  } catch (error: any) {
    console.error('OAuth scopes test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test OAuth scopes',
      details: error.message
    }, { status: 500 });
  }
}
