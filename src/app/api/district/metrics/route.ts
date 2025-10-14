import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { CourseModel } from '@/models/Course';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { SubmissionModel } from '@/models/Submission';
import { AnalyticsModel } from '@/models/Analytics';

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

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'monthly';
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7); // Current month

    // Get enrollment metrics
    const enrollmentMetrics = await getEnrollmentMetrics(userDistrict, timeframe, period);
    
    // Get performance metrics
    const performanceMetrics = await getPerformanceMetrics(userDistrict, timeframe, period);
    
    // Get attendance metrics
    const attendanceMetrics = await getAttendanceMetrics(userDistrict, timeframe, period);
    
    // Get completion metrics
    const completionMetrics = await getCompletionMetrics(userDistrict, timeframe, period);

    const metrics = {
      district: userDistrict,
      timeframe,
      period,
      enrollment: enrollmentMetrics,
      performance: performanceMetrics,
      attendance: attendanceMetrics,
      completion: completionMetrics
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('District metrics API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getEnrollmentMetrics(district: string, timeframe: string, period: string) {
  const totalStudents = await UserModel.countDocuments({ 
    role: 'student', 
    district 
  });
  
  const activeStudents = await RosterMembershipModel.countDocuments({ 
    role: 'student',
    courseId: { $in: await CourseModel.distinct('courseId', { courseState: 'ACTIVE' }) }
  });

  const totalTeachers = await UserModel.countDocuments({ 
    role: 'teacher', 
    district 
  });

  const activeTeachers = await RosterMembershipModel.countDocuments({ 
    role: 'teacher',
    courseId: { $in: await CourseModel.distinct('courseId', { courseState: 'ACTIVE' }) }
  });

  return {
    totalStudents,
    activeStudents,
    totalTeachers,
    activeTeachers,
    enrollmentRate: totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0
  };
}

async function getPerformanceMetrics(district: string, timeframe: string, period: string) {
  // Get students in district
  const districtStudents = await UserModel.find({ 
    role: 'student', 
    district 
  }).select('email');

  const studentEmails = districtStudents.map(student => student.email);

  // Get submissions for district students
  const submissions = await SubmissionModel.find({
    userEmail: { $in: studentEmails },
    assignedGrade: { $exists: true, $ne: null }
  });

  if (submissions.length === 0) {
    return {
      averageGrade: 0,
      totalGradedSubmissions: 0,
      gradeDistribution: {
        excellent: 0,
        good: 0,
        satisfactory: 0,
        needsImprovement: 0
      }
    };
  }

  // Calculate average grade
  const totalPoints = submissions.reduce((sum, sub) => sum + (sub.assignedGrade || 0), 0);
  const averageGrade = totalPoints / submissions.length;

  // Get max points for each submission to calculate percentage
  const gradedSubmissions = await SubmissionModel.aggregate([
    {
      $match: {
        userEmail: { $in: studentEmails },
        assignedGrade: { $exists: true, $ne: null }
      }
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
    }
  ]);

  // Calculate grade distribution
  const gradeDistribution = {
    excellent: 0,
    good: 0,
    satisfactory: 0,
    needsImprovement: 0
  };

  gradedSubmissions.forEach(sub => {
    const percentage = sub.gradePercentage;
    if (percentage >= 90) gradeDistribution.excellent++;
    else if (percentage >= 80) gradeDistribution.good++;
    else if (percentage >= 70) gradeDistribution.satisfactory++;
    else gradeDistribution.needsImprovement++;
  });

  return {
    averageGrade: Math.round(averageGrade * 100) / 100,
    totalGradedSubmissions: submissions.length,
    gradeDistribution
  };
}

async function getAttendanceMetrics(district: string, timeframe: string, period: string) {
  // Get students in district
  const districtStudents = await UserModel.find({ 
    role: 'student', 
    district 
  }).select('email');

  const studentEmails = districtStudents.map(student => student.email);

  // Get total submissions (as proxy for attendance/engagement)
  const totalSubmissions = await SubmissionModel.countDocuments({
    userEmail: { $in: studentEmails }
  });

  const completedSubmissions = await SubmissionModel.countDocuments({
    userEmail: { $in: studentEmails },
    state: 'TURNED_IN'
  });

  const attendanceRate = totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0;

  return {
    totalSubmissions,
    completedSubmissions,
    attendanceRate: Math.round(attendanceRate * 100) / 100
  };
}

async function getCompletionMetrics(district: string, timeframe: string, period: string) {
  // Get students in district
  const districtStudents = await UserModel.find({ 
    role: 'student', 
    district 
  }).select('email');

  const studentEmails = districtStudents.map(student => student.email);

  // Get coursework for district students
  const totalCoursework = await SubmissionModel.countDocuments({
    userEmail: { $in: studentEmails }
  });

  const completedCoursework = await SubmissionModel.countDocuments({
    userEmail: { $in: studentEmails },
    state: 'TURNED_IN'
  });

  const completionRate = totalCoursework > 0 ? (completedCoursework / totalCoursework) * 100 : 0;

  // Get students who have completed all their assignments
  const studentsWithAllCompleted = await SubmissionModel.aggregate([
    {
      $match: {
        userEmail: { $in: studentEmails }
      }
    },
    {
      $group: {
        _id: '$userEmail',
        totalAssignments: { $sum: 1 },
        completedAssignments: {
          $sum: { $cond: [{ $eq: ['$state', 'TURNED_IN'] }, 1, 0] }
        }
      }
    },
    {
      $match: {
        $expr: { $eq: ['$totalAssignments', '$completedAssignments'] }
      }
    }
  ]);

  return {
    totalCoursework,
    completedCoursework,
    completionRate: Math.round(completionRate * 100) / 100,
    studentsWithAllCompleted: studentsWithAllCompleted.length
  };
}

