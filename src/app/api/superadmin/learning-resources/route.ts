import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { LearningResourceModel } from '@/models/LearningResource';

// GET - Fetch all learning resources
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
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
    console.error('Learning resources GET error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create a new learning resource
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { details, type, link } = body;

    // Validate required fields
    if (!details || !type) {
      return NextResponse.json({
        success: false,
        message: 'Details and type are required'
      }, { status: 400 });
    }

    // Validate type
    const validTypes = ['Video', 'Document', 'Link', 'Image', 'Other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid resource type'
      }, { status: 400 });
    }

    // Create new resource
    const newResource = await LearningResourceModel.create({
      details,
      type,
      link: link || '',
      createdBy: payload.name || payload.email,
      createdByEmail: payload.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Resource created successfully',
      resource: {
        id: newResource._id.toString(),
        details: newResource.details,
        type: newResource.type,
        link: newResource.link || '',
        createdBy: newResource.createdBy,
        createdAt: newResource.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Learning resources POST error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
