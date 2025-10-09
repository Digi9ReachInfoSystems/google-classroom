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
    if (!payload || payload.role !== 'super-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'monthly';
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7); // Current month

    // Get system-wide metrics
    const systemMetrics = await getSystemMetrics(timeframe, period);
    
    // Get district comparison metrics
    const districtMetrics = await getDistrictComparisonMetrics(timeframe, period);
    
    // Get school performance metrics
    const schoolMetrics = await getSchoolPerformanceMetrics(timeframe, period);
    
    // Get user engagement metrics
    const userMetrics = await getUserEngagementMetrics(timeframe, period);

    const metrics = {
      timeframe,
      period,
      system: systemMetrics,
      districts: districtMetrics,
      schools: schoolMetrics,
      users: userMetrics
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Super admin metrics API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getSystemMetrics(timeframe: string, period: string) {
  // System-wide enrollment
  const totalUsers = await UserModel.countDocuments();
  const totalStudents = await UserModel.countDocuments({ role: 'student' });
  const totalTeachers = await UserModel.countDocuments({ role: 'teacher' });
  const totalAdmins = await UserModel.countDocuments({ 
    role: { $in: ['district-admin', 'super-admin'] } 
  });

  // System-wide course metrics
  const totalCourses = await CourseModel.countDocuments();
  const activeCourses = await CourseModel.countDocuments({ courseState: 'ACTIVE' });

  // System-wide performance metrics
  const totalSubmissions = await SubmissionModel.countDocuments();
  const completedSubmissions = await SubmissionModel.countDocuments({ state: 'TURNED_IN' });
  const gradedSubmissions = await SubmissionModel.countDocuments({ 
    assignedGrade: { $exists: true, $ne: null } 
  });

  // Calculate system-wide averages
  const completionRate = totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0;
  const gradingRate = totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 100 : 0;

  // Get average grade across all submissions
  const averageGradeResult = await SubmissionModel.aggregate([
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
        averageGrade: { $avg: '$assignedGrade' },
        averagePercentage: { $avg: '$gradePercentage' }
      }
    }
  ]);

  const averageGrade = averageGradeResult.length > 0 ? averageGradeResult[0].averageGrade : 0;
  const averagePercentage = averageGradeResult.length > 0 ? averageGradeResult[0].averagePercentage : 0;

  return {
    enrollment: {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      studentTeacherRatio: totalTeachers > 0 ? totalStudents / totalTeachers : 0
    },
    courses: {
      totalCourses,
      activeCourses,
      courseUtilizationRate: totalCourses > 0 ? (activeCourses / totalCourses) * 100 : 0
    },
    performance: {
      totalSubmissions,
      completedSubmissions,
      gradedSubmissions,
      completionRate: Math.round(completionRate * 100) / 100,
      gradingRate: Math.round(gradingRate * 100) / 100,
      averageGrade: Math.round(averageGrade * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100
    }
  };
}

async function getDistrictComparisonMetrics(timeframe: string, period: string) {
  // Get all districts
  const districts = await UserModel.distinct('district', { 
    district: { $exists: true, $ne: null } 
  });

  const districtComparison = await Promise.all(
    districts.map(async (district) => {
      // Get district-specific metrics
      const [
        studentCount,
        teacherCount,
        courseCount,
        submissionCount,
        completedCount
      ] = await Promise.all([
        UserModel.countDocuments({ role: 'student', district }),
        UserModel.countDocuments({ role: 'teacher', district }),
        CourseModel.countDocuments(),
        SubmissionModel.countDocuments({
          userEmail: { $in: await UserModel.distinct('email', { role: 'student', district }) }
        }),
        SubmissionModel.countDocuments({
          userEmail: { $in: await UserModel.distinct('email', { role: 'student', district }) },
          state: 'TURNED_IN'
        })
      ]);

      const completionRate = submissionCount > 0 ? (completedCount / submissionCount) * 100 : 0;

      return {
        district,
        studentCount,
        teacherCount,
        courseCount,
        submissionCount,
        completedCount,
        completionRate: Math.round(completionRate * 100) / 100,
        studentTeacherRatio: teacherCount > 0 ? studentCount / teacherCount : 0
      };
    })
  );

  // Sort by student count (largest first)
  districtComparison.sort((a, b) => b.studentCount - a.studentCount);

  return districtComparison;
}

async function getSchoolPerformanceMetrics(timeframe: string, period: string) {
  // Get all schools
  const schools = await SchoolModel.find({}).select('name district enrollmentCount teacherCount activeCourses');

  const schoolPerformance = schools.map(school => ({
    schoolName: school.name,
    district: school.district,
    enrollmentCount: school.enrollmentCount || 0,
    teacherCount: school.teacherCount || 0,
    activeCourses: school.activeCourses || 0,
    studentTeacherRatio: school.teacherCount > 0 ? (school.enrollmentCount || 0) / school.teacherCount : 0,
    courseUtilization: school.activeCourses || 0
  }));

  // Sort by enrollment count (largest first)
  schoolPerformance.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

  return schoolPerformance;
}

async function getUserEngagementMetrics(timeframe: string, period: string) {
  // Get engagement by role
  const roleEngagement = await Promise.all([
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
    },
    // District admin engagement
    {
      role: 'district-admin',
      totalUsers: await UserModel.countDocuments({ role: 'district-admin' }),
      activeUsers: await UserModel.countDocuments({ role: 'district-admin' }) // All district admins are considered active
    },
    // Super admin engagement
    {
      role: 'super-admin',
      totalUsers: await UserModel.countDocuments({ role: 'super-admin' }),
      activeUsers: await UserModel.countDocuments({ role: 'super-admin' }) // All super admins are considered active
    }
  ]);

  // Calculate engagement rates
  const engagementMetrics = roleEngagement.map(role => ({
    ...role,
    engagementRate: role.totalUsers > 0 ? (role.activeUsers / role.totalUsers) * 100 : 0
  }));

  // Get overall system engagement
  const totalSystemUsers = roleEngagement.reduce((sum, role) => sum + role.totalUsers, 0);
  const totalActiveUsers = roleEngagement.reduce((sum, role) => sum + role.activeUsers, 0);
  const overallEngagementRate = totalSystemUsers > 0 ? (totalActiveUsers / totalSystemUsers) * 100 : 0;

  return {
    byRole: engagementMetrics,
    overall: {
      totalUsers: totalSystemUsers,
      activeUsers: totalActiveUsers,
      engagementRate: Math.round(overallEngagementRate * 100) / 100
    }
  };
}

