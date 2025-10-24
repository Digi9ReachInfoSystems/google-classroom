import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CertificateModel } from '@/models/Certificate';
import { StageCompletionModel } from '@/models/StageCompletion';
import { google } from 'googleapis';

// Helper function to generate unique certificate number
function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const studentEmail = payload.email;

    // Check if certificate already exists
    const certificate = await CertificateModel.findOne({
      studentEmail,
      courseId
    });

    if (certificate) {
      return NextResponse.json({
        success: true,
        hasCertificate: true,
        certificate: {
          id: certificate._id,
          certificateNumber: certificate.certificateNumber,
          issuedAt: certificate.issuedAt,
          courseName: certificate.courseName,
          studentName: certificate.studentName,
          completionData: certificate.completionData
        }
      });
    }

    // Check for 100% completion
    // 1. Check stage completions (pre-survey, ideas, post-survey)
    const preSurveyCompletion = await StageCompletionModel.findOne({
      courseId,
      studentEmail,
      stageId: 'pre-survey'
    });

    const ideasCompletion = await StageCompletionModel.findOne({
      courseId,
      studentEmail,
      stageId: 'ideas'
    });

    const postSurveyCompletion = await StageCompletionModel.findOne({
      courseId,
      studentEmail,
      stageId: 'post-survey'
    });

    // 2. Check learning modules completion
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });

    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

    // Fetch all coursework
    const courseworkResponse = await classroom.courses.courseWork.list({
      courseId: courseId,
      pageSize: 100
    });

    const allCoursework = courseworkResponse.data.courseWork || [];

    // Filter assignments only (exclude surveys, ideas, and courses)
    const assignments = allCoursework.filter((cw: any) => {
      if (!cw.title) return false;
      const title = cw.title.toLowerCase();
      return !title.includes('survey') && 
             !title.includes('idea') && 
             !title.includes('course') && 
             !title.includes('cours ') &&
             !title.includes('material') && 
             !title.includes('mat '); // legacy support
    });

    // Note: We only check assignments via Google Classroom submissions now
    // Material completions are not part of the certificate criteria

    // Check Google Classroom submissions for assignments only
    let completedAssignmentsCount = 0;
    for (const assignment of assignments) {
      if (!assignment.id) continue;

      console.log(`Checking assignment: ${assignment.title} (${assignment.id})`);

      // Check Google Classroom submission
      try {
        const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
          courseId: courseId,
          courseWorkId: assignment.id,
          userId: studentEmail,
          pageSize: 1
        });

        const submissions = submissionsResponse.data.studentSubmissions || [];
        if (submissions.length > 0) {
          const submission = submissions[0];
          console.log(`  Submission state: ${submission.state}`);
          // Accept both TURNED_IN and RETURNED states
          if (submission.state === 'TURNED_IN' || submission.state === 'RETURNED') {
            console.log(`  ✓ Completed via Google Classroom`);
            completedAssignmentsCount++;
          }
        } else {
          console.log(`  ✗ No submission found`);
        }
      } catch (error) {
        console.warn(`Error fetching submission for assignment ${assignment.id}:`, error);
      }
    }

    console.log(`Completed assignments: ${completedAssignmentsCount}/${assignments.length}`);

    const allAssignmentsCompleted = assignments.length > 0 && 
                                   completedAssignmentsCount === assignments.length;

    const preSurveyCompleted = !!preSurveyCompletion;
    const postSurveyCompleted = !!postSurveyCompletion;
    const ideasCompleted = !!ideasCompletion;

    console.log('Completion Status:');
    console.log(`  Pre-Survey: ${preSurveyCompleted ? '✓' : '✗'}`);
    console.log(`  Post-Survey: ${postSurveyCompleted ? '✓' : '✗'}`);
    console.log(`  Ideas: ${ideasCompleted ? '✓' : '✗'}`);
    console.log(`  Assignments: ${allAssignmentsCompleted ? '✓' : '✗'} (${completedAssignmentsCount}/${assignments.length})`);

    const is100PercentComplete = preSurveyCompleted && 
                                  postSurveyCompleted && 
                                  ideasCompleted && 
                                  allAssignmentsCompleted;

    console.log(`100% Complete: ${is100PercentComplete ? 'YES' : 'NO'}`);

    // If 100% complete, generate certificate
    if (is100PercentComplete) {
      // Get course details
      const courseResponse = await classroom.courses.get({ id: courseId });
      const course = courseResponse.data;

      // Get student name - try multiple sources
      let studentName = 'Student';
      
      // First, try to get from Google Classroom user profile
      try {
        const userProfileResponse = await classroom.userProfiles.get({ userId: 'me' });
        const profile = userProfileResponse.data;
        if (profile.name?.fullName) {
          studentName = profile.name.fullName;
        } else if (profile.name?.givenName || profile.name?.familyName) {
          studentName = `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim();
        }
      } catch (profileError) {
        console.log('Could not fetch user profile from Classroom, using JWT data');
      }
      
      // Fallback to JWT payload if Classroom profile not available
      if (studentName === 'Student') {
        studentName = (payload as any).name || (payload as any).given_name || payload.email || 'Student';
      }
      
      console.log('Certificate will be issued to:', studentName);

      // Create certificate
      const newCertificate = await CertificateModel.create({
        studentEmail,
        courseId,
        courseName: course.name || 'Course',
        studentName,
        issuedAt: new Date(),
        certificateNumber: generateCertificateNumber(),
        completionData: {
          preSurveyCompleted,
          postSurveyCompleted,
          ideasCompleted,
          assignmentsCompleted: allAssignmentsCompleted,
          totalAssignments: assignments.length,
          completedAssignments: completedAssignmentsCount
        }
      });

      return NextResponse.json({
        success: true,
        hasCertificate: true,
        certificate: {
          id: newCertificate._id,
          certificateNumber: newCertificate.certificateNumber,
          issuedAt: newCertificate.issuedAt,
          courseName: newCertificate.courseName,
          studentName: newCertificate.studentName,
          completionData: newCertificate.completionData
        }
      });
    }

    // Return completion status
    return NextResponse.json({
      success: true,
      hasCertificate: false,
      completionStatus: {
        preSurveyCompleted,
        postSurveyCompleted,
        ideasCompleted,
        assignmentsCompleted: allAssignmentsCompleted,
        totalAssignments: assignments.length,
        completedAssignments: completedAssignmentsCount,
        completionPercentage: Math.round(
          ((Number(preSurveyCompleted) + Number(postSurveyCompleted) + Number(ideasCompleted) + (completedAssignmentsCount / (assignments.length || 1))) / 4) * 100
        )
      }
    });

  } catch (error) {
    console.error('Certificate API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

