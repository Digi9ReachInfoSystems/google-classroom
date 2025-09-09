import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/google';

export async function GET(request: NextRequest) {
  try {
    // Test with minimal scopes first
    const minimalScopes = [
      'https://www.googleapis.com/auth/classroom.courses.readonly'
    ];

    console.log('Testing with minimal scopes:', minimalScopes);

    const auth = getAuth(minimalScopes);
    
    // Try to get an access token
    const authResult = await auth.authorize();
    
    return NextResponse.json({
      success: true,
      message: 'Minimal scopes work!',
      scopes: minimalScopes,
      hasAccessToken: !!authResult.access_token
    });

  } catch (error: unknown) {
    console.error('Scope test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      code: (error as { code?: number }).code,
      status: (error as { status?: number }).status,
      details: (error as { details?: unknown }).details || 'No additional details'
    }, { status: 500 });
  }
}
