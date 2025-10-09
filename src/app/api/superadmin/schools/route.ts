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
    if (!payload || payload.role !== 'super-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();

    // Get unique school names from all students
    const schools = await UserModel.distinct('schoolName', { 
      role: 'student',
      schoolName: { $exists: true, $ne: null, $ne: '' }
    });

    return NextResponse.json({
      success: true,
      schools: schools.map(name => ({ name }))
    });

  } catch (error) {
    console.error('Super admin schools API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

