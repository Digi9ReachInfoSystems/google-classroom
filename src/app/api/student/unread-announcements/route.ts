import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { AnnouncementReadModel } from '@/models/AnnouncementRead';
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

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const studentEmail = payload.email;

    // Get last read timestamp for this course
    const readRecord = await AnnouncementReadModel.findOne({
      studentEmail,
      courseId
    });

    // Fetch announcements from Google Classroom
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
    
    const response = await classroom.courses.announcements.list({
      courseId: courseId,
      pageSize: 10,
      orderBy: 'updateTime desc'
    });

    const announcements = response.data.announcements || [];
    
    // Count unread announcements (created after last read time)
    let unreadCount = 0;
    if (readRecord) {
      unreadCount = announcements.filter(announcement => {
        const creationTime = new Date(announcement.creationTime || '');
        return creationTime > readRecord.lastReadAt;
      }).length;
    } else {
      // If never read, all are unread
      unreadCount = announcements.length;
    }

    return NextResponse.json({
      success: true,
      unreadCount,
      hasUnread: unreadCount > 0
    });

  } catch (error) {
    console.error('Unread announcements API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Mark announcements as read
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const studentEmail = payload.email;

    // Update or create read record
    await AnnouncementReadModel.findOneAndUpdate(
      { studentEmail, courseId },
      { 
        studentEmail, 
        courseId, 
        lastReadAt: new Date() 
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Announcements marked as read'
    });

  } catch (error) {
    console.error('Mark announcements read API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

