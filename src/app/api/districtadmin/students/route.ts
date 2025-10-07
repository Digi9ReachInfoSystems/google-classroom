import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

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

    // Get all students
    const students = await UserModel.find({ role: 'student' })
      .select('name email')
      .lean();

    // Transform data for frontend
    const studentData = students.map((student, index) => ({
      id: student._id.toString(),
      name: student.name || student.email.split('@')[0],
      email: student.email,
      pre: Math.random() > 0.5 ? 'ok' : 'warn',
      lesson: Math.round(Math.random() * 100),
      idea: Math.random() > 0.5 ? 'ok' : 'warn',
      post: Math.random() > 0.5 ? 'ok' : 'warn',
      cert: Math.random() > 0.5 ? 'ok' : 'warn'
    }));

    console.log(`Found ${studentData.length} students for district admin`);

    return NextResponse.json({
      success: true,
      students: studentData
    });

  } catch (error) {
    console.error('District admin students error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
