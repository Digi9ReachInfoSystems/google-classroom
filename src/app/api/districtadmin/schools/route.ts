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

    // Get unique school names from users in the district
    const schoolNames = await UserModel.distinct('schoolName', {
      schoolName: { $exists: true, $ne: null, $ne: '' }
    });

    const schools = schoolNames.map((name, index) => ({
      id: name,
      name: name
    }));

    console.log(`Found ${schools.length} schools`);

    return NextResponse.json({
      success: true,
      schools
    });

  } catch (error) {
    console.error('District admin schools API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
