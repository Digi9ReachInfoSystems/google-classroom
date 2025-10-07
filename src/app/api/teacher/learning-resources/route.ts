import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { LearningResourceModel } from '@/models/LearningResource';

// GET - Fetch all learning resources for teachers
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

    // Connect to database
    await connectToDatabase();

    // Fetch all learning resources (teachers can view all resources)
    const resources = await LearningResourceModel.find({})
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    console.log(`Found ${resources.length} learning resources for teacher ${payload.email}`);

    return NextResponse.json({
      success: true,
      resources: resources.map(resource => ({
        id: resource._id.toString(),
        details: resource.details,
        type: resource.type,
        link: resource.link,
        createdBy: resource.createdBy,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString()
      })),
      total: resources.length
    });

  } catch (error) {
    console.error('Teacher learning resources API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
