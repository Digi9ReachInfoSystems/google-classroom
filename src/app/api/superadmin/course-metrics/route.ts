import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';
import { UserModel } from '@/models/User';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { CourseworkModel } from '@/models/Coursework';
import { SubmissionModel } from '@/models/Submission';
import { StageCompletionModel } from '@/models/StageCompletion';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    // Check if user is super admin
    if (payload.role !== 'super-admin') {
      console.log('Access denied. Role check:', { expectedRole: 'super-admin', actualRole: payload.role });
      return NextResponse.json(
        { message: 'Access denied', expectedRole: 'super-admin', actualRole: payload.role },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 });
    }

    // Get course info
    const course = await CourseModel.findOne({ courseId });
    if (!course) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
    }

    // Get all students in this course
    const enrollments = await RosterMembershipModel.find({
      courseId,
      role: 'STUDENT'
    });

    const studentEmails = enrollments.map(e => e.userEmail);
    const totalStudents = studentEmails.length;

    // Get all coursework for this course
    const allCoursework = await CourseworkModel.find({ courseId });

    // Separate coursework by type
    const preSurveyWork = allCoursework.find(cw => 
      cw.title?.toLowerCase().includes('pre-survey') || 
      cw.title?.toLowerCase().includes('pre survey')
    );
    const postSurveyWork = allCoursework.find(cw => 
      cw.title?.toLowerCase().includes('post-survey') || 
      cw.title?.toLowerCase().includes('post survey')
    );
    const ideaWork = allCoursework.find(cw => 
      cw.title?.toLowerCase().includes('idea')
    );
    const learningModules = allCoursework.filter(cw => 
      !cw.title?.toLowerCase().includes('pre-survey') &&
      !cw.title?.toLowerCase().includes('pre survey') &&
      !cw.title?.toLowerCase().includes('post-survey') &&
      !cw.title?.toLowerCase().includes('post survey') &&
      !cw.title?.toLowerCase().includes('idea')
    );

    // Count completions for each type
    let preSurveyCompleted = 0;
    let postSurveyCompleted = 0;
    let ideaCompleted = 0;
    let courseCompleted = 0;

    // Check stage completions (for pre-survey, post-survey, ideas)
    const stageCompletions = await StageCompletionModel.find({
      courseId,
      studentEmail: { $in: studentEmails }
    });

    for (const studentEmail of studentEmails) {
      // Pre-survey
      if (preSurveyWork) {
        const hasStageCompletion = stageCompletions.some(
          sc => sc.studentEmail === studentEmail && sc.stageId === 'pre-survey'
        );
        const hasSubmission = await SubmissionModel.findOne({
          courseId,
          courseWorkId: preSurveyWork.courseWorkId,
          studentEmail,
          state: { $in: ['TURNED_IN', 'RETURNED'] }
        });
        if (hasStageCompletion || hasSubmission) {
          preSurveyCompleted++;
        }
      }

      // Post-survey
      if (postSurveyWork) {
        const hasStageCompletion = stageCompletions.some(
          sc => sc.studentEmail === studentEmail && sc.stageId === 'post-survey'
        );
        const hasSubmission = await SubmissionModel.findOne({
          courseId,
          courseWorkId: postSurveyWork.courseWorkId,
          studentEmail,
          state: { $in: ['TURNED_IN', 'RETURNED'] }
        });
        if (hasStageCompletion || hasSubmission) {
          postSurveyCompleted++;
        }
      }

      // Ideas
      if (ideaWork) {
        const hasStageCompletion = stageCompletions.some(
          sc => sc.studentEmail === studentEmail && sc.stageId === 'ideas'
        );
        const hasSubmission = await SubmissionModel.findOne({
          courseId,
          courseWorkId: ideaWork.courseWorkId,
          studentEmail,
          state: { $in: ['TURNED_IN', 'RETURNED'] }
        });
        if (hasStageCompletion || hasSubmission) {
          ideaCompleted++;
        }
      }

      // Course (learning modules) - check if all modules are completed
      if (learningModules.length > 0) {
        let allModulesCompleted = true;
        for (const module of learningModules) {
          const hasStageCompletion = stageCompletions.some(
            sc => sc.studentEmail === studentEmail && sc.stageId === module.courseWorkId
          );
          const hasSubmission = await SubmissionModel.findOne({
            courseId,
            courseWorkId: module.courseWorkId,
            studentEmail,
            state: { $in: ['TURNED_IN', 'RETURNED'] }
          });
          if (!hasStageCompletion && !hasSubmission) {
            allModulesCompleted = false;
            break;
          }
        }
        if (allModulesCompleted) {
          courseCompleted++;
        }
      }
    }

    // Calculate percentages
    const preSurveyPercentage = totalStudents > 0 ? Math.round((preSurveyCompleted / totalStudents) * 100) : 0;
    const postSurveyPercentage = totalStudents > 0 ? Math.round((postSurveyCompleted / totalStudents) * 100) : 0;
    const ideaPercentage = totalStudents > 0 ? Math.round((ideaCompleted / totalStudents) * 100) : 0;
    const coursePercentage = totalStudents > 0 ? Math.round((courseCompleted / totalStudents) * 100) : 0;

    // Get district-wise breakdown
    const students = await UserModel.find({
      email: { $in: studentEmails },
      role: 'student'
    });

    // Group by district
    const districtMap = new Map<string, {
      preSurvey: number;
      course: number;
      idea: number;
      postSurvey: number;
      total: number;
    }>();

    for (const student of students) {
      const district = student.district || 'Unknown';
      if (!districtMap.has(district)) {
        districtMap.set(district, {
          preSurvey: 0,
          course: 0,
          idea: 0,
          postSurvey: 0,
          total: 0
        });
      }

      const districtData = districtMap.get(district)!;
      districtData.total++;

      // Check completions for this student
      const studentEmail = student.email;

      // Pre-survey
      if (preSurveyWork) {
        const hasStageCompletion = stageCompletions.some(
          sc => sc.studentEmail === studentEmail && sc.stageId === 'pre-survey'
        );
        const hasSubmission = await SubmissionModel.findOne({
          courseId,
          courseWorkId: preSurveyWork.courseWorkId,
          studentEmail,
          state: { $in: ['TURNED_IN', 'RETURNED'] }
        });
        if (hasStageCompletion || hasSubmission) {
          districtData.preSurvey++;
        }
      }

      // Course
      if (learningModules.length > 0) {
        let allModulesCompleted = true;
        for (const module of learningModules) {
          const hasStageCompletion = stageCompletions.some(
            sc => sc.studentEmail === studentEmail && sc.stageId === module.courseWorkId
          );
          const hasSubmission = await SubmissionModel.findOne({
            courseId,
            courseWorkId: module.courseWorkId,
            studentEmail,
            state: { $in: ['TURNED_IN', 'RETURNED'] }
          });
          if (!hasStageCompletion && !hasSubmission) {
            allModulesCompleted = false;
            break;
          }
        }
        if (allModulesCompleted) {
          districtData.course++;
        }
      }

      // Ideas
      if (ideaWork) {
        const hasStageCompletion = stageCompletions.some(
          sc => sc.studentEmail === studentEmail && sc.stageId === 'ideas'
        );
        const hasSubmission = await SubmissionModel.findOne({
          courseId,
          courseWorkId: ideaWork.courseWorkId,
          studentEmail,
          state: { $in: ['TURNED_IN', 'RETURNED'] }
        });
        if (hasStageCompletion || hasSubmission) {
          districtData.idea++;
        }
      }

      // Post-survey
      if (postSurveyWork) {
        const hasStageCompletion = stageCompletions.some(
          sc => sc.studentEmail === studentEmail && sc.stageId === 'post-survey'
        );
        const hasSubmission = await SubmissionModel.findOne({
          courseId,
          courseWorkId: postSurveyWork.courseWorkId,
          studentEmail,
          state: { $in: ['TURNED_IN', 'RETURNED'] }
        });
        if (hasStageCompletion || hasSubmission) {
          districtData.postSurvey++;
        }
      }
    }

    // Convert to array and calculate percentages
    const districtBreakdown = Array.from(districtMap.entries()).map(([district, data]) => ({
      district,
      preSurvey: data.total > 0 ? Math.round((data.preSurvey / data.total) * 100) : 0,
      course: data.total > 0 ? Math.round((data.course / data.total) * 100) : 0,
      idea: data.total > 0 ? Math.round((data.idea / data.total) * 100) : 0,
      postSurvey: data.total > 0 ? Math.round((data.postSurvey / data.total) * 100) : 0,
      totalStudents: data.total
    }));

    return NextResponse.json({
      success: true,
      metrics: {
        totalStudents,
        participation: {
          course: {
            completed: courseCompleted,
            percentage: coursePercentage
          },
          preSurvey: {
            completed: preSurveyCompleted,
            percentage: preSurveyPercentage
          },
          postSurvey: {
            completed: postSurveyCompleted,
            percentage: postSurveyPercentage
          },
          idea: {
            completed: ideaCompleted,
            percentage: ideaPercentage
          }
        },
        districtBreakdown,
        progressTrends: {
          courseCompletion: coursePercentage,
          ideaSubmission: ideaPercentage
        }
      }
    });

  } catch (error: any) {
    console.error('Super admin course metrics API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

