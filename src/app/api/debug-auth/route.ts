import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const delegatedAdmin = process.env.GOOGLE_DELEGATED_ADMIN;
    
    const scopes = [
      'https://www.googleapis.com/auth/admin.directory.user',
      'https://www.googleapis.com/auth/admin.directory.userschema',
      'https://www.googleapis.com/auth/admin.directory.orgunit',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.directory.domain'
    ];

    // Test JWT creation
    let jwt;
    try {
      jwt = new google.auth.JWT({
        email: clientEmail,
        key: privateKey?.replace(/\\n/g, '\n'),
        scopes,
        subject: delegatedAdmin,
      });
    } catch (jwtError: unknown) {
      return NextResponse.json({
        success: false,
        error: 'JWT creation failed',
        details: jwtError instanceof Error ? jwtError.message : String(jwtError),
        envVars: {
          clientEmail: clientEmail ? 'Set' : 'Missing',
          privateKey: privateKey ? 'Set' : 'Missing',
          delegatedAdmin: delegatedAdmin ? 'Set' : 'Missing'
        }
      }, { status: 500 });
    }

    // Test token generation
    let accessToken;
    try {
      const auth = await jwt.authorize();
      accessToken = auth.access_token;
    } catch (authError: unknown) {
      return NextResponse.json({
        success: false,
        error: 'Token authorization failed',
        details: authError instanceof Error ? authError.message : String(authError),
        code: (authError as { code?: number }).code,
        status: (authError as { status?: number }).status,
        scopes: scopes,
        clientEmail,
        delegatedAdmin
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      accessToken: accessToken ? 'Generated' : 'Failed',
      scopes,
      clientEmail,
      delegatedAdmin,
      nextSteps: [
        '1. If authentication succeeded, the issue is with domain-wide delegation',
        '2. Make sure you added the Client ID to Google Workspace Admin Console',
        '3. Verify the OAuth scopes are exactly as shown above',
        '4. Wait a few minutes for changes to propagate'
      ]
    });

  } catch (error: unknown) {
    console.error('Auth debug error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
