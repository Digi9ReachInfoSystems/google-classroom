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
    if (!payload || payload.role !== 'super-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No OAuth credentials found' 
      }, { status: 401 });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });

    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

    // Fetch courses where the super admin is a teacher
    const coursesResponse = await classroom.courses.list({
      teacherId: 'me',
      pageSize: 100,
      courseStates: ['ACTIVE']
    });

    const courses = (coursesResponse.data.courses || []).map((course: any) => ({
      id: course.id,
      name: course.name,
      section: course.section,
      descriptionHeading: course.descriptionHeading,
      room: course.room,
      ownerId: course.ownerId,
      creationTime: course.creationTime,
      updateTime: course.updateTime,
      enrollmentCode: course.enrollmentCode,
      courseState: course.courseState,
      alternateLink: course.alternateLink
    }));

    return NextResponse.json({
      success: true,
      courses
    });

  } catch (error) {
    console.error('Super admin courses API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

