import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CertificateModel } from '@/models/Certificate';

export async function DELETE(req: NextRequest) {
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

    // Delete the certificate
    const result = await CertificateModel.deleteOne({
      studentEmail,
      courseId
    });

    if (result.deletedCount > 0) {
      console.log(`Certificate deleted for ${studentEmail} in course ${courseId}`);
      return NextResponse.json({
        success: true,
        message: 'Certificate deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No certificate found to delete'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Regenerate certificate API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

