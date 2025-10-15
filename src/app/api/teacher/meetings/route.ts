import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

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

    // Get courseId from query parameters for filtering
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    // In a real implementation, you would fetch from database
    // For now, we'll return mock data or empty array
    const meetings: any[] = [
      // Example meeting data - in real app this would come from database
      // {
      //   meetingId: 'abc123def4',
      //   meetLink: 'https://meet.google.com/abc123def4',
      //   courseId: 'course123',
      //   courseName: 'Mathematics 101',
      //   description: 'Algebra review session',
      //   createdBy: payload.email,
      //   createdAt: '2024-01-15T10:00:00Z',
      //   status: 'scheduled'
      // }
    ];

    // Filter by courseId if provided
    const filteredMeetings = courseId 
      ? meetings.filter(meeting => meeting.courseId === courseId)
      : meetings;

    return NextResponse.json({
      success: true,
      meetings: filteredMeetings,
      total: filteredMeetings.length
    });

  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}
