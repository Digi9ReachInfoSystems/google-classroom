import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';
import { UserModel } from '@/models/User';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { CourseworkModel } from '@/models/Coursework';
import { SubmissionModel } from '@/models/Submission';
import { StageCompletionModel } from '@/models/StageCompletion';
import { ReportModel } from '@/models/Report';
import * as XLSX from 'xlsx';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 });
    }

    const payload = jwt.verify(token, JWT_SECRET) as any;

    // Check if user is super admin
    if (payload.role !== 'super-admin') {
      return NextResponse.json(
        { message: 'Access denied', expectedRole: 'super-admin', actualRole: payload.role },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { courseId, filters } = body;

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

    // Build filter query
    const filterQuery: any = {
      email: { $in: studentEmails },
      role: 'student'
    };

    if (filters?.age && filters.age !== 'All') {
      filterQuery.age = filters.age;
    }
    if (filters?.grade && filters.grade !== 'All') {
      filterQuery.grade = filters.grade;
    }
    if (filters?.gender && filters.gender !== 'All') {
      filterQuery.gender = filters.gender;
    }
    if (filters?.disability && filters.disability !== 'All') {
      filterQuery.disability = filters.disability;
    }

    // Get filtered students
    const students = await UserModel.find(filterQuery);

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

    // Get stage completions
    const stageCompletions = await StageCompletionModel.find({
      courseId,
      studentEmail: { $in: students.map(s => s.email) }
    });

    // Build report data
    const reportData = [];
    for (const student of students) {
      const studentEmail = student.email;

      // Check pre-survey
      let preSurveyStatus = 'Pending';
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
          preSurveyStatus = 'Completed';
        }
      }

      // Check post-survey
      let postSurveyStatus = 'Pending';
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
          postSurveyStatus = 'Completed';
        }
      }

      // Check ideas
      let ideaStatus = 'Pending';
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
          ideaStatus = 'Completed';
        }
      }

      // Check course (learning modules)
      let courseStatus = 'Pending';
      let completedModules = 0;
      if (learningModules.length > 0) {
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
          if (hasStageCompletion || hasSubmission) {
            completedModules++;
          }
        }
        if (completedModules === learningModules.length) {
          courseStatus = 'Completed';
        } else if (completedModules > 0) {
          courseStatus = 'In Progress';
        }
      }

      reportData.push({
        'Student Name': student.name || student.email,
        'Email': student.email,
        'School': student.schoolName || '-',
        'District': student.district || '-',
        'Age': student.age || '-',
        'Grade': student.grade || '-',
        'Gender': student.gender || '-',
        'Disability': student.disability || '-',
        'Pre-Survey': preSurveyStatus,
        'Course Progress': courseStatus,
        'Learning Modules Completed': `${completedModules}/${learningModules.length}`,
        'Idea Submission': ideaStatus,
        'Post-Survey': postSurveyStatus
      });
    }

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Save report metadata to database
    const fileName = `report_${course.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const reportRecord = new ReportModel({
      fileName,
      courseId,
      courseName: course.name,
      teacherEmail: payload.email,
      reportType: 'comprehensive',
      filePath: `/reports/${fileName}`,
      fileSize: excelBuffer.length,
      focalPoints: ['Pre-Survey', 'Course Progress', 'Idea Submission', 'Post-Survey'],
      filters: filters || {},
      generatedAt: new Date()
    });

    await reportRecord.save();

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: any) {
    console.error('Super admin report generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

