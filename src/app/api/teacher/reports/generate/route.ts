import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';
import { connectToDatabase } from '@/lib/mongodb';
import { ReportModel } from '@/models/Report';
import * as XLSX from 'xlsx';

interface ReportFilters {
  age?: string;
  grade?: string;
  gender?: string;
  disability?: string;
  courseId?: string;
}

interface StudentReportData {
  studentName: string;
  email: string;
  courseName: string;
  preSurveyStatus: 'Completed' | 'Pending' | 'Not Started';
  courseProgress: number;
  ideaSubmissionStatus: 'Completed' | 'Pending' | 'Not Started';
  postSurveyStatus: 'Completed' | 'Pending' | 'Not Started';
  certificateStatus: 'Earned' | 'Not Earned';
  totalAssignments: number;
  completedAssignments: number;
  averageGrade?: number;
  // Custom student attributes (will be populated when available)
  age?: string;
  gender?: string;
  disability?: string;
  grade?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if we have OAuth tokens
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No OAuth tokens found. Please log in again.' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { filters, courseId }: { filters: ReportFilters; courseId: string } = body;

    if (!courseId) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Initialize Google Classroom API with user's OAuth credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });
    
    const classroom = getClassroomWithUserAuth(oauth2Client);

    try {
      console.log('Generating report for course:', courseId, 'with filters:', filters);

      // Verify that the current user is a teacher in this course
      const teachersResponse = await classroom.courses.teachers.list({
        courseId: courseId
      });

      const teachers = teachersResponse.data.teachers || [];
      const isTeacher = teachers.some(teacher => 
        teacher.profile?.emailAddress?.toLowerCase() === payload.email.toLowerCase()
      );

      if (!isTeacher) {
        return NextResponse.json(
          { success: false, error: 'You are not a teacher in this course.' },
          { status: 403 }
        );
      }

      // Get course details
      const courseResponse = await classroom.courses.get({ id: courseId });
      const course = courseResponse.data;

      // Fetch students enrolled in the course
      const studentsResponse = await classroom.courses.students.list({
        courseId: courseId,
        pageSize: 100
      });

      const students = studentsResponse.data.students || [];
      console.log(`Found ${students.length} students in course`);

      // Fetch all coursework for the course
      const courseWorkResponse = await classroom.courses.courseWork.list({
        courseId: courseId,
        pageSize: 100
      });

      const courseWork = courseWorkResponse.data.courseWork || [];
      console.log(`Found ${courseWork.length} coursework items`);

      // Generate report data for each student
      const reportData: StudentReportData[] = [];

      for (const student of students) {
        if (!student.profile?.emailAddress) continue;

        let completedAssignments = 0;
        let totalAssignments = 0;
        let totalGrade = 0;
        let gradedAssignments = 0;
        let preSurveyCompleted = false;
        let ideaSubmissionCompleted = false;
        let postSurveyCompleted = false;
        let certificateEarned = false;

        // Check each assignment for this student
        for (const work of courseWork) {
          if (!work.id || work.workType !== 'ASSIGNMENT' || work.state !== 'PUBLISHED') continue;
          
          totalAssignments++;

          try {
            // Get student's submission for this assignment
            const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
              courseId: courseId,
              courseWorkId: work.id,
              userId: student.profile.id
            });

            const submissions = submissionsResponse.data.studentSubmissions || [];
            const studentSubmission = submissions.find(sub => 
              sub.userId === student.profile.id
            );

            if (studentSubmission) {
              // Check if assignment is completed
              if (studentSubmission.state === 'TURNED_IN' || studentSubmission.state === 'RETURNED') {
                completedAssignments++;

                // Check for specific assignment types
                const title = work.title?.toLowerCase() || '';
                if (title.includes('pre-survey') || title.includes('pre survey')) {
                  preSurveyCompleted = true;
                } else if (title.includes('idea') || title.includes('ideas')) {
                  ideaSubmissionCompleted = true;
                } else if (title.includes('post-survey') || title.includes('post survey')) {
                  postSurveyCompleted = true;
                } else if (title.includes('certificate') || title.includes('final')) {
                  certificateEarned = true;
                }
              }

              // Track grades for average calculation
              if (studentSubmission.assignedGrade !== null && studentSubmission.assignedGrade !== undefined) {
                totalGrade += studentSubmission.assignedGrade;
                gradedAssignments++;
              }
            }
          } catch (error) {
            console.warn(`Error fetching submission for student ${student.profile.emailAddress} in assignment ${work.id}:`, error);
          }
        }

        const courseProgress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
        const averageGrade = gradedAssignments > 0 ? Math.round(totalGrade / gradedAssignments) : undefined;

        const studentName = student.profile.name?.fullName || 
          `${student.profile.name?.givenName || ''} ${student.profile.name?.familyName || ''}`.trim() ||
          'Unknown Student';

        reportData.push({
          studentName,
          email: student.profile.emailAddress || '',
          courseName: course.name || 'Unknown Course',
          preSurveyStatus: preSurveyCompleted ? 'Completed' : (courseProgress > 0 ? 'Pending' : 'Not Started'),
          courseProgress,
          ideaSubmissionStatus: ideaSubmissionCompleted ? 'Completed' : (courseProgress > 50 ? 'Pending' : 'Not Started'),
          postSurveyStatus: postSurveyCompleted ? 'Completed' : (courseProgress > 80 ? 'Pending' : 'Not Started'),
          certificateStatus: certificateEarned ? 'Earned' : 'Not Earned',
          totalAssignments,
          completedAssignments,
          averageGrade,
          // Custom attributes (will be populated from student profile when available)
          age: undefined, // TODO: Get from student profile custom attributes
          gender: undefined, // TODO: Get from student profile custom attributes
          disability: undefined, // TODO: Get from student profile custom attributes
          grade: undefined, // TODO: Get from student profile custom attributes
        });
      }

      // Apply filters based on custom attributes
      let filteredData = reportData;
      
      if (filters.age || filters.grade || filters.gender || filters.disability) {
        filteredData = reportData.filter(student => {
          if (filters.age && student.age !== filters.age) return false;
          if (filters.grade && student.grade !== filters.grade) return false;
          if (filters.gender && student.gender !== filters.gender) return false;
          if (filters.disability && student.disability !== filters.disability) return false;
          return true;
        });
      }

      // Generate Excel file
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Report');

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `student-report-${course.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'course'}-${timestamp}.xlsx`;

      console.log(`Generated report with ${filteredData.length} students`);

      // Connect to database and save report record
      await connectToDatabase();
      
      const reportRecord = new ReportModel({
        fileName: filename,
        courseId: courseId,
        courseName: course.name || 'Unknown Course',
        teacherEmail: payload.email,
        reportType: 'student-progress',
        filePath: `/reports/${courseId}/${Date.now()}-student-report.xlsx`,
        fileSize: excelBuffer.length,
        focalPoints: ['Age', 'Gender', 'Disability', 'Grade'],
        filters: filters,
        generatedAt: new Date()
      });

      await reportRecord.save();
      console.log('Report saved to database:', reportRecord._id);

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });

    } catch (googleError: any) {
      console.error('Error generating report from Google Classroom:', googleError);
      
      if (googleError.code === 403) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to generate report from Google Classroom' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Report generation API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
