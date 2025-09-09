import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const delegatedAdmin = process.env.GOOGLE_DELEGATED_ADMIN;
    
    if (!clientEmail) {
      return NextResponse.json({
        success: false,
        error: 'GOOGLE_CLIENT_EMAIL not found in environment variables'
      }, { status: 400 });
    }

    // Extract project ID from client email
    const projectId = clientEmail.split('@')[1]?.split('.')[0];
    
    return NextResponse.json({
      success: true,
      serviceAccountEmail: clientEmail,
      projectId: projectId,
      delegatedAdmin: delegatedAdmin || 'Not set',
      instructions: [
        '1. Go to Google Cloud Console > APIs & Services > Credentials',
        '2. Find your service account and copy the Client ID',
        '3. Go to Google Workspace Admin Console > Security > API Controls > Domain-wide Delegation',
        '4. Add new API client with the Client ID and required scopes'
      ]
    });

  } catch (error: unknown) {
    console.error('Error getting service account info:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
