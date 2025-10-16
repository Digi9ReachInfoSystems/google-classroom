import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Comprehensive Service Account Diagnostic Tool
 * Tests various configurations to find the working setup
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL,
      delegatedAdmin: process.env.GOOGLE_DELEGATED_ADMIN,
      domain: process.env.GOOGLE_DOMAIN,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    },
    tests: []
  };

  // Test 1: Service Account WITHOUT delegation (as itself)
  try {
    console.log('\n=== TEST 1: Service Account as itself (no delegation) ===');
    const jwtClient = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
      ],
    });

    const classroom = google.classroom({ version: 'v1', auth: jwtClient });
    const response = await classroom.courses.list({ pageSize: 10 });
    
    results.tests.push({
      test: 'Service Account (no delegation)',
      status: 'SUCCESS',
      coursesFound: response.data.courses?.length || 0,
      message: 'Service account can access courses directly'
    });
  } catch (error: any) {
    results.tests.push({
      test: 'Service Account (no delegation)',
      status: 'FAILED',
      error: error.message,
      code: error.code
    });
  }

  // Test 2: Service Account WITH delegation (impersonating admin)
  try {
    console.log('\n=== TEST 2: Service Account with delegation (as admin) ===');
    const delegatedAdmin = process.env.GOOGLE_DELEGATED_ADMIN || 'admin@digi9.co.in';
    
    const jwtClient = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/classroom.profile.emails',
        'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
      ],
      subject: delegatedAdmin, // Impersonate this user
    });

    const classroom = google.classroom({ version: 'v1', auth: jwtClient });
    const response = await classroom.courses.list({ pageSize: 10 });
    
    results.tests.push({
      test: `Service Account with delegation (as ${delegatedAdmin})`,
      status: 'SUCCESS',
      coursesFound: response.data.courses?.length || 0,
      message: `Can access courses as ${delegatedAdmin}`
    });
  } catch (error: any) {
    results.tests.push({
      test: 'Service Account with delegation',
      status: 'FAILED',
      error: error.message,
      code: error.code,
      possibleReasons: [
        'Domain-wide delegation not enabled in Google Admin Console',
        'Service account not authorized for these scopes',
        'Delegated admin email does not exist or has no access',
        'API not enabled in Google Cloud Console'
      ]
    });
  }

  // Test 3: Try different admin emails
  const adminEmails = [
    'admin@digi9.co.in',
    'administrator@digi9.co.in',
    'superadmin@digi9.co.in',
  ];

  for (const adminEmail of adminEmails) {
    try {
      console.log(`\n=== TEST 3: Trying with ${adminEmail} ===`);
      
      const jwtClient = new JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: [
          'https://www.googleapis.com/auth/classroom.courses.readonly',
        ],
        subject: adminEmail,
      });

      const classroom = google.classroom({ version: 'v1', auth: jwtClient });
      const response = await classroom.courses.list({ pageSize: 5 });
      
      if (response.data.courses && response.data.courses.length > 0) {
        results.tests.push({
          test: `Alternative admin: ${adminEmail}`,
          status: 'SUCCESS',
          coursesFound: response.data.courses.length,
          message: `✅ FOUND WORKING ADMIN: ${adminEmail}`,
          recommendation: `Update GOOGLE_DELEGATED_ADMIN to ${adminEmail}`
        });
      } else {
        results.tests.push({
          test: `Alternative admin: ${adminEmail}`,
          status: 'NO_COURSES',
          message: `Admin exists but has no courses`
        });
      }
    } catch (error: any) {
      results.tests.push({
        test: `Alternative admin: ${adminEmail}`,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  // Test 4: Check if we can list users (Admin SDK)
  try {
    console.log('\n=== TEST 4: Admin SDK - List Users ===');
    const delegatedAdmin = process.env.GOOGLE_DELEGATED_ADMIN || 'admin@digi9.co.in';
    
    const jwtClient = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
      ],
      subject: delegatedAdmin,
    });

    const admin = google.admin({ version: 'directory_v1', auth: jwtClient });
    const response = await admin.users.list({
      domain: process.env.GOOGLE_DOMAIN,
      maxResults: 5
    });
    
    results.tests.push({
      test: 'Admin SDK - List Users',
      status: 'SUCCESS',
      usersFound: response.data.users?.length || 0,
      message: 'Service account has Admin SDK access',
      users: response.data.users?.map(u => u.primaryEmail)
    });
  } catch (error: any) {
    results.tests.push({
      test: 'Admin SDK - List Users',
      status: 'FAILED',
      error: error.message,
      message: 'Admin SDK access not configured'
    });
  }

  // Summary and recommendations
  const successfulTests = results.tests.filter((t: any) => t.status === 'SUCCESS' && t.coursesFound > 0);
  
  results.summary = {
    totalTests: results.tests.length,
    successful: successfulTests.length,
    failed: results.tests.filter((t: any) => t.status === 'FAILED').length,
    recommendation: successfulTests.length > 0 
      ? `✅ Found working configuration! Use: ${successfulTests[0].test}`
      : '❌ No working configuration found. Check domain-wide delegation setup.'
  };

  results.nextSteps = successfulTests.length === 0 ? [
    '1. Go to Google Admin Console (admin.google.com)',
    '2. Security → API Controls → Domain-wide Delegation',
    '3. Add service account client ID with these scopes:',
    '   - https://www.googleapis.com/auth/classroom.courses.readonly',
    '   - https://www.googleapis.com/auth/classroom.rosters.readonly',
    '   - https://www.googleapis.com/auth/classroom.coursework.students.readonly',
    '4. Ensure the delegated admin user has access to Google Classroom',
    '5. Wait 5-10 minutes for changes to propagate',
    '6. Re-run this test'
  ] : [
    '✅ Configuration is working!',
    'Update your .env file with the working admin email if different',
    'Use the comprehensive sync API to sync data to MongoDB'
  ];

  return NextResponse.json(results, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}
