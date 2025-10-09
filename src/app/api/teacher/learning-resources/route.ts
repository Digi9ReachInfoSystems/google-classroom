import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { LearningResourceModel } from '@/models/LearningResource';

// GET - Fetch all learning resources (for teachers)
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

    await connectToDatabase();

    // Fetch all resources, sorted by most recent first
    const resources = await LearningResourceModel.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Format resources for frontend
    const formattedResources = resources.map((resource: any) => ({
      id: resource._id.toString(),
      details: resource.details,
      type: resource.type,
      link: resource.link || '',
      createdBy: resource.createdBy,
      createdAt: resource.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      resources: formattedResources
    });

  } catch (error) {
    console.error('Teacher learning resources GET error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
