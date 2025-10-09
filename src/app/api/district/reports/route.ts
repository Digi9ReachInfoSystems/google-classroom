import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { CourseModel } from '@/models/Course';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { SubmissionModel } from '@/models/Submission';
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

    const userDistrict = payload.district;
    if (!userDistrict) {
      return NextResponse.json({ message: 'District not found for user' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'performance';
    const format = searchParams.get('format') || 'json';

    let reportData;

    switch (reportType) {
      case 'performance':
        reportData = await generatePerformanceReport(userDistrict);
        break;
      case 'attendance':
        reportData = await generateAttendanceReport(userDistrict);
        break;
      case 'completion':
        reportData = await generateCompletionReport(userDistrict);
        break;
      case 'schools':
        reportData = await generateSchoolsReport(userDistrict);
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
        filename: `${userDistrict}_${reportType}_report_${new Date().toISOString().slice(0, 10)}.xlsx`
      });
    }

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('District reports API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generatePerformanceReport(district: string) {
  // Get students in district
  const districtStudents = await UserModel.find({ 
    role: 'student', 
    district 
  }).select('email givenName familyName');

  const studentEmails = districtStudents.map(student => student.email);

  // Get performance data for each student
  const performanceData = await SubmissionModel.aggregate([
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
    },
    {
      $group: {
        _id: '$userEmail',
        totalAssignments: { $sum: 1 },
        averageGrade: { $avg: '$assignedGrade' },
        averagePercentage: { $avg: '$gradePercentage' },
        maxGrade: { $max: '$assignedGrade' },
        minGrade: { $min: '$assignedGrade' }
      }
    }
  ]);

  // Combine with student info
  const report = performanceData.map(perf => {
    const student = districtStudents.find(s => s.email === perf._id);
    return {
      studentName: student ? `${student.givenName} ${student.familyName}` : 'Unknown',
      email: perf._id,
      totalAssignments: perf.totalAssignments,
      averageGrade: Math.round(perf.averageGrade * 100) / 100,
      averagePercentage: Math.round(perf.averagePercentage * 100) / 100,
      maxGrade: perf.maxGrade,
      minGrade: perf.minGrade,
      performanceLevel: getPerformanceLevel(perf.averagePercentage)
    };
  });

  return {
    reportType: 'performance',
    district,
    generatedAt: new Date(),
    totalStudents: report.length,
    summary: {
      averageGrade: report.length > 0 ? report.reduce((sum, r) => sum + r.averageGrade, 0) / report.length : 0,
      averagePercentage: report.length > 0 ? report.reduce((sum, r) => sum + r.averagePercentage, 0) / report.length : 0,
      excellentStudents: report.filter(r => r.performanceLevel === 'Excellent').length,
      goodStudents: report.filter(r => r.performanceLevel === 'Good').length,
      satisfactoryStudents: report.filter(r => r.performanceLevel === 'Satisfactory').length,
      needsImprovementStudents: report.filter(r => r.performanceLevel === 'Needs Improvement').length
    },
    students: report
  };
}

