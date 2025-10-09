import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';
import { CourseModel } from '@/models/Course';
import { UserModel } from '@/models/User';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { CourseworkModel } from '@/models/Coursework';
import { SubmissionModel } from '@/models/Submission';
import { SyncLogModel } from '@/models/SyncLog';
import { AnalyticsModel } from '@/models/Analytics';
import { SchoolModel } from '@/models/School';
import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';

/**
 * OAuth-Based Comprehensive Sync for District/Super Admin
 * Uses the admin's own OAuth credentials to fetch and sync data
 * This works because the admin is authenticated via Google OAuth
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || (payload.role !== 'district-admin' && payload.role !== 'super-admin')) {
      return NextResponse.json({ message: 'Access denied. Only district-admin and super-admin can sync.' }, { status: 403 });
    }

    // Check if we have OAuth tokens
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No OAuth tokens found. Please log in again via Google OAuth.' 
      }, { status: 401 });
    }

    const { syncType = 'full' } = await req.json();
    const syncId = uuidv4();
    const startTime = new Date();

    console.log(`\n=== Starting OAuth-based ${syncType} sync ===`);
    console.log(`Admin: ${payload.email} (${payload.role})`);
    console.log(`Sync ID: ${syncId}`);

    // Connect to database
    await connectToDatabase();

    // Create sync log
    const syncLog = new SyncLogModel({
      syncId,
      userId: payload.email,
      userRole: payload.role as 'district-admin' | 'super-admin',
      syncType: syncType as 'full' | 'incremental' | 'courses' | 'users' | 'submissions',
      status: 'started',
      startTime,
      recordsProcessed: 0,
      recordsSynced: 0,
      recordsFailed: 0
    });
    await syncLog.save();

    // Initialize Google Classroom API with admin's OAuth credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });
    
    const classroom = getClassroomWithUserAuth(oauth2Client);
    
    // Also create Admin Directory service with same OAuth credentials
    const adminDirectory = google.admin({ version: 'directory_v1', auth: oauth2Client });

    let totalRecordsProcessed = 0;
    let totalRecordsSynced = 0;
    let totalRecordsFailed = 0;

    try {
      // Update sync status
      await SyncLogModel.findOneAndUpdate(
        { syncId },
        { status: 'in_progress' }
      );

      // Execute sync based on type
      if (syncType === 'courses' || syncType === 'full') {
        console.log('\n📚 Syncing courses...');
        const coursesResult = await syncCoursesWithOAuth(classroom, syncId);
        totalRecordsProcessed += coursesResult.processed;
        totalRecordsSynced += coursesResult.synced;
        totalRecordsFailed += coursesResult.failed;
        console.log(`✓ Courses: ${coursesResult.synced} synced, ${coursesResult.failed} failed`);
      }

      if (syncType === 'users' || syncType === 'full') {
        console.log('\n👥 Syncing users and roster memberships...');
        const usersResult = await syncUsersAndRostersWithOAuth(classroom, adminDirectory, syncId);
        totalRecordsProcessed += usersResult.processed;
        totalRecordsSynced += usersResult.synced;
        totalRecordsFailed += usersResult.failed;
        console.log(`✓ Users: ${usersResult.synced} synced, ${usersResult.failed} failed`);
      }

      if (syncType === 'submissions' || syncType === 'full') {
        console.log('\n📝 Syncing coursework and submissions...');
        const courseworkResult = await syncCourseworkAndSubmissionsWithOAuth(classroom, syncId);
        totalRecordsProcessed += courseworkResult.processed;
        totalRecordsSynced += courseworkResult.synced;
        totalRecordsFailed += courseworkResult.failed;
        console.log(`✓ Submissions: ${courseworkResult.synced} synced, ${courseworkResult.failed} failed`);
      }

      if (syncType === 'full') {
        console.log('\n📊 Calculating analytics...');
        await calculateAnalytics(syncId);
        console.log('✓ Analytics calculated');

        console.log('\n🏫 Updating school information...');
        await updateSchoolInformation(syncId);
        console.log('✓ Schools updated');
      }

      // Update sync log with success
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      await SyncLogModel.findOneAndUpdate(
        { syncId },
        {
          status: 'completed',
          endTime,
          duration,
          recordsProcessed: totalRecordsProcessed,
          recordsSynced: totalRecordsSynced,
          recordsFailed: totalRecordsFailed,
          metadata: {
            lastSyncTime: endTime
          }
        }
      );

      console.log(`\n✅ Sync completed successfully!`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Processed: ${totalRecordsProcessed}, Synced: ${totalRecordsSynced}, Failed: ${totalRecordsFailed}`);

      return NextResponse.json({
        success: true,
        message: 'Sync completed successfully',
        syncId,
        duration,
        recordsProcessed: totalRecordsProcessed,
        recordsSynced: totalRecordsSynced,
        recordsFailed: totalRecordsFailed,
        syncType
      });

    } catch (error) {
      console.error('❌ Sync failed:', error);
      
      // Update sync log with failure
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      await SyncLogModel.findOneAndUpdate(
        { syncId },
        {
          status: 'failed',
          endTime,
          duration,
          recordsProcessed: totalRecordsProcessed,
          recordsSynced: totalRecordsSynced,
          recordsFailed: totalRecordsFailed,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      );

      return NextResponse.json({
        success: false,
        message: 'Sync failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        syncId
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to sync courses
async function syncCoursesWithOAuth(classroom: any, syncId: string) {
  let processed = 0;
  let synced = 0;
  let failed = 0;

  try {
    let pageToken: string | undefined = undefined;
    const allCourses: any[] = [];

    do {
      const response = await classroom.courses.list({
        pageSize: 100,
        pageToken,
      });

      const courses = response.data.courses || [];
      allCourses.push(...courses);
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    console.log(`Found ${allCourses.length} courses from Google Classroom`);

    for (const course of allCourses) {
      processed++;
      try {
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
            enrollmentCode: course.enrollmentCode,
            courseState: course.courseState,
            updateTime: course.updateTime ? new Date(course.updateTime) : new Date(),
            createdTime: course.creationTime ? new Date(course.creationTime) : new Date()
          },
          { upsert: true, new: true }
        );
        synced++;
      } catch (error) {
        console.error(`Error syncing course ${course.id}:`, error);
        failed++;
      }
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }

  return { processed, synced, failed };
}

// Helper function to sync users and rosters
async function syncUsersAndRostersWithOAuth(classroom: any, adminDirectory: any, syncId: string) {
  let processed = 0;
  let synced = 0;
  let failed = 0;

  try {
    // Get all courses from MongoDB
    const courses = await CourseModel.find({}, 'courseId');
    
    for (const course of courses) {
      try {
        // Get students for this course
        let pageToken: string | undefined = undefined;
        const allStudents: any[] = [];

        do {
          const studentsResponse = await classroom.courses.students.list({
            courseId: course.courseId,
            pageSize: 100,
            pageToken
          });

          const students = studentsResponse.data.students || [];
          allStudents.push(...students);
          pageToken = studentsResponse.data.nextPageToken || undefined;
        } while (pageToken);

        for (const student of allStudents) {
          processed++;
          try {
            // Fetch custom attributes from Admin Directory API using OAuth
            let customAttributes: any = {};
            try {
              const userResponse = await adminDirectory.users.get({
                userKey: student.profile.emailAddress,
                projection: 'full'
              });
              
              const customSchemas = userResponse.data.customSchemas || {};
              const studentProfile = customSchemas['StudentProfile'] || {};
              
              // StudentProfile fields: Gender, District, Grade, SchoolName, Age
              customAttributes = {
                gender: studentProfile.Gender || studentProfile.gender,
                district: studentProfile.District || studentProfile.district,
                grade: studentProfile.Grade || studentProfile.grade,
                schoolName: studentProfile.SchoolName || studentProfile.schoolName || studentProfile.schoolname,
                age: studentProfile.Age || studentProfile.age,
                customSchemas: customSchemas
              };
              
              console.log(`✓ Fetched StudentProfile for ${student.profile.emailAddress}:`, customAttributes);
            } catch (adminError) {
              console.warn(`⚠️ Could not fetch custom attributes for ${student.profile.emailAddress}:`, adminError);
            }

            // Create or update user
            await UserModel.findOneAndUpdate(
              { email: student.profile.emailAddress },
              {
                email: student.profile.emailAddress,
                externalId: student.userId,
                givenName: student.profile.name?.givenName,
                familyName: student.profile.name?.familyName,
                fullName: student.profile.name?.fullName,
                photoUrl: student.profile.photoUrl,
                role: 'student',
                ...customAttributes
              },
              { upsert: true, new: true }
            );

            // Create roster membership
            await RosterMembershipModel.findOneAndUpdate(
              { courseId: course.courseId, userEmail: student.profile.emailAddress, role: 'student' },
              {
                courseId: course.courseId,
                userEmail: student.profile.emailAddress,
                role: 'student'
              },
              { upsert: true, new: true }
            );

            synced++;
          } catch (error) {
            console.error(`Error syncing student ${student.profile.emailAddress}:`, error);
            failed++;
          }
        }

        // Get teachers for this course
        pageToken = undefined;
        const allTeachers: any[] = [];

        do {
          const teachersResponse = await classroom.courses.teachers.list({
            courseId: course.courseId,
            pageSize: 100,
            pageToken
          });

          const teachers = teachersResponse.data.teachers || [];
          allTeachers.push(...teachers);
          pageToken = teachersResponse.data.nextPageToken || undefined;
        } while (pageToken);

        for (const teacher of allTeachers) {
          processed++;
          try {
            // Fetch custom attributes from Admin Directory API using OAuth
            let customAttributes: any = {};
            try {
              const userResponse = await adminDirectory.users.get({
                userKey: teacher.profile.emailAddress,
                projection: 'full'
              });
              
              const customSchemas = userResponse.data.customSchemas || {};
              const teacherProfile = customSchemas['TeacherProfile'] || {};
              
              // TeacherProfile fields: SchoolName, District, Gender
              customAttributes = {
                schoolName: teacherProfile.SchoolName || teacherProfile.schoolName || teacherProfile.schoolname,
                district: teacherProfile.District || teacherProfile.district,
                gender: teacherProfile.Gender || teacherProfile.gender,
                customSchemas: customSchemas
              };
              
              console.log(`✓ Fetched TeacherProfile for ${teacher.profile.emailAddress}:`, customAttributes);
            } catch (adminError) {
              console.warn(`⚠️ Could not fetch custom attributes for ${teacher.profile.emailAddress}:`, adminError);
            }

            // Create or update user
            await UserModel.findOneAndUpdate(
              { email: teacher.profile.emailAddress },
              {
                email: teacher.profile.emailAddress,
                externalId: teacher.userId,
                givenName: teacher.profile.name?.givenName,
                familyName: teacher.profile.name?.familyName,
                fullName: teacher.profile.name?.fullName,
                photoUrl: teacher.profile.photoUrl,
                role: 'teacher',
                ...customAttributes
              },
              { upsert: true, new: true }
            );

            // Create roster membership
            await RosterMembershipModel.findOneAndUpdate(
              { courseId: course.courseId, userEmail: teacher.profile.emailAddress, role: 'teacher' },
              {
                courseId: course.courseId,
                userEmail: teacher.profile.emailAddress,
                role: 'teacher'
              },
              { upsert: true, new: true }
            );

            synced++;
          } catch (error) {
            console.error(`Error syncing teacher ${teacher.profile.emailAddress}:`, error);
            failed++;
          }
        }
      } catch (error) {
        console.error(`Error syncing roster for course ${course.courseId}:`, error);
        failed++;
      }
    }
  } catch (error) {
    console.error('Error syncing users and rosters:', error);
    throw error;
  }

  return { processed, synced, failed };
}

// Helper function to sync coursework and submissions
async function syncCourseworkAndSubmissionsWithOAuth(classroom: any, syncId: string) {
  let processed = 0;
  let synced = 0;
  let failed = 0;

  try {
    // Get all courses from MongoDB
    const courses = await CourseModel.find({}, 'courseId');
    
    for (const course of courses) {
      try {
        // Get coursework for this course
        let pageToken: string | undefined = undefined;
        const allCoursework: any[] = [];

        do {
          const courseworkResponse = await classroom.courses.courseWork.list({
            courseId: course.courseId,
            pageSize: 100,
            pageToken
          });

          const coursework = courseworkResponse.data.courseWork || [];
          allCoursework.push(...coursework);
          pageToken = courseworkResponse.data.nextPageToken || undefined;
        } while (pageToken);

        for (const work of allCoursework) {
          processed++;
          try {
            // Sync coursework
            const dueDate = work.dueDate 
              ? new Date(work.dueDate.year, work.dueDate.month - 1, work.dueDate.day)
              : null;

            await CourseworkModel.findOneAndUpdate(
              { courseWorkId: work.id },
              {
                courseId: course.courseId,
                courseWorkId: work.id,
                title: work.title,
                description: work.description,
                dueDate,
                state: work.state,
                maxPoints: work.maxPoints,
                updateTime: work.updateTime ? new Date(work.updateTime) : new Date(),
                creationTime: work.creationTime ? new Date(work.creationTime) : new Date(),
                materials: work.materials || [] // Store materials including forms
              },
              { upsert: true, new: true }
            );

            // Get submissions for this coursework
            let submissionPageToken: string | undefined = undefined;
            const allSubmissions: any[] = [];

            do {
              const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
                courseId: course.courseId,
                courseWorkId: work.id,
                pageSize: 100,
                pageToken: submissionPageToken
              });

              const submissions = submissionsResponse.data.studentSubmissions || [];
              allSubmissions.push(...submissions);
              submissionPageToken = submissionsResponse.data.nextPageToken || undefined;
            } while (submissionPageToken);

            for (const submission of allSubmissions) {
              processed++;
              try {
                await SubmissionModel.findOneAndUpdate(
                  { submissionId: submission.id },
                  {
                    courseId: course.courseId,
                    courseWorkId: work.id,
                    submissionId: submission.id,
                    userEmail: submission.userId, // This is actually the user ID, will need to map
                    state: submission.state,
                    late: submission.late,
                    uploadedTime: submission.creationTime ? new Date(submission.creationTime) : null,
                    updateTime: submission.updateTime ? new Date(submission.updateTime) : new Date(),
                    assignedGrade: submission.assignedGrade
                  },
                  { upsert: true, new: true }
                );
                synced++;
              } catch (error) {
                console.error(`Error syncing submission ${submission.id}:`, error);
                failed++;
              }
            }

            synced++;
          } catch (error) {
            console.error(`Error syncing coursework ${work.id}:`, error);
            failed++;
          }
        }
      } catch (error) {
        console.error(`Error syncing coursework for course ${course.courseId}:`, error);
        failed++;
      }
    }
  } catch (error) {
    console.error('Error syncing coursework and submissions:', error);
    throw error;
  }

  return { processed, synced, failed };
}

// Helper function to calculate analytics
async function calculateAnalytics(syncId: string) {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);

    // Calculate enrollment metrics
    const totalStudents = await UserModel.countDocuments({ role: 'student' });
    const activeStudents = await RosterMembershipModel.countDocuments({ role: 'student' });
    
    await AnalyticsModel.findOneAndUpdate(
      { metricType: 'enrollment', period: currentMonth, district: { $exists: false } },
      {
        metricType: 'enrollment',
        metricValue: totalStudents,
        metricUnit: 'count',
        timeframe: 'monthly',
        period: currentMonth,
        metadata: {
          totalStudents,
          activeStudents
        },
        calculatedAt: currentDate
      },
      { upsert: true, new: true }
    );

    // Calculate completion metrics
    const totalSubmissions = await SubmissionModel.countDocuments();
    const completedSubmissions = await SubmissionModel.countDocuments({ state: 'TURNED_IN' });
    const completionRate = totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0;

    await AnalyticsModel.findOneAndUpdate(
      { metricType: 'completion', period: currentMonth, district: { $exists: false } },
      {
        metricType: 'completion',
        metricValue: completionRate,
        metricUnit: 'percentage',
        timeframe: 'monthly',
        period: currentMonth,
        metadata: {
          completionRate
        },
        calculatedAt: currentDate
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error calculating analytics:', error);
    throw error;
  }
}

// Helper function to update school information
async function updateSchoolInformation(syncId: string) {
  try {
    // Get unique districts from users
    const districts = await UserModel.distinct('district', { district: { $exists: true, $ne: null } });
    
    for (const district of districts) {
      const studentCount = await UserModel.countDocuments({ role: 'student', district });
      const teacherCount = await UserModel.countDocuments({ role: 'teacher', district });
      const activeCourses = await CourseModel.countDocuments({ courseState: 'ACTIVE' });

      await SchoolModel.findOneAndUpdate(
        { district },
        {
          schoolId: `school_${district.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${district} School`,
          district,
          state: 'Bhutan',
          enrollmentCount: studentCount,
          teacherCount,
          activeCourses,
          lastSyncTime: new Date()
        },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('Error updating school information:', error);
    throw error;
  }
}
