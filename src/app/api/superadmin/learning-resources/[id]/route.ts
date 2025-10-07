import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { LearningResourceModel } from '@/models/LearningResource';

// PUT - Update learning resource
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get the params
    const { id } = await params;

    // Find and update the resource
    const resource = await LearningResourceModel.findByIdAndUpdate(
      id,
      {
        details: details.trim(),
        type,
        link: link?.trim() || undefined
      },
      { new: true }
    );

    if (!resource) {
      return NextResponse.json({
        success: false,
        message: 'Resource not found'
      }, { status: 404 });
    }

    console.log('Learning resource updated:', resource._id);

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
    console.error('Learning resource update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Delete learning resource
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get the params
    const { id } = await params;

    // Find and delete the resource
    const resource = await LearningResourceModel.findByIdAndDelete(id);

    if (!resource) {
      return NextResponse.json({
        success: false,
        message: 'Resource not found'
      }, { status: 404 });
    }

    console.log('Learning resource deleted:', resource._id);

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Learning resource deletion error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
