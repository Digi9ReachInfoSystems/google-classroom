import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
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
    if (!payload || payload.role !== 'district-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const schoolName = searchParams.get('schoolName');

    let students;

    if (courseId) {
      // Get students for specific course
      students = await getCourseStudents(courseId, schoolName);
    } else {
      // Get all students in district
      students = await getDistrictStudents(payload.district, schoolName);
    }

    return NextResponse.json({
      success: true,
      students,
      courseId: courseId || 'all',
      total: students.length
    });

  } catch (error) {
    console.error('District admin students API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCourseStudents(courseId: string, schoolName?: string | null) {
  // Get students enrolled in this course
  const studentEmails = await RosterMembershipModel.distinct('userEmail', {
    courseId,
    role: 'student'
  });

  // Get student details with optional school filter
  const studentQuery: any = {
    email: { $in: studentEmails },
    role: 'student'
  };
  if (schoolName) studentQuery.schoolName = schoolName;
  
  const students = await UserModel.find(studentQuery).select('email givenName familyName fullName');

  // Get coursework for this course
  const totalCoursework = await CourseworkModel.countDocuments({ courseId });

  // Calculate progress for each student
  const studentsWithProgress = await Promise.all(
    students.map(async (student) => {
      // Get submissions for this student in this course
      const submissions = await SubmissionModel.find({
        courseId,
        userEmail: student.email
      });

      const completedSubmissions = submissions.filter(s => s.state === 'TURNED_IN').length;
      const lessonProgress = totalCoursework > 0 
        ? Math.round((completedSubmissions / totalCoursework) * 100)
        : 0;

      // Determine status for each stage (simplified logic)
      const preSurveyStatus = lessonProgress > 0 ? 'ok' : 'warn';
      const ideaStatus = lessonProgress > 50 ? 'ok' : 'warn';
      const postSurveyStatus = lessonProgress > 80 ? 'ok' : 'warn';
      const certStatus = lessonProgress === 100 ? 'ok' : 'warn';

      // Safely handle name construction
      const displayName = student.fullName || 
        (student.givenName && student.familyName ? `${student.givenName} ${student.familyName}` : null) ||
        (student.email ? student.email.split('@')[0] : 'Unknown Student');

      return {
        name: displayName,
        email: student.email || 'unknown@example.com',
        pre: preSurveyStatus as 'ok' | 'warn',
        lesson: lessonProgress,
        idea: ideaStatus as 'ok' | 'warn',
        post: postSurveyStatus as 'ok' | 'warn',
        cert: certStatus as 'ok' | 'warn'
      };
    })
  );

  return studentsWithProgress;
}

async function getDistrictStudents(district?: string, schoolName?: string | null) {
  // Get all students in district with optional school filter
  const query: any = { role: 'student' };
  if (district) query.district = district;
  if (schoolName) query.schoolName = schoolName;
  
  const students = await UserModel.find(query).select('email givenName familyName fullName').limit(100);

  // Calculate progress for each student across all their courses
  const studentsWithProgress = await Promise.all(
    students.map(async (student) => {
      // Get all submissions for this student
      const submissions = await SubmissionModel.find({
        userEmail: student.email
      });

      const totalSubmissions = submissions.length;
      const completedSubmissions = submissions.filter(s => s.state === 'TURNED_IN').length;
      
      const lessonProgress = totalSubmissions > 0 
        ? Math.round((completedSubmissions / totalSubmissions) * 100)
        : 0;

      // Determine status for each stage (simplified logic)
      const preSurveyStatus = lessonProgress > 0 ? 'ok' : 'warn';
      const ideaStatus = lessonProgress > 50 ? 'ok' : 'warn';
      const postSurveyStatus = lessonProgress > 80 ? 'ok' : 'warn';
      const certStatus = lessonProgress === 100 ? 'ok' : 'warn';

      // Safely handle name construction
      const displayName = student.fullName || 
        (student.givenName && student.familyName ? `${student.givenName} ${student.familyName}` : null) ||
        (student.email ? student.email.split('@')[0] : 'Unknown Student');

      return {
        name: displayName,
        email: student.email || 'unknown@example.com',
        pre: preSurveyStatus as 'ok' | 'warn',
        lesson: lessonProgress,
        idea: ideaStatus as 'ok' | 'warn',
        post: postSurveyStatus as 'ok' | 'warn',
        cert: certStatus as 'ok' | 'warn'
      };
    })
  );

  return studentsWithProgress;
}