import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-oauth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role } = body;

    // Validate required fields
    if (!role || (role !== 'district-admin' && role !== 'super-admin')) {
      return NextResponse.json({
        success: false,
        message: 'Valid role (district-admin or super-admin) is required'
      }, { status: 400 });
    }

    // Create OAuth2 client for admin login
    const oauth2Client = getOAuth2Client();
    
    // Generate Google OAuth URL with admin role parameter
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
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
      ],
      prompt: 'select_account',
      include_granted_scopes: true,
      state: `admin-${role}` // Pass the role in state parameter
    });

    console.log(`Redirecting to Google OAuth for ${role} admin login`);

    // Return the OAuth URL for frontend to redirect
    return NextResponse.json({
      success: true,
      message: 'Redirecting to Google OAuth',
      authUrl: authUrl
    });

  } catch (error) {
    console.error('Admin OAuth redirect error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
