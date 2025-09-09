import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    return NextResponse.json({
      success: true,
      message: 'Course ID received successfully',
      courseId: courseId,
      courseIdType: typeof courseId,
      courseIdLength: courseId.length
    });

  } catch (error) {
    console.error('Error in test course endpoint:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to process course ID',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