async function generateAttendanceReport(district: string) {
  // Get students in district
  const districtStudents = await UserModel.find({ 
    role: 'student', 
    district 
  }).select('email givenName familyName');

  const studentEmails = districtStudents.map(student => student.email);

  // Get attendance data for each student
  const attendanceData = await SubmissionModel.aggregate([
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
        },
        lateSubmissions: {
          $sum: { $cond: [{ $eq: ['$late', true] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        attendanceRate: {
          $cond: {
            if: { $gt: ['$totalAssignments', 0] },
            then: { $multiply: [{ $divide: ['$completedAssignments', '$totalAssignments'] }, 100] },
            else: 0
          }
        }
      }
    }
  ]);

  // Combine with student info
  const report = attendanceData.map(att => {
    const student = districtStudents.find(s => s.email === att._id);
    return {
      studentName: student ? `${student.givenName} ${student.familyName}` : 'Unknown',
      email: att._id,
      totalAssignments: att.totalAssignments,
      completedAssignments: att.completedAssignments,
      lateSubmissions: att.lateSubmissions,
      attendanceRate: Math.round(att.attendanceRate * 100) / 100,
      attendanceLevel: getAttendanceLevel(att.attendanceRate)
    };
  });

  return {
    reportType: 'attendance',
    district,
    generatedAt: new Date(),
    totalStudents: report.length,
    summary: {
      averageAttendanceRate: report.length > 0 ? report.reduce((sum, r) => sum + r.attendanceRate, 0) / report.length : 0,
      excellentAttendance: report.filter(r => r.attendanceLevel === 'Excellent').length,
      goodAttendance: report.filter(r => r.attendanceLevel === 'Good').length,
      satisfactoryAttendance: report.filter(r => r.attendanceLevel === 'Satisfactory').length,
      poorAttendance: report.filter(r => r.attendanceLevel === 'Poor').length
    },
    students: report
  };
}

async function generateCompletionReport(district: string) {
  // Get students in district
  const districtStudents = await UserModel.find({ 
    role: 'student', 
    district 
  }).select('email givenName familyName');

  const studentEmails = districtStudents.map(student => student.email);

  // Get completion data for each student
  const completionData = await SubmissionModel.aggregate([
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
        },
        pendingAssignments: {
          $sum: { $cond: [{ $eq: ['$state', 'CREATED'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        completionRate: {
          $cond: {
            if: { $gt: ['$totalAssignments', 0] },
            then: { $multiply: [{ $divide: ['$completedAssignments', '$totalAssignments'] }, 100] },
            else: 0
          }
        }
      }
    }
  ]);

  // Combine with student info
  const report = completionData.map(comp => {
    const student = districtStudents.find(s => s.email === comp._id);
    return {
      studentName: student ? `${student.givenName} ${student.familyName}` : 'Unknown',
      email: comp._id,
      totalAssignments: comp.totalAssignments,
      completedAssignments: comp.completedAssignments,
      pendingAssignments: comp.pendingAssignments,
      completionRate: Math.round(comp.completionRate * 100) / 100,
      completionLevel: getCompletionLevel(comp.completionRate)
    };
  });

  return {
    reportType: 'completion',
    district,
    generatedAt: new Date(),
    totalStudents: report.length,
    summary: {
      averageCompletionRate: report.length > 0 ? report.reduce((sum, r) => sum + r.completionRate, 0) / report.length : 0,
      fullyCompleted: report.filter(r => r.completionLevel === 'Fully Completed').length,
      mostlyCompleted: report.filter(r => r.completionLevel === 'Mostly Completed').length,
      partiallyCompleted: report.filter(r => r.completionLevel === 'Partially Completed').length,
      notStarted: report.filter(r => r.completionLevel === 'Not Started').length
    },
    students: report
  };
}

async function generateSchoolsReport(district: string) {
  // Get schools in district
  const schools = await SchoolModel.find({ district }).select('name enrollmentCount teacherCount activeCourses lastSyncTime');

  // Get detailed data for each school
  const schoolReports = await Promise.all(
    schools.map(async (school) => {
      // Get students in this school (assuming school name matches some pattern)
      const schoolStudents = await UserModel.countDocuments({ 
        role: 'student', 
        district,
        // Add school matching logic here if needed
      });

      const schoolTeachers = await UserModel.countDocuments({ 
        role: 'teacher', 
        district,
        // Add school matching logic here if needed
      });

      return {
        schoolName: school.name,
        enrollmentCount: school.enrollmentCount || 0,
        teacherCount: school.teacherCount || 0,
        activeCourses: school.activeCourses || 0,
        lastSyncTime: school.lastSyncTime,
        studentTeacherRatio: schoolTeachers > 0 ? (schoolStudents / schoolTeachers) : 0
      };
    })
  );

  return {
    reportType: 'schools',
    district,
    generatedAt: new Date(),
    totalSchools: schoolReports.length,
    summary: {
      totalEnrollment: schoolReports.reduce((sum, school) => sum + school.enrollmentCount, 0),
      totalTeachers: schoolReports.reduce((sum, school) => sum + school.teacherCount, 0),
      totalActiveCourses: schoolReports.reduce((sum, school) => sum + school.activeCourses, 0),
      averageStudentTeacherRatio: schoolReports.length > 0 ? 
        schoolReports.reduce((sum, school) => sum + school.studentTeacherRatio, 0) / schoolReports.length : 0
    },
    schools: schoolReports
  };
}

function getPerformanceLevel(averagePercentage: number): string {
  if (averagePercentage >= 90) return 'Excellent';
  if (averagePercentage >= 80) return 'Good';
  if (averagePercentage >= 70) return 'Satisfactory';
  return 'Needs Improvement';
}

function getAttendanceLevel(attendanceRate: number): string {
  if (attendanceRate >= 95) return 'Excellent';
  if (attendanceRate >= 85) return 'Good';
  if (attendanceRate >= 70) return 'Satisfactory';
  return 'Poor';
}

function getCompletionLevel(completionRate: number): string {
  if (completionRate >= 95) return 'Fully Completed';
  if (completionRate >= 80) return 'Mostly Completed';
  if (completionRate >= 50) return 'Partially Completed';
  return 'Not Started';
}

