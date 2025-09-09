import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/google';

export async function GET(request: NextRequest) {
  try {
    // Test the courseworkmaterials scope
    const materialsScope = 'https://www.googleapis.com/auth/classroom.courseworkmaterials';
    
    console.log('Testing materials scope:', materialsScope);

    const auth = getAuth([materialsScope]);
    
    // Try to get an access token
    const authResult = await auth.authorize();
    
    return NextResponse.json({
      success: true,
      message: 'Materials scope works!',
      scope: materialsScope,
      hasAccessToken: !!authResult.access_token,
      tokenType: authResult.token_type,
      expiresIn: authResult.expiry_date
    });

  } catch (error: unknown) {
    console.error('Materials scope test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      code: (error as { code?: number }).code,
      status: (error as { status?: number }).status,
      details: (error as { details?: unknown }).details || 'No additional details',
      response: (error as { response?: { data?: unknown } }).response?.data || 'No response data'
    }, { status: 500 });
  }
}
