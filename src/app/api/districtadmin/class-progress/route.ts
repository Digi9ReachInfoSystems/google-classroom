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
    if (!payload || payload.role !== 'district-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Generate class progress data (simplified for now)
    const classProgressData = [
      { stage: "Pre Survey", y2025: Math.round(Math.random() * 50) + 10 },
      { stage: "Course completed", y2025: Math.round(Math.random() * 30) + 60 },
      { stage: "idea submission", y2025: Math.round(Math.random() * 20) + 70 },
      { stage: "Post Survey", y2025: Math.round(Math.random() * 40) + 10 },
      { stage: "certificate", y2025: Math.round(Math.random() * 25) + 65 },
    ];

    console.log('District admin class progress data generated');

    return NextResponse.json({
      success: true,
      data: classProgressData
    });

  } catch (error) {
    console.error('District admin class progress error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
