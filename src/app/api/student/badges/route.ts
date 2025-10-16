import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { BadgeModel, BadgeType } from '@/models/Badge';
import { BADGE_ORDER, TOTAL_BADGES } from '@/lib/badge-utils';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Get courseId from query params
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const studentEmail = payload.email;

    // Fetch all badges for this student in this course
    const badges = await BadgeModel.find({
      courseId,
      studentEmail
    });

    // Sort badges according to the defined order
    const sortedBadges = badges.sort((a, b) => {
      const aIndex = BADGE_ORDER.indexOf(a.badgeType);
      const bIndex = BADGE_ORDER.indexOf(b.badgeType);
      return aIndex - bIndex;
    });

    return NextResponse.json({
      success: true,
      totalBadges: TOTAL_BADGES,
      earnedCount: badges.length,
      badges: sortedBadges.map(badge => ({
        id: badge._id,
        badgeType: badge.badgeType,
        badgeIdentifier: badge.badgeIdentifier,
        title: badge.title,
        description: badge.description,
        awardedAt: badge.awardedAt
      }))
    });

  } catch (error) {
    console.error('Get badges API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

