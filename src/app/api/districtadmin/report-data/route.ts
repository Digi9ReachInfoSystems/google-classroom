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

    let reportData;

    if (courseId) {
      // Get report data for specific course
      reportData = await getCourseReportData(courseId);
    } else {
      // Get report data for all courses in district
      reportData = await getDistrictReportData((payload as any).district);
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      courseId: courseId || 'all'
    });

  } catch (error) {
    console.error('District admin report data API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCourseReportData(courseId: string) {
  // Get students in this course
  const studentEmails = await RosterMembershipModel.distinct('userEmail', {
    courseId,
    role: 'student'
  });

  // Get student details
  const students = await UserModel.find({
    email: { $in: studentEmails },
    role: 'student'
  }).select('email givenName familyName fullName');

  // Get coursework for this course
  const totalCoursework = await CourseworkModel.countDocuments({ courseId });

  // Calculate stats
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

  // Build student data
  const studentData = await Promise.all(
    students.map(async (student) => {
      const submissions = await SubmissionModel.find({
        courseId,
        userEmail: student.email
      });

      const completedCount = submissions.filter(s => s.state === 'TURNED_IN').length;
      const progress = totalCoursework > 0 
        ? Math.round((completedCount / totalCoursework) * 100)
        : 0;

      // Determine statuses (simplified logic)
      const preSurvey = progress > 0 ? 'Completed' : 'Pending';
      const ideaStatus = progress > 50 ? 'Submitted' : progress > 20 ? 'Draft' : 'Not Started';
      const postSurvey = progress > 80 ? 'Completed' : 'Pending';

      // Update counters
      if (preSurvey === 'Completed') preSurveyCompleted++; else preSurveyPending++;
      if (progress === 100) courseCompleted++;
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
        name: displayName,
        email: student.email || 'unknown@example.com',
        preSurvey,
        courseProgress: progress,
        ideaSubmission: ideaStatus,
        postSurvey
      };
    })
  );

  return {
    preSurvey: { completed: preSurveyCompleted, pending: preSurveyPending },
    courseProgress: { completed: courseCompleted, inProgress: courseInProgress, notStarted: courseNotStarted },
    ideaSubmission: { submitted: ideaSubmitted, draft: ideaDraft, notStarted: ideaNotStarted },
    postSurvey: { completed: postSurveyCompleted, pending: postSurveyPending },
    students: studentData
  };
}

async function getDistrictReportData(district?: string) {
  // Get all students in district
  const query = district ? { role: 'student', district } : { role: 'student' };
  const students = await UserModel.find(query).select('email givenName familyName fullName').limit(100);

  // Calculate stats
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

  // Build student data
  const studentData = await Promise.all(
    students.map(async (student) => {
      const submissions = await SubmissionModel.find({
        userEmail: student.email
      });

      const totalSubmissions = submissions.length;
      const completedCount = submissions.filter(s => s.state === 'TURNED_IN').length;
      const progress = totalSubmissions > 0 
        ? Math.round((completedCount / totalSubmissions) * 100)
        : 0;

      // Determine statuses (simplified logic)
      const preSurvey = progress > 0 ? 'Completed' : 'Pending';
      const ideaStatus = progress > 50 ? 'Submitted' : progress > 20 ? 'Draft' : 'Not Started';
      const postSurvey = progress > 80 ? 'Completed' : 'Pending';

      // Update counters
      if (preSurvey === 'Completed') preSurveyCompleted++; else preSurveyPending++;
      if (progress === 100) courseCompleted++;
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
        name: displayName,
        email: student.email || 'unknown@example.com',
        preSurvey,
        courseProgress: progress,
        ideaSubmission: ideaStatus,
        postSurvey
      };
    })
  );

  return {
    preSurvey: { completed: preSurveyCompleted, pending: preSurveyPending },
    courseProgress: { completed: courseCompleted, inProgress: courseInProgress, notStarted: courseNotStarted },
    ideaSubmission: { submitted: ideaSubmitted, draft: ideaDraft, notStarted: ideaNotStarted },
    postSurvey: { completed: postSurveyCompleted, pending: postSurveyPending },
    students: studentData
  };
}
