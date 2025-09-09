import { NextRequest, NextResponse } from 'next/server';
import { getAdminDirectory } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminDirectory = getAdminDirectory();
    
    // Test basic API access by listing users (limited to 1 for testing)
    const response = await adminDirectory.users.list({
      domain: 'yourdomain.com', // Replace with your actual domain
      maxResults: 1
    });

    return NextResponse.json({
      success: true,
      message: 'Admin Directory API is working',
      userCount: response.data.users?.length || 0,
      nextPageToken: response.data.nextPageToken ? 'Has more pages' : 'No more pages'
    });

  } catch (error: unknown) {
    console.error('Admin Directory API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      code: (error as { code?: number }).code,
      status: (error as { status?: number }).status,
      details: (error as { errors?: unknown; details?: unknown }).errors || (error as { errors?: unknown; details?: unknown }).details
    }, { status: 500 });
  }
}
