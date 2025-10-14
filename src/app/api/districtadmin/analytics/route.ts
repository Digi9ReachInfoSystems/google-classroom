import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { CourseModel } from '@/models/Course';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { SubmissionModel } from '@/models/Submission';
import { CourseworkModel } from '@/models/Coursework';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    console.log('District admin analytics - Token payload:', { 
      email: payload?.email, 
      role: payload?.role 
    });
    
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    if (payload.role !== 'district-admin') {
      console.log('Access denied - Expected district-admin, got:', payload.role);
      return NextResponse.json({ 
        message: 'Access denied',
        expectedRole: 'district-admin',
        actualRole: payload.role
      }, { status: 403 });
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
    const courseId = searchParams.get('courseId');
    const schoolName = searchParams.get('schoolName');

    let analytics;

    if (courseId) {
      // Get analytics for specific course
      analytics = await getCourseAnalytics(courseId, userDistrict, schoolName);
    } else {
      // Get analytics for all courses in district
      analytics = await getDistrictAnalytics(userDistrict, schoolName);
    }

    return NextResponse.json({
      success: true,
      analytics,
      courseId: courseId || 'all'
    });

  } catch (error) {
    console.error('District admin analytics API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCourseAnalytics(courseId: string, district?: string, schoolName?: string | null) {
  // Get students enrolled in this course
  const studentEmails = await RosterMembershipModel.distinct('userEmail', {
    courseId,
    role: 'student'
  });

  // Apply school filter if provided
  let filteredStudentEmails = studentEmails;
  if (schoolName) {
    const schoolStudents = await UserModel.distinct('email', {
      email: { $in: studentEmails },
      schoolName: schoolName
    });
    filteredStudentEmails = schoolStudents;
  }

  const enrolledStudents = filteredStudentEmails.length;

  // Get all coursework for this course
  const totalCoursework = await CourseworkModel.countDocuments({ courseId });

  // Get submissions for filtered students in this course
  const totalSubmissions = await SubmissionModel.countDocuments({
    courseId,
    userEmail: { $in: filteredStudentEmails }
  });

  const completedSubmissions = await SubmissionModel.countDocuments({
    courseId,
    userEmail: { $in: filteredStudentEmails },
    state: 'TURNED_IN'
  });

  const pendingSubmissions = totalSubmissions - completedSubmissions;

  // Calculate progress percentage
  const courseProgress = totalSubmissions > 0 
    ? Math.round((completedSubmissions / totalSubmissions) * 100)
    : 0;

  const pending = totalSubmissions > 0
    ? Math.round((pendingSubmissions / totalSubmissions) * 100)
    : 0;

  const completed = totalSubmissions > 0
    ? Math.round((completedSubmissions / totalSubmissions) * 100)
    : 0;

  // Get teachers for this course
  const totalTeachers = await RosterMembershipModel.countDocuments({
    courseId,
    role: 'teacher'
  });

  return {
    enrolledStudents,
    courseProgress,
    pending,
    completed,
    totalTeachers,
    totalCourses: 1, // Single course
    totalCoursework,
    totalSubmissions,
    completedSubmissions,
    pendingSubmissions
  };
}

async function getDistrictAnalytics(district?: string, schoolName?: string | null) {
  // Get all students in district with optional school filter
  const query: any = { role: 'student' };
  if (district) query.district = district;
  if (schoolName) query.schoolName = schoolName;
  
  const enrolledStudents = await UserModel.countDocuments(query);

  // Get all courses
  const totalCourses = await CourseModel.countDocuments();

  // Get all submissions for filtered district students
  const districtStudentEmails = await UserModel.distinct('email', query);
  
  const totalSubmissions = await SubmissionModel.countDocuments({
    userEmail: { $in: districtStudentEmails }
  });

  const completedSubmissions = await SubmissionModel.countDocuments({
    userEmail: { $in: districtStudentEmails },
    state: 'TURNED_IN'
  });

  const pendingSubmissions = totalSubmissions - completedSubmissions;

  // Calculate progress percentage
  const courseProgress = totalSubmissions > 0 
    ? Math.round((completedSubmissions / totalSubmissions) * 100)
    : 0;

  const pending = totalSubmissions > 0
    ? Math.round((pendingSubmissions / totalSubmissions) * 100)
    : 0;

  const completed = totalSubmissions > 0
    ? Math.round((completedSubmissions / totalSubmissions) * 100)
    : 0;

  // Get total teachers
  const teacherQuery = district ? { role: 'teacher', district } : { role: 'teacher' };
  const totalTeachers = await UserModel.countDocuments(teacherQuery);

  return {
    enrolledStudents,
    courseProgress,
    pending,
    completed,
    totalTeachers,
    totalCourses,
    totalSubmissions,
    completedSubmissions,
    pendingSubmissions
  };
}