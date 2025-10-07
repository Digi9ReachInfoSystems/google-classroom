import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';

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

    // Check if we have OAuth tokens
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No OAuth tokens found. Please log in again.' 
      }, { status: 401 });
    }

    // Get courseId from query parameters for filtering
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({
        success: false,
        error: 'Course ID is required'
      }, { status: 400 });
    }

    // Initialize Google Classroom API with user's OAuth credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });
    
    const classroom = getClassroomWithUserAuth(oauth2Client);

    try {
      console.log('Fetching announcements for course:', courseId);
      
      // Fetch announcements from Google Classroom
      const announcementsResponse = await classroom.courses.announcements.list({
        courseId: courseId,
        pageSize: 20,
        orderBy: 'updateTime desc'
      });

      const announcements = announcementsResponse.data.announcements || [];
      
      console.log(`Found ${announcements.length} announcements for student`);

      return NextResponse.json({
        success: true,
        announcements: announcements.map(announcement => ({
          id: announcement.id,
          courseId: courseId,
          text: announcement.text,
          state: announcement.state,
          creationTime: announcement.creationTime,
          updateTime: announcement.updateTime,
          creatorUserId: announcement.creatorUserId
        })),
        total: announcements.length
      });

    } catch (googleError: unknown) {
      console.error('Google Classroom API error:', googleError);
      
      if ((googleError as { code?: number }).code === 403) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch announcements from Google Classroom' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}