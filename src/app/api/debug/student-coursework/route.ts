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
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No OAuth credentials' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
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

    // Fetch coursework
    const courseworkResponse = await classroom.courses.courseWork.list({
      courseId: courseId,
      pageSize: 100
    });

    const coursework = courseworkResponse.data.courseWork || [];

    return NextResponse.json({
      success: true,
      studentEmail: payload.email,
      courseId: courseId,
      totalCoursework: coursework.length,
      coursework: coursework.map(cw => ({
        id: cw.id,
        title: cw.title,
        description: cw.description,
        workType: cw.workType,
        state: cw.state,
        materials: cw.materials,
        dueDate: cw.dueDate,
        maxPoints: cw.maxPoints
      }))
    });

  } catch (error: any) {
    console.error('Debug coursework API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: error.code
    }, { status: 500 });
  }
}

