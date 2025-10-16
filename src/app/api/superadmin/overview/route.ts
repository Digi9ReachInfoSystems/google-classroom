import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { CourseModel } from '@/models/Course';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { SubmissionModel } from '@/models/Submission';
import { AnalyticsModel } from '@/models/Analytics';
import { SchoolModel } from '@/models/School';
import { SyncLogModel } from '@/models/SyncLog';

export async function GET(req: NextRequest) {
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

    // Get system-wide overview data
    const [
      totalStudents,
      totalTeachers,
      totalDistrictAdmins,
      totalSuperAdmins,
      totalCourses,
      activeCourses,
      totalSubmissions,
      completedSubmissions,
      totalDistricts,
      totalSchools,
      recentSyncLogs,
      systemAnalytics
    ] = await Promise.all([
      // User counts by role
      UserModel.countDocuments({ role: 'student' }),
      UserModel.countDocuments({ role: 'teacher' }),
      UserModel.countDocuments({ role: 'district-admin' }),
      UserModel.countDocuments({ role: 'super-admin' }),
      
      // Course counts
      CourseModel.countDocuments(),
      CourseModel.countDocuments({ courseState: 'ACTIVE' }),
      
      // Submission counts
      SubmissionModel.countDocuments(),
      SubmissionModel.countDocuments({ state: 'TURNED_IN' }),
      
      // District and school counts
      UserModel.distinct('district', { district: { $exists: true, $ne: null } }).then(districts => districts.length),
      SchoolModel.countDocuments(),
      
      // Recent sync activity
      SyncLogModel.find({ status: 'completed' })
        .sort({ startTime: -1 })
        .limit(5)
        .select('userId userRole syncType startTime endTime duration recordsSynced'),
      
      // System analytics
      AnalyticsModel.find({ 
        calculatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).sort({ calculatedAt: -1 }).limit(20)
    ]);

    // Calculate system-wide metrics
    const completionRate = totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0;
    
    // Get engagement metrics
    const studentsWithSubmissions = await SubmissionModel.distinct('userEmail', {
      userEmail: { $in: await UserModel.distinct('email', { role: 'student' }) }
    });
    const engagementRate = totalStudents > 0 ? (studentsWithSubmissions.length / totalStudents) * 100 : 0;

    // Get district-wise breakdown
    const districtBreakdown = await UserModel.aggregate([
      {
        $match: { district: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$district',
          studentCount: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          teacherCount: { $sum: { $cond: [{ $eq: ['$role', 'teacher'] }, 1, 0] } },
          adminCount: { $sum: { $cond: [{ $eq: ['$role', 'district-admin'] }, 1, 0] } }
        }
      },
      {
        $sort: { studentCount: -1 }
      }
    ]);

    // Get recent activity summary
    const recentActivity = {
      totalSubmissions,
      completedSubmissions,
      lastSyncTime: recentSyncLogs.length > 0 ? recentSyncLogs[0].startTime : null,
      syncSuccessRate: await calculateSyncSuccessRate()
    };

    const overview = {
      system: {
        totalUsers: totalStudents + totalTeachers + totalDistrictAdmins + totalSuperAdmins,
        totalStudents,
        totalTeachers,
        totalDistrictAdmins,
        totalSuperAdmins,
        totalCourses,
        activeCourses,
        totalDistricts,
        totalSchools
      },
      metrics: {
        completionRate: Math.round(completionRate * 100) / 100,
        engagementRate: Math.round(engagementRate * 100) / 100,
        averageStudentsPerDistrict: totalDistricts > 0 ? Math.round(totalStudents / totalDistricts) : 0,
        averageTeachersPerDistrict: totalDistricts > 0 ? Math.round(totalTeachers / totalDistricts) : 0
      },
      districts: districtBreakdown.map(district => ({
        name: district._id,
        studentCount: district.studentCount,
        teacherCount: district.teacherCount,
        adminCount: district.adminCount,
        totalUsers: district.studentCount + district.teacherCount + district.adminCount
      })),
      recentActivity,
      syncHistory: recentSyncLogs.map(log => ({
        userId: log.userId,
        userRole: log.userRole,
        syncType: log.syncType,
        startTime: log.startTime,
        endTime: log.endTime,
        duration: log.duration,
        recordsSynced: log.recordsSynced
      })),
      analytics: systemAnalytics.map(analytics => ({
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
    console.error('Super admin overview API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function calculateSyncSuccessRate(): Promise<number> {
  try {
    const totalSyncs = await SyncLogModel.countDocuments();
    const successfulSyncs = await SyncLogModel.countDocuments({ status: 'completed' });
    
    return totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;
  } catch (error) {
    console.error('Error calculating sync success rate:', error);
    return 0;
  }
}

