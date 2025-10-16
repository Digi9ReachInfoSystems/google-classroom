import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';

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

    // Get all courses from database
    const courses = await CourseModel.find({})
      .select('courseId name')
      .lean();

    console.log(`Found ${courses.length} courses for district admin`);

    return NextResponse.json({
      success: true,
      courses: courses.map(course => ({
        id: course.courseId,
        name: course.name || 'Unnamed Course'
      }))
    });

  } catch (error) {
    console.error('District admin courses error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
