import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if we have OAuth tokens
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No OAuth tokens found. Please log in again.' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, text } = body;

    if (!courseId || !text?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Course ID and announcement text are required'
      }, { status: 400 });
    }

    // Initialize Google Classroom API with user's OAuth credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });
    
    const classroom = getClassroomWithUserAuth(oauth2Client);

    try {
      console.log('Creating announcement for course:', courseId);
      
      // Create announcement in Google Classroom
      const announcementResponse = await classroom.courses.announcements.create({
        courseId: courseId,
        requestBody: {
          text: text.trim(),
          state: 'PUBLISHED'
        }
      });

      console.log('Announcement created successfully:', announcementResponse.data);

      return NextResponse.json({
        success: true,
        announcement: {
          id: announcementResponse.data.id,
          courseId: courseId,
          text: announcementResponse.data.text,
          state: announcementResponse.data.state,
          creationTime: announcementResponse.data.creationTime,
          updateTime: announcementResponse.data.updateTime,
          creatorUserId: announcementResponse.data.creatorUserId
        }
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
        { success: false, error: 'Failed to create announcement in Google Classroom' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'teacher') {
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
      
      console.log(`Found ${announcements.length} announcements`);

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
