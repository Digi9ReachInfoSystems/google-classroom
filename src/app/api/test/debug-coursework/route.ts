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
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Check if user has OAuth credentials
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No Google OAuth credentials found. Please log in again.' 
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

    // Create OAuth2 client with user's credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });

    // Fetch coursework directly from Google Classroom API using user's OAuth
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    const courseworkResponse = await classroom.courses.courseWork.list({
      courseId: courseId,
      pageSize: 100
    });

    const allCoursework = courseworkResponse.data.courseWork || [];

    // Find Pre-Survey coursework
    const preSurveyWork = allCoursework.find((cw: any) => 
      cw.title && cw.title.toLowerCase().includes('pre') && cw.title.toLowerCase().includes('survey')
    );

    return NextResponse.json({
      success: true,
      totalCoursework: allCoursework.length,
      preSurveyWork: preSurveyWork ? {
        id: preSurveyWork.id,
        title: preSurveyWork.title,
        description: preSurveyWork.description,
        workType: preSurveyWork.workType,
        materials: preSurveyWork.materials,
        // Show full object for debugging
        fullObject: preSurveyWork
      } : null,
      allCourseworkTitles: allCoursework.map((cw: any) => ({
        id: cw.id,
        title: cw.title,
        workType: cw.workType,
        hasMaterials: !!cw.materials,
        materialsCount: cw.materials?.length || 0
      }))
    });

  } catch (error) {
    console.error('Debug coursework API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

