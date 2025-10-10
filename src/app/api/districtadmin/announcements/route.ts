import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { AnnouncementModel } from '@/models/Announcement';

// GET - Fetch announcements for district admin
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'district-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    // Fetch all announcements (district admin can see all)
    const announcements = await AnnouncementModel.find({})
      .sort({ creationTime: -1 })
      .limit(10)
      .lean();

    console.log(`Found ${announcements.length} announcements for district admin`);

    return NextResponse.json({
      success: true,
      announcements: announcements.map((announcement: any) => ({
        id: announcement._id.toString(),
        text: announcement.text,
        creationTime: announcement.creationTime.toISOString(),
        updateTime: announcement.updateTime.toISOString(),
        creatorUserId: announcement.creatorUserId,
        courseId: announcement.courseId
      }))
    });

  } catch (error) {
    console.error('District admin announcements error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create new announcement
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'district-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { text, courseId } = body;

    // Validate required fields
    if (!text || !courseId) {
      return NextResponse.json({
        success: false,
        message: 'Text and courseId are required'
      }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Create new announcement
    const announcement = new AnnouncementModel({
      text: text.trim(),
      courseId,
      creatorUserId: payload.userId || payload.email,
      creationTime: new Date(),
      updateTime: new Date(),
      state: 'PUBLISHED'
    });

    await announcement.save();
    console.log('District admin announcement created:', announcement._id);

    return NextResponse.json({
      success: true,
      announcement: {
        id: announcement._id.toString(),
        text: announcement.text,
        creationTime: announcement.creationTime.toISOString(),
        updateTime: announcement.updateTime.toISOString(),
        creatorUserId: announcement.creatorUserId,
        courseId: announcement.courseId
      }
    });

  } catch (error) {
    console.error('District admin announcement creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
