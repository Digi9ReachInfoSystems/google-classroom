import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; courseworkId: string }> }
) {
  try {
    const { courseId, courseworkId } = await params;
    console.log('Fetching coursework item:', courseworkId, 'for course:', courseId);

    if (!courseId || !courseworkId) {
      return NextResponse.json(
        { success: false, error: 'Course ID and Coursework ID are required' },
        { status: 400 }
      );
    }

    const classroom = await getClassroom();
    
    // Try to fetch as assignment first
    try {
      const result = await classroom.courses.courseWork.get({
        courseId: courseId,
        id: courseworkId,
      });
      
      return NextResponse.json({
        success: true,
        data: result.data,
        type: 'assignment'
      });
    } catch (assignmentError) {
      // If not found as assignment, try as material
      try {
        const result = await classroom.courses.courseWorkMaterials.get({
          courseId: courseId,
          id: courseworkId,
        });
        
        return NextResponse.json({
          success: true,
          data: result.data,
          type: 'material'
        });
      } catch (materialError) {
        return NextResponse.json(
          { success: false, error: 'Coursework item not found' },
          { status: 404 }
        );
      }
    }

  } catch (error: unknown) {
    console.error('Error fetching coursework item:', error);
    
    if ((error as { code?: number }).code === 403) {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
        { status: 403 }
      );
    }
    
    if ((error as { code?: number }).code === 404) {
      return NextResponse.json(
        { success: false, error: 'Coursework item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) || 'Failed to fetch coursework item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; courseworkId: string }> }
) {
  try {
    const { courseId, courseworkId } = await params;
    const body = await request.json();
    const { type, ...updateData } = body;

    console.log('Updating coursework item:', courseworkId, 'for course:', courseId, 'type:', type);

    if (!courseId || !courseworkId) {
      return NextResponse.json(
        { success: false, error: 'Course ID and Coursework ID are required' },
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
      // Update assignment
      result = await classroom.courses.courseWork.patch({
        courseId: courseId,
        id: courseworkId,
        requestBody: {
          title: updateData.title,
          description: updateData.description,
          state: updateData.state,
          dueDate: updateData.dueDate ? {
            year: new Date(updateData.dueDate).getFullYear(),
            month: new Date(updateData.dueDate).getMonth() + 1,
            day: new Date(updateData.dueDate).getDate(),
          } : undefined,
          dueTime: updateData.dueDate ? {
            hours: new Date(updateData.dueDate).getHours(),
            minutes: new Date(updateData.dueDate).getMinutes(),
          } : undefined,
          maxPoints: updateData.maxPoints ? parseFloat(updateData.maxPoints) : undefined,
          materials: updateData.materials || [],
          assigneeMode: updateData.assigneeMode || 'ALL_STUDENTS',
        }
      });
    } else {
      // Update course material
      result = await classroom.courses.courseWorkMaterials.patch({
        courseId: courseId,
        id: courseworkId,
        requestBody: {
          title: updateData.title,
          description: updateData.description,
          materials: updateData.materials || [],
          state: updateData.state,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error: unknown) {
    console.error('Error updating coursework item:', error);
    
    if ((error as { code?: number }).code === 403) {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
        { status: 403 }
      );
    }
    
    if ((error as { code?: number }).code === 404) {
      return NextResponse.json(
        { success: false, error: 'Coursework item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) || 'Failed to update coursework item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; courseworkId: string }> }
) {
  try {
    const { courseId, courseworkId } = await params;
    console.log('Deleting coursework item:', courseworkId, 'for course:', courseId);

    if (!courseId || !courseworkId) {
      return NextResponse.json(
        { success: false, error: 'Course ID and Coursework ID are required' },
        { status: 400 }
      );
    }

    const classroom = await getClassroom();
    
    // Try to delete as assignment first
    try {
      await classroom.courses.courseWork.delete({
        courseId: courseId,
        id: courseworkId,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Assignment deleted successfully'
      });
    } catch (assignmentError) {
      // If not found as assignment, try as material
      try {
        await classroom.courses.courseWorkMaterials.delete({
          courseId: courseId,
          id: courseworkId,
        });
        
        return NextResponse.json({
          success: true,
          message: 'Material deleted successfully'
        });
      } catch (materialError) {
        return NextResponse.json(
          { success: false, error: 'Coursework item not found' },
          { status: 404 }
        );
      }
    }

  } catch (error: unknown) {
    console.error('Error deleting coursework item:', error);
    
    if ((error as { code?: number }).code === 403) {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
        { status: 403 }
      );
    }
    
    if ((error as { code?: number }).code === 404) {
      return NextResponse.json(
        { success: false, error: 'Coursework item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) || 'Failed to delete coursework item' },
      { status: 500 }
    );
  }
}
