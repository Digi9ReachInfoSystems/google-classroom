import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { LearningResourceModel } from '@/models/LearningResource';

// GET - Fetch a single learning resource
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const resource = await LearningResourceModel.findById(id).lean() as any;

    if (!resource) {
      return NextResponse.json({
        success: false,
        message: 'Resource not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      resource: {
        id: resource._id.toString(),
        details: resource.details,
        type: resource.type,
        link: resource.link || '',
        createdBy: resource.createdBy,
        createdAt: resource.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Learning resource GET error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update a learning resource
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;
    const updatedResource = await LearningResourceModel.findByIdAndUpdate(
      id,
      {
        details,
        type,
        link: link || '',
      },
      { new: true }
    );

    if (!updatedResource) {
      return NextResponse.json({
        success: false,
        message: 'Resource not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Resource updated successfully',
      resource: {
        id: updatedResource._id.toString(),
        details: updatedResource.details,
        type: updatedResource.type,
        link: updatedResource.link || '',
        createdBy: updatedResource.createdBy,
        createdAt: updatedResource.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Learning resource PUT error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete a learning resource
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'super-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();

    const { id } = await params;
    const deletedResource = await LearningResourceModel.findByIdAndDelete(id);

    if (!deletedResource) {
      return NextResponse.json({
        success: false,
        message: 'Resource not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Learning resource DELETE error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
