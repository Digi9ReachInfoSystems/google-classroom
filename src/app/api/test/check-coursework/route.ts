import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseworkModel } from '@/models/Coursework';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    // Get all coursework for this course
    const allCoursework = await CourseworkModel.find({ courseId }).lean();

    // Find Pre-Survey coursework
    const preSurveyWork = allCoursework.find(cw => 
      cw.title && cw.title.toLowerCase().includes('pre') && cw.title.toLowerCase().includes('survey')
    );

    return NextResponse.json({
      success: true,
      totalCoursework: allCoursework.length,
      preSurveyWork: preSurveyWork || null,
      allCourseworkTitles: allCoursework.map(cw => ({
        title: cw.title,
        courseWorkId: cw.courseWorkId,
        hasMaterials: !!cw.materials,
        materialsCount: cw.materials?.length || 0,
        materials: cw.materials
      }))
    });

  } catch (error) {
    console.error('Check coursework API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

