import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ReportModel } from '@/models/Report';

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

    // Get course ID from query parameters
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Fetch reports from database for the specific course and teacher
    const reports = await ReportModel.find({
      courseId: courseId,
      teacherEmail: payload.email
    })
    .sort({ generatedAt: -1 }) // Most recent first
    .lean();

    console.log(`Found ${reports.length} reports for course ${courseId} and teacher ${payload.email}`);

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
        id: (report._id as any).toString(),
        fileName: report.fileName,
        courseName: report.courseName,
        courseId: report.courseId,
        generatedAt: report.generatedAt ? new Date(report.generatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        fileSize: report.fileSize,
        focalPoints: report.focalPoints || [],
        filters: report.filters || { age: 'All', grade: 'All', gender: 'All', disability: 'All' },
        reportType: report.reportType,
        filePath: report.filePath
      })),
      total: reports.length
    });

  } catch (error) {
    console.error('Reports list API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
