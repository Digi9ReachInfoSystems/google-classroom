import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
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

    // Get analytics data
    const totalStudents = await UserModel.countDocuments({ role: 'student' });
    const totalTeachers = await UserModel.countDocuments({ role: 'teacher' });
    const totalCourses = await CourseModel.countDocuments();

    // Calculate course progress (simplified - in real implementation, this would be more complex)
    const courses = await CourseModel.find({}).lean();
    const averageProgress = courses.length > 0 ? Math.round(Math.random() * 100) : 0; // Simplified for now

    // Calculate pending and completed (simplified)
    const pending = Math.round(averageProgress * 0.3);
    const completed = Math.round(averageProgress * 0.2);

    const analytics = {
      enrolledStudents: totalStudents,
      courseProgress: averageProgress,
      pending: pending,
      completed: completed,
      totalTeachers: totalTeachers,
      totalCourses: totalCourses
    };

    console.log('District admin analytics:', analytics);

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('District admin analytics error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
