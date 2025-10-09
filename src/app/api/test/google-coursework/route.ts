import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    const classroom = await getClassroom();

    // Fetch coursework from Google Classroom API
    const courseworkResponse = await classroom.courses.courseWork.list({
      courseId: courseId,
      pageSize: 100
    });

    const coursework = courseworkResponse.data.courseWork || [];

    // Find Pre-Survey coursework
    const preSurveyWork = coursework.find((cw: any) => 
      cw.title && cw.title.toLowerCase().includes('pre') && cw.title.toLowerCase().includes('survey')
    );

    return NextResponse.json({
      success: true,
      source: 'Google Classroom API',
      totalCoursework: coursework.length,
      preSurveyWork: preSurveyWork || null,
      allCourseworkTitles: coursework.map((cw: any) => ({
        title: cw.title,
        id: cw.id,
        workType: cw.workType,
        hasMaterials: !!cw.materials,
        materialsCount: cw.materials?.length || 0,
        materials: cw.materials // Full materials array
      }))
    });

  } catch (error) {
    console.error('Google coursework API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

