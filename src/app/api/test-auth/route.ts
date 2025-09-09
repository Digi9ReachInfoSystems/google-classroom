import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { getClassroom } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false,
        message: 'No token found',
        hasToken: false
      }, { status: 401 });
    }

    const isValidToken = verifyAuthToken(token);
    if (!isValidToken) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid token',
        hasToken: true,
        isValidToken: false
      }, { status: 401 });
    }

    // Test Google Classroom API
    try {
      const classroom = getClassroom();
      const result = await classroom.courses.list({ pageSize: 1 });
      
      return NextResponse.json({
        success: true,
        message: 'Authentication and API access working',
        hasToken: true,
        isValidToken: true,
        apiWorking: true,
        coursesCount: result.data.courses?.length || 0
      });
    } catch (apiError: unknown) {
      return NextResponse.json({
        success: false,
        message: 'Authentication working but API access failed',
        hasToken: true,
        isValidToken: true,
        apiWorking: false,
        apiError: apiError instanceof Error ? apiError.message : String(apiError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in test auth:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
    }, { status: 500 });
  }
}

