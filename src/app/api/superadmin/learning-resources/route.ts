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
    if (!payload || payload.role !== 'super-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    // Fetch all learning resources
    const resources = await LearningResourceModel.find({})
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    console.log(`Found ${resources.length} learning resources`);

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
    console.error('Learning resources GET API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create new learning resource
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

    const body = await req.json();
    const { details, type, link } = body;

    // Validate required fields
    if (!details || !type) {
      return NextResponse.json({
        success: false,
        message: 'Details and type are required'
      }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Create new learning resource
    const resource = new LearningResourceModel({
      details: details.trim(),
      type,
      link: link?.trim() || undefined,
      createdBy: payload.email
    });

    await resource.save();
    console.log('Learning resource created:', resource._id);

    return NextResponse.json({
      success: true,
      resource: {
        id: resource._id.toString(),
        details: resource.details,
        type: resource.type,
        link: resource.link,
        createdBy: resource.createdBy,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Learning resource creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
