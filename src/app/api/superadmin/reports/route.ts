import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { CourseModel } from '@/models/Course';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { SubmissionModel } from '@/models/Submission';
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

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'system';
    const format = searchParams.get('format') || 'json';

    let reportData;

    switch (reportType) {
      case 'system':
        reportData = await generateSystemReport();
        break;
      case 'districts':
        reportData = await generateDistrictsReport();
        break;
      case 'schools':
        reportData = await generateSchoolsReport();
        break;
      case 'users':
        reportData = await generateUsersReport();
        break;
      case 'sync':
        reportData = await generateSyncReport();
        break;
      default:
        return NextResponse.json({ message: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'excel') {
      // For Excel format, return structured data that can be converted to Excel
      return NextResponse.json({
        success: true,
        data: reportData,
        format: 'excel',
        filename: `superadmin_${reportType}_report_${new Date().toISOString().slice(0, 10)}.xlsx`
      });
    }

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Super admin reports API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateSystemReport() {
  // Get system-wide statistics
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalDistrictAdmins,
    totalSuperAdmins,
    totalCourses,
    activeCourses,
    totalSubmissions,
    completedSubmissions,
    totalDistricts,
    totalSchools
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: 'student' }),
    UserModel.countDocuments({ role: 'teacher' }),
    UserModel.countDocuments({ role: 'district-admin' }),
    UserModel.countDocuments({ role: 'super-admin' }),
    CourseModel.countDocuments(),
    CourseModel.countDocuments({ courseState: 'ACTIVE' }),
    SubmissionModel.countDocuments(),
    SubmissionModel.countDocuments({ state: 'TURNED_IN' }),
    UserModel.distinct('district', { district: { $exists: true, $ne: null } }).then(districts => districts.length),
    SchoolModel.countDocuments()
  ]);

  // Calculate system metrics
  const completionRate = totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0;
  const courseUtilizationRate = totalCourses > 0 ? (activeCourses / totalCourses) * 100 : 0;

  // Get performance distribution
  const performanceDistribution = await SubmissionModel.aggregate([
    {
      $match: { assignedGrade: { $exists: true, $ne: null } }
    },
    {
      $lookup: {
        from: 'courseworks',
        localField: 'courseWorkId',
        foreignField: 'courseWorkId',
        as: 'coursework'
      }
    },
    {
      $unwind: '$coursework'
    },
    {
      $addFields: {
        gradePercentage: {
          $cond: {
            if: { $gt: ['$coursework.maxPoints', 0] },
            then: { $multiply: [{ $divide: ['$assignedGrade', '$coursework.maxPoints'] }, 100] },
            else: 0
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        excellent: { $sum: { $cond: [{ $gte: ['$gradePercentage', 90] }, 1, 0] } },
        good: { $sum: { $cond: [{ $and: [{ $gte: ['$gradePercentage', 80] }, { $lt: ['$gradePercentage', 90] }] }, 1, 0] } },
        satisfactory: { $sum: { $cond: [{ $and: [{ $gte: ['$gradePercentage', 70] }, { $lt: ['$gradePercentage', 80] }] }, 1, 0] } },
        needsImprovement: { $sum: { $cond: [{ $lt: ['$gradePercentage', 70] }, 1, 0] } }
      }
    }
  ]);

  const performance = performanceDistribution.length > 0 ? performanceDistribution[0] : {
    excellent: 0,
    good: 0,
    satisfactory: 0,
    needsImprovement: 0
  };

  return {
    reportType: 'system',
    generatedAt: new Date(),
    summary: {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalDistrictAdmins,
      totalSuperAdmins,
      totalCourses,
      activeCourses,
      totalDistricts,
      totalSchools,
      completionRate: Math.round(completionRate * 100) / 100,
      courseUtilizationRate: Math.round(courseUtilizationRate * 100) / 100
    },
    performance: {
      excellent: performance.excellent,
      good: performance.good,
      satisfactory: performance.satisfactory,
      needsImprovement: performance.needsImprovement,
      totalGraded: performance.excellent + performance.good + performance.satisfactory + performance.needsImprovement
    }
  };
}

async function generateDistrictsReport() {
  // Get all districts with their metrics
  const districts = await UserModel.distinct('district', { 
    district: { $exists: true, $ne: null } 
  });

  const districtReports = await Promise.all(
    districts.map(async (district) => {
      const [
        studentCount,
        teacherCount,
        adminCount,
        courseCount,
        submissionCount,
        completedCount,
        schools
      ] = await Promise.all([
        UserModel.countDocuments({ role: 'student', district }),
        UserModel.countDocuments({ role: 'teacher', district }),
        UserModel.countDocuments({ role: 'district-admin', district }),
        CourseModel.countDocuments(),
        SubmissionModel.countDocuments({
          userEmail: { $in: await UserModel.distinct('email', { role: 'student', district }) }
        }),
        SubmissionModel.countDocuments({
          userEmail: { $in: await UserModel.distinct('email', { role: 'student', district }) },
          state: 'TURNED_IN'
        }),
        SchoolModel.countDocuments({ district })
      ]);

      const completionRate = submissionCount > 0 ? (completedCount / submissionCount) * 100 : 0;
      const studentTeacherRatio = teacherCount > 0 ? studentCount / teacherCount : 0;

      return {
        district,
        studentCount,
        teacherCount,
        adminCount,
        courseCount,
        submissionCount,
        completedCount,
        completionRate: Math.round(completionRate * 100) / 100,
        studentTeacherRatio: Math.round(studentTeacherRatio * 100) / 100,
        schoolCount: schools
      };
    })
  );

  // Sort by student count (largest first)
  districtReports.sort((a, b) => b.studentCount - a.studentCount);

  return {
    reportType: 'districts',
    generatedAt: new Date(),
    totalDistricts: districtReports.length,
    summary: {
      totalStudents: districtReports.reduce((sum, d) => sum + d.studentCount, 0),
      totalTeachers: districtReports.reduce((sum, d) => sum + d.teacherCount, 0),
      totalAdmins: districtReports.reduce((sum, d) => sum + d.adminCount, 0),
      averageCompletionRate: districtReports.length > 0 ? 
        districtReports.reduce((sum, d) => sum + d.completionRate, 0) / districtReports.length : 0
    },
    districts: districtReports
  };
}

async function generateSchoolsReport() {
  // Get all schools with their metrics
  const schools = await SchoolModel.find({}).select('name district enrollmentCount teacherCount activeCourses lastSyncTime');

  const schoolReports = schools.map(school => ({
    schoolName: school.name,
    district: school.district,
    enrollmentCount: school.enrollmentCount || 0,
    teacherCount: school.teacherCount || 0,
    activeCourses: school.activeCourses || 0,
    studentTeacherRatio: school.teacherCount > 0 ? (school.enrollmentCount || 0) / school.teacherCount : 0,
    lastSyncTime: school.lastSyncTime,
    status: school.lastSyncTime ? 
      (new Date().getTime() - school.lastSyncTime.getTime() < 24 * 60 * 60 * 1000 ? 'Active' : 'Stale') : 
      'Never Synced'
  }));

  // Sort by enrollment count (largest first)
  schoolReports.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

  return {
    reportType: 'schools',
    generatedAt: new Date(),
    totalSchools: schoolReports.length,
    summary: {
      totalEnrollment: schoolReports.reduce((sum, s) => sum + s.enrollmentCount, 0),
      totalTeachers: schoolReports.reduce((sum, s) => sum + s.teacherCount, 0),
      totalActiveCourses: schoolReports.reduce((sum, s) => sum + s.activeCourses, 0),
      activeSchools: schoolReports.filter(s => s.status === 'Active').length,
      staleSchools: schoolReports.filter(s => s.status === 'Stale').length,
      neverSyncedSchools: schoolReports.filter(s => s.status === 'Never Synced').length
    },
    schools: schoolReports
  };
}

async function generateUsersReport() {
  // Get user statistics by role and district
  const userStats = await UserModel.aggregate([
    {
      $group: {
        _id: { role: '$role', district: '$district' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.role',
        total: { $sum: '$count' },
        districts: {
          $push: {
            district: '$_id.district',
            count: '$count'
          }
        }
      }
    }
  ]);

  // Get engagement statistics
  const engagementStats = await Promise.all([
    // Student engagement
    {
      role: 'student',
      totalUsers: await UserModel.countDocuments({ role: 'student' }),
      activeUsers: await SubmissionModel.distinct('userEmail', {
        userEmail: { $in: await UserModel.distinct('email', { role: 'student' }) }
      }).then(emails => emails.length)
    },
    // Teacher engagement
    {
      role: 'teacher',
      totalUsers: await UserModel.countDocuments({ role: 'teacher' }),
      activeUsers: await RosterMembershipModel.distinct('userEmail', {
        role: 'teacher',
        courseId: { $in: await CourseModel.distinct('courseId', { courseState: 'ACTIVE' }) }
      }).then(emails => emails.length)
    }
  ]);

  return {
    reportType: 'users',
    generatedAt: new Date(),
    userStatistics: userStats,
    engagement: engagementStats.map(stat => ({
      ...stat,
      engagementRate: stat.totalUsers > 0 ? (stat.activeUsers / stat.totalUsers) * 100 : 0
    }))
  };
}

async function generateSyncReport() {
  // Get sync statistics
  const syncStats = await SyncLogModel.aggregate([
    {
      $group: {
        _id: { userRole: '$userRole', syncType: '$syncType' },
        totalSyncs: { $sum: 1 },
        successfulSyncs: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        failedSyncs: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        totalRecordsProcessed: { $sum: '$recordsProcessed' },
        totalRecordsSynced: { $sum: '$recordsSynced' },
        totalRecordsFailed: { $sum: '$recordsFailed' },
        averageDuration: { $avg: '$duration' }
      }
    }
  ]);

  // Get recent sync activity
  const recentSyncs = await SyncLogModel.find({})
    .sort({ startTime: -1 })
    .limit(20)
    .select('userId userRole syncType status startTime endTime duration recordsSynced recordsFailed errorMessage');

  // Calculate overall sync success rate
  const totalSyncs = await SyncLogModel.countDocuments();
  const successfulSyncs = await SyncLogModel.countDocuments({ status: 'completed' });
  const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

  return {
    reportType: 'sync',
    generatedAt: new Date(),
    summary: {
      totalSyncs,
      successfulSyncs,
      failedSyncs: totalSyncs - successfulSyncs,
      successRate: Math.round(successRate * 100) / 100
    },
    statistics: syncStats,
    recentActivity: recentSyncs.map(sync => ({
      userId: sync.userId,
      userRole: sync.userRole,
      syncType: sync.syncType,
      status: sync.status,
      startTime: sync.startTime,
      endTime: sync.endTime,
      duration: sync.duration,
      recordsSynced: sync.recordsSynced,
      recordsFailed: sync.recordsFailed,
      errorMessage: sync.errorMessage
    }))
  };
}

