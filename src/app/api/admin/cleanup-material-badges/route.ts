import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { BadgeModel } from '@/models/Badge';

export async function POST(req: NextRequest) {
  try {
    // Check authentication - admin only
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'super-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();

    // Find all badges that might be for materials/courses
    const allBadges = await BadgeModel.find({});
    
    let deletedCount = 0;
    const deletedBadges = [];

    for (const badge of allBadges) {
      const title = (badge.title || '').toLowerCase();
      const isMaterial = title.includes('course') || title.includes('cours ') || 
                        title.includes('material') || title.includes('mat ');
      
      // If it's a material badge, delete it
      if (isMaterial) {
        await BadgeModel.deleteOne({ _id: badge._id });
        deletedCount++;
        deletedBadges.push({
          id: badge._id,
          title: badge.title,
          badgeType: badge.badgeType,
          studentEmail: badge.studentEmail,
          courseId: badge.courseId
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} material badges`,
      deletedCount,
      deletedBadges
    });

  } catch (error) {
    console.error('Cleanup material badges API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
