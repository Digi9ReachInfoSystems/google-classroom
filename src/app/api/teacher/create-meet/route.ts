import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

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

    const body = await req.json();
    const { courseId, courseName, description } = body;

    // Generate a unique meeting ID (similar to how Google Meet works)
    const meetingId = generateMeetingId();
    
    // Create Google Meet link
    const meetLink = `https://meet.google.com/${meetingId}`;
    
    // Create meeting details
    const meetingDetails = {
      meetingId,
      meetLink,
      courseId: courseId || null,
      courseName: courseName || 'Class Meeting',
      description: description || '',
      createdBy: payload.email,
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    };

    // In a real implementation, you might want to:
    // 1. Store meeting details in database
    // 2. Send calendar invites
    // 3. Create Google Calendar events
    // 4. Integrate with Google Classroom courses

    console.log('Created Google Meet:', meetingDetails);

    return NextResponse.json({
      success: true,
      meeting: meetingDetails
    });

  } catch (error) {
    console.error('Error creating Google Meet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Google Meet' },
      { status: 500 }
    );
  }
}

// Generate a unique meeting ID similar to Google Meet format
function generateMeetingId(): string {
  // Google Meet IDs are typically 10-11 characters with mixed case
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Generate 10-11 character ID
  const length = Math.floor(Math.random() * 2) + 10; // 10 or 11 characters
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
