import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { CourseModel } from '@/models/Course';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { SubmissionModel } from '@/models/Submission';
import { AnalyticsModel } from '@/models/Analytics';
import { SchoolModel } from '@/models/School';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'district-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    // Fetch user's district from database
    let user = await UserModel.findOne({ email: payload.email }).select('district');
    
    // If user doesn't exist, create them
    if (!user) {
      user = await UserModel.create({
        email: payload.email,
        role: 'district-admin',
        district: null // Will need to be set later
      });
      console.log('Created district admin user:', payload.email);
    }
    
    const userDistrict = user.district || null;
    console.log('District admin district:', userDistrict);

    // Get district overview data
    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      activeCourses,
      totalSubmissions,
      completedSubmissions,
      schools,
      recentAnalytics
    ] = await Promise.all([
      // Student count in district
      UserModel.countDocuments({ role: 'student', district: userDistrict }),
      
      // Teacher count in district
      UserModel.countDocuments({ role: 'teacher', district: userDistrict }),
      
      // Total courses in district
      CourseModel.countDocuments(),
      
      // Active courses
      CourseModel.countDocuments({ courseState: 'ACTIVE' }),
      
      // Total submissions
      SubmissionModel.countDocuments(),
      
      // Completed submissions
      SubmissionModel.countDocuments({ state: 'TURNED_IN' }),
      
      // Schools in district
      SchoolModel.find({ district: userDistrict }).select('name enrollmentCount teacherCount activeCourses'),
      
      // Recent analytics
      AnalyticsModel.find({ 
        district: userDistrict,
        calculatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).sort({ calculatedAt: -1 }).limit(10)
    ]);

    // Calculate completion rate
    const completionRate = totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0;

    // Calculate engagement metrics
    const studentsWithSubmissions = await SubmissionModel.distinct('userEmail', {
      userEmail: { $in: await UserModel.distinct('email', { role: 'student', district: userDistrict }) }
    });
    const engagementRate = totalStudents > 0 ? (studentsWithSubmissions.length / totalStudents) * 100 : 0;

    // Get recent sync status
    const lastSync = await AnalyticsModel.findOne({ 
      district: userDistrict 
    }).sort({ calculatedAt: -1 });

    const overview = {
      district: userDistrict,
      summary: {
        totalStudents,
        totalTeachers,
        totalCourses,
        activeCourses,
        schools: schools.length,
        completionRate: Math.round(completionRate * 100) / 100,
        engagementRate: Math.round(engagementRate * 100) / 100
      },
      schools: schools.map(school => ({
        name: school.name,
        enrollmentCount: school.enrollmentCount || 0,
        teacherCount: school.teacherCount || 0,
        activeCourses: school.activeCourses || 0
      })),
      recentActivity: {
        totalSubmissions,
        completedSubmissions,
        lastSyncTime: lastSync?.calculatedAt || null
      },
      analytics: recentAnalytics.map(analytics => ({
        metricType: analytics.metricType,
        metricValue: analytics.metricValue,
        metricUnit: analytics.metricUnit,
        period: analytics.period,
        calculatedAt: analytics.calculatedAt
      }))
    };

    return NextResponse.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('District overview API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
