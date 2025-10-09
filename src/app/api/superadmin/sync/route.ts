import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { google } from 'googleapis';
import { UserModel } from '@/models/User';
import { CourseModel } from '@/models/Course';
import { CourseworkModel } from '@/models/Coursework';
import { SubmissionModel } from '@/models/Submission';
import { RosterMembershipModel } from '@/models/RosterMembership';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'super-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No OAuth credentials found' 
      }, { status: 401 });
    }

    await connectToDatabase();

    // Create OAuth2 client
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
    const adminDirectory = google.admin({ version: 'directory_v1', auth: oauth2Client });

    let syncedCourses = 0;
    let syncedStudents = 0;
    let syncedCoursework = 0;
    let syncedSubmissions = 0;

    // 1. Sync Courses
    const coursesResponse = await classroom.courses.list({
      teacherId: 'me',
      pageSize: 100,
      courseStates: ['ACTIVE']
    });

    const courses = coursesResponse.data.courses || [];
    
    for (const course of courses) {
      await CourseModel.findOneAndUpdate(
        { courseId: course.id },
        {
          courseId: course.id,
          name: course.name,
          section: course.section,
          descriptionHeading: course.descriptionHeading,
          description: course.description,
          room: course.room,
          ownerId: course.ownerId,
          creationTime: course.creationTime,
          updateTime: course.updateTime,
          enrollmentCode: course.enrollmentCode,
          courseState: course.courseState,
          alternateLink: course.alternateLink,
          teacherGroupEmail: course.teacherGroupEmail,
          courseGroupEmail: course.courseGroupEmail,
        },
        { upsert: true, new: true }
      );
      syncedCourses++;

      // 2. Sync Students for each course
      try {
        const studentsResponse = await classroom.courses.students.list({
          courseId: course.id!,
          pageSize: 100
        });

        const students = studentsResponse.data.students || [];
        
        for (const student of students) {
          const profile = student.profile;
          if (!profile) continue;

          // Fetch custom attributes from Admin Directory
          let customAttributes: any = {};
          try {
            const userResponse = await adminDirectory.users.get({
              userKey: profile.emailAddress!,
              projection: 'full'
            });

            const userData = userResponse.data;
            if (userData.customSchemas) {
              customAttributes = userData.customSchemas;
            }
          } catch (error) {
            console.log(`Could not fetch custom attributes for ${profile.emailAddress}`);
          }

          // Extract custom attributes
          const studentProfile = customAttributes.StudentProfile || {};
          const gender = studentProfile.Gender || '';
          const district = studentProfile.District || '';
          const grade = studentProfile.Grade || '';
          const schoolName = studentProfile.SchoolName || '';
          const age = studentProfile.Age || '';

          await UserModel.findOneAndUpdate(
            { email: profile.emailAddress },
            {
              email: profile.emailAddress,
              googleId: profile.id,
              givenName: profile.name?.givenName,
              familyName: profile.name?.familyName,
              fullName: profile.name?.fullName,
              photoUrl: profile.photoUrl,
              role: 'student',
              gender,
              district,
              grade,
              schoolName,
              age,
              customSchemas: customAttributes
            },
            { upsert: true, new: true }
          );

          // Save roster membership
          await RosterMembershipModel.findOneAndUpdate(
            { courseId: course.id, userId: profile.emailAddress },
            {
              courseId: course.id,
              userId: profile.emailAddress,
              role: 'STUDENT',
              profile: {
                id: profile.id,
                name: profile.name,
                emailAddress: profile.emailAddress,
                photoUrl: profile.photoUrl
              }
            },
            { upsert: true, new: true }
          );

          syncedStudents++;
        }
      } catch (error) {
        console.error(`Error syncing students for course ${course.id}:`, error);
      }

      // 3. Sync Coursework for each course
      try {
        const courseworkResponse = await classroom.courses.courseWork.list({
          courseId: course.id!,
          pageSize: 100
        });

        const courseworks = courseworkResponse.data.courseWork || [];
        
        for (const work of courseworks) {
          await CourseworkModel.findOneAndUpdate(
            { courseWorkId: work.id },
            {
              courseId: course.id,
              courseWorkId: work.id,
              title: work.title,
              description: work.description,
              materials: work.materials || [],
              state: work.state,
              alternateLink: work.alternateLink,
              creationTime: work.creationTime,
              updateTime: work.updateTime,
              dueDate: work.dueDate,
              dueTime: work.dueTime,
              maxPoints: work.maxPoints,
              workType: work.workType,
              assigneeMode: work.assigneeMode,
            },
            { upsert: true, new: true }
          );
          syncedCoursework++;

          // 4. Sync Submissions for each coursework
          try {
            const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
              courseId: course.id!,
              courseWorkId: work.id!,
              pageSize: 100
            });

            const submissions = submissionsResponse.data.studentSubmissions || [];
            
            for (const submission of submissions) {
              await SubmissionModel.findOneAndUpdate(
                { submissionId: submission.id },
                {
                  courseId: course.id,
                  courseWorkId: work.id,
                  submissionId: submission.id,
                  userId: submission.userId,
                  userEmail: submission.userId,
                  creationTime: submission.creationTime,
                  updateTime: submission.updateTime,
                  state: submission.state,
                  draftGrade: submission.draftGrade,
                  assignedGrade: submission.assignedGrade,
                  alternateLink: submission.alternateLink,
                  courseWorkType: submission.courseWorkType,
                  assignmentSubmission: submission.assignmentSubmission,
                  shortAnswerSubmission: submission.shortAnswerSubmission,
                  multipleChoiceSubmission: submission.multipleChoiceSubmission,
                },
                { upsert: true, new: true }
              );
              syncedSubmissions++;
            }
          } catch (error) {
            console.error(`Error syncing submissions for coursework ${work.id}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error syncing coursework for course ${course.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      stats: {
        courses: syncedCourses,
        students: syncedStudents,
        coursework: syncedCoursework,
        submissions: syncedSubmissions
      }
    });

  } catch (error) {
    console.error('Super admin sync error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
