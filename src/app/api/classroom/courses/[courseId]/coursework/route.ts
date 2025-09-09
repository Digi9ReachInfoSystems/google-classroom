import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    console.log('Fetching coursework for courseId:', courseId);

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const classroom = await getClassroom();
    
    // Fetch coursework (assignments) - this should work with classroom.coursework.students.readonly
    const courseworkResponse = await classroom.courses.courseWork.list({
      courseId: courseId,
    });

    // Fetch course materials - now using the configured scope
    const materialsResponse = await classroom.courses.courseWorkMaterials.list({
      courseId: courseId,
    });

    const coursework = courseworkResponse.data.courseWork || [];
    const materials = materialsResponse.data.courseWorkMaterial || [];

    return NextResponse.json({
      success: true,
      data: {
        coursework,
        materials,
        total: coursework.length + materials.length
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching coursework:', error);
    
    if ((error as { code?: number }).code === 403) {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
        { status: 403 }
      );
    }
    
    if ((error as { code?: number }).code === 404) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch coursework' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const { type, ...courseworkData } = body;

    console.log('Creating coursework for courseId:', courseId, 'type:', type);

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    if (!type || !['assignment', 'material'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type must be either "assignment" or "material"' },
        { status: 400 }
      );
    }

    const classroom = await getClassroom();
    let result;

    if (type === 'assignment') {
      // Create assignment - now using the configured scope
      result = await classroom.courses.courseWork.create({
        courseId: courseId,
        requestBody: {
          title: courseworkData.title,
          description: courseworkData.description,
          workType: 'ASSIGNMENT',
          state: courseworkData.state || 'PUBLISHED',
          dueDate: courseworkData.dueDate ? {
            year: new Date(courseworkData.dueDate).getFullYear(),
            month: new Date(courseworkData.dueDate).getMonth() + 1,
            day: new Date(courseworkData.dueDate).getDate(),
          } : undefined,
          dueTime: courseworkData.dueDate ? {
            hours: new Date(courseworkData.dueDate).getHours(),
            minutes: new Date(courseworkData.dueDate).getMinutes(),
          } : undefined,
          maxPoints: courseworkData.maxPoints ? parseFloat(courseworkData.maxPoints) : undefined,
          materials: courseworkData.materials || [],
          assigneeMode: courseworkData.assigneeMode || 'ALL_STUDENTS',
        }
      });
    } else {
      // Create course material - now using the configured scope
      result = await classroom.courses.courseWorkMaterials.create({
        courseId: courseId,
        requestBody: {
          title: courseworkData.title,
          description: courseworkData.description,
          materials: courseworkData.materials || [],
          state: courseworkData.state || 'PUBLISHED',
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error: unknown) {
    console.error('Error creating coursework:', error);
    
    if ((error as { code?: number }).code === 403) {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
        { status: 403 }
      );
    }
    
    if ((error as { code?: number }).code === 404) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create coursework' },
      { status: 500 }
    );
  }
}