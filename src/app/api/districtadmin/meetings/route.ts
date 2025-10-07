import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { MeetingModel } from '@/models/Meeting';

// GET - Fetch meetings for district admin
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

    // Fetch all meetings (district admin can see all)
    const meetings = await MeetingModel.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`Found ${meetings.length} meetings for district admin`);

    return NextResponse.json({
      success: true,
      meetings: meetings.map(meeting => ({
        meetingId: meeting._id.toString(),
        meetLink: meeting.meetLink,
        courseId: meeting.courseId,
        courseName: meeting.courseName,
        description: meeting.description,
        createdBy: meeting.createdBy,
        createdAt: meeting.createdAt.toISOString(),
        status: meeting.status
      }))
    });

  } catch (error) {
    console.error('District admin meetings error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create new meeting
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
    const { courseId, courseName, description } = body;

    // Validate required fields
    if (!courseId || !courseName) {
      return NextResponse.json({
        success: false,
        message: 'CourseId and courseName are required'
      }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Generate a mock meet link (in real implementation, this would integrate with Google Meet API)
    const meetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;

    // Create new meeting
    const meeting = new MeetingModel({
      meetLink,
      courseId,
      courseName,
      description: description || `Meeting for ${courseName}`,
      createdBy: payload.email,
      status: 'scheduled'
    });

    await meeting.save();
    console.log('District admin meeting created:', meeting._id);

    return NextResponse.json({
      success: true,
      meeting: {
        meetingId: meeting._id.toString(),
        meetLink: meeting.meetLink,
        courseId: meeting.courseId,
        courseName: meeting.courseName,
        description: meeting.description,
        createdBy: meeting.createdBy,
        createdAt: meeting.createdAt.toISOString(),
        status: meeting.status
      }
    });

  } catch (error) {
    console.error('District admin meeting creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
