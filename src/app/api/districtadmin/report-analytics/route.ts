import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { SubmissionModel } from '@/models/Submission';
import { CourseworkModel } from '@/models/Coursework';

const BLUE_100 = "var(--blue-800)";
const ERROR_200 = "var(--pink-100)";
const BLUE_700 = "var(--purple-100)";

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
    const age = searchParams.get('age');
    const grade = searchParams.get('grade');
    const gender = searchParams.get('gender');
    const disability = searchParams.get('disability');

    let analytics;

    if (courseId) {
      // Get analytics for specific course
      analytics = await getCourseReportAnalytics(courseId, { age, grade, gender, disability });
    } else {
      // Get analytics for all courses in district
      analytics = await getDistrictReportAnalytics(payload.district, { age, grade, gender, disability });
    }

    return NextResponse.json({
      success: true,
      ...analytics,
      courseId: courseId || 'all'
    });

  } catch (error) {
    console.error('District admin report analytics API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCourseReportAnalytics(courseId: string, filters: any) {
  // Get students in this course
  const studentEmails = await RosterMembershipModel.distinct('userEmail', {
    courseId,
    role: 'student'
  });

  // Apply filters to students using real custom attributes
  let studentQuery: any = {
    email: { $in: studentEmails },
    role: 'student'
  };

  if (filters.gender) studentQuery.gender = filters.gender;
  if (filters.grade) studentQuery.grade = filters.grade;
  if (filters.age) studentQuery.age = filters.age;
  if (filters.disability) studentQuery.disability = filters.disability;

  const students = await UserModel.find(studentQuery).select('email givenName familyName fullName gender age grade disability schoolName');

  // Get coursework for this course
  const totalCoursework = await CourseworkModel.countDocuments({ courseId });

  // Initialize counters
  let preSurveyCompleted = 0;
  let preSurveyPending = 0;
  let courseCompleted = 0;
  let courseInProgress = 0;
  let courseNotStarted = 0;
  let ideaSubmitted = 0;
  let ideaDraft = 0;
  let ideaNotStarted = 0;
  let postSurveyCompleted = 0;
  let postSurveyPending = 0;

  // Calculate progress for each student
  const reportData = await Promise.all(
    students.map(async (student) => {
      const submissions = await SubmissionModel.find({
        courseId,
        userEmail: student.email
      });

      const completedCount = submissions.filter(s => s.state === 'TURNED_IN').length;
      const progress = totalCoursework > 0 
        ? Math.round((completedCount / totalCoursework) * 100)
        : 0;

      // Determine statuses
      const preSurvey = progress > 0 ? 'Completed' : 'Pending';
      const ideaStatus = progress > 50 ? 'Submitted' : progress > 20 ? 'Draft' : 'Not Started';
      const postSurvey = progress > 80 ? 'Completed' : 'Pending';

      // Update counters
      if (preSurvey === 'Completed') preSurveyCompleted++; else preSurveyPending++;
      if (progress >= 80) courseCompleted++;
      else if (progress > 0) courseInProgress++;
      else courseNotStarted++;
      if (ideaStatus === 'Submitted') ideaSubmitted++;
      else if (ideaStatus === 'Draft') ideaDraft++;
      else ideaNotStarted++;
      if (postSurvey === 'Completed') postSurveyCompleted++; else postSurveyPending++;

      const displayName = student.fullName || 
        (student.givenName && student.familyName ? `${student.givenName} ${student.familyName}` : null) ||
        (student.email ? student.email.split('@')[0] : 'Unknown Student');

      return {
        no: 0, // Will be set later
        district: (student as any).district || 'N/A',
        school: (student as any).schoolName || 'N/A',
        file: `${displayName} Progress Report`,
        focal: ['Progress'],
        course: courseId,
        range: new Date().toLocaleDateString(),
        studentName: displayName,
        email: student.email,
        progress,
        preSurvey,
        ideaStatus,
        postSurvey,
        age: (student as any).age,
        grade: (student as any).grade,
        gender: (student as any).gender,
        disability: (student as any).disability
      };
    })
  );

  // Add row numbers
  reportData.forEach((row, i) => {
    row.no = i + 1;
  });

  // Create chart data
  const totalStudents = students.length || 1;

  const charts = {
    pre: [
      { key: "submit" as const, value: preSurveyCompleted, fill: BLUE_100 },
      { key: "pending" as const, value: preSurveyPending, fill: ERROR_200 },
    ],
    course: [
      { key: "submit" as const, value: courseCompleted, fill: BLUE_700 },
      { key: "pending" as const, value: courseInProgress, fill: ERROR_200 },
      { key: "reviewed" as const, value: courseNotStarted, fill: BLUE_100 },
    ],
    idea: [
      { key: "submit" as const, value: ideaSubmitted, fill: BLUE_100 },
      { key: "pending" as const, value: ideaDraft, fill: ERROR_200 },
      { key: "reviewed" as const, value: ideaNotStarted, fill: BLUE_700 },
    ],
    post: [
      { key: "submit" as const, value: postSurveyCompleted, fill: BLUE_100 },
      { key: "pending" as const, value: postSurveyPending, fill: ERROR_200 },
    ],
  };

  return {
    charts,
    reportData,
    totalStudents: students.length
  };
}

async function getDistrictReportAnalytics(district: string | undefined, filters: any) {
  // Get all students in district with filters using real custom attributes
  let studentQuery: any = { role: 'student' };
  if (district) studentQuery.district = district;
  if (filters.gender) studentQuery.gender = filters.gender;
  if (filters.grade) studentQuery.grade = filters.grade;
  if (filters.age) studentQuery.age = filters.age;
  if (filters.disability) studentQuery.disability = filters.disability;

  const students = await UserModel.find(studentQuery).select('email givenName familyName fullName gender age grade disability schoolName district').limit(100);

  // Initialize counters
  let preSurveyCompleted = 0;
  let preSurveyPending = 0;
  let courseCompleted = 0;
  let courseInProgress = 0;
  let courseNotStarted = 0;
  let ideaSubmitted = 0;
  let ideaDraft = 0;
  let ideaNotStarted = 0;
  let postSurveyCompleted = 0;
  let postSurveyPending = 0;

  // Calculate progress for each student
  const reportData = await Promise.all(
    students.map(async (student) => {
      const submissions = await SubmissionModel.find({
        userEmail: student.email
      });

      const totalSubmissions = submissions.length;
      const completedCount = submissions.filter(s => s.state === 'TURNED_IN').length;
      const progress = totalSubmissions > 0 
        ? Math.round((completedCount / totalSubmissions) * 100)
        : 0;

      // Determine statuses
      const preSurvey = progress > 0 ? 'Completed' : 'Pending';
      const ideaStatus = progress > 50 ? 'Submitted' : progress > 20 ? 'Draft' : 'Not Started';
      const postSurvey = progress > 80 ? 'Completed' : 'Pending';

      // Update counters
      if (preSurvey === 'Completed') preSurveyCompleted++; else preSurveyPending++;
      if (progress >= 80) courseCompleted++;
      else if (progress > 0) courseInProgress++;
      else courseNotStarted++;
      if (ideaStatus === 'Submitted') ideaSubmitted++;
      else if (ideaStatus === 'Draft') ideaDraft++;
      else ideaNotStarted++;
      if (postSurvey === 'Completed') postSurveyCompleted++; else postSurveyPending++;

      const displayName = student.fullName || 
        (student.givenName && student.familyName ? `${student.givenName} ${student.familyName}` : null) ||
        (student.email ? student.email.split('@')[0] : 'Unknown Student');

      return {
        no: 0,
        district: (student as any).district || 'N/A',
        school: (student as any).schoolName || 'N/A',
        file: `${displayName} Progress Report`,
        focal: ['Progress'],
        course: 'Multiple Courses',
        range: new Date().toLocaleDateString(),
        studentName: displayName,
        email: student.email,
        progress,
        preSurvey,
        ideaStatus,
        postSurvey,
        age: (student as any).age,
        grade: (student as any).grade,
        gender: (student as any).gender,
        disability: (student as any).disability
      };
    })
  );

  // Add row numbers
  reportData.forEach((row, i) => {
    row.no = i + 1;
  });

  // Create chart data
  const totalStudents = students.length || 1;

  const charts = {
    pre: [
      { key: "submit" as const, value: preSurveyCompleted, fill: BLUE_100 },
      { key: "pending" as const, value: preSurveyPending, fill: ERROR_200 },
    ],
    course: [
      { key: "submit" as const, value: courseCompleted, fill: BLUE_700 },
      { key: "pending" as const, value: courseInProgress, fill: ERROR_200 },
      { key: "reviewed" as const, value: courseNotStarted, fill: BLUE_100 },
    ],
    idea: [
      { key: "submit" as const, value: ideaSubmitted, fill: BLUE_100 },
      { key: "pending" as const, value: ideaDraft, fill: ERROR_200 },
      { key: "reviewed" as const, value: ideaNotStarted, fill: BLUE_700 },
    ],
    post: [
      { key: "submit" as const, value: postSurveyCompleted, fill: BLUE_100 },
      { key: "pending" as const, value: postSurveyPending, fill: ERROR_200 },
    ],
  };

  return {
    charts,
    reportData,
    totalStudents: students.length
  };
}
