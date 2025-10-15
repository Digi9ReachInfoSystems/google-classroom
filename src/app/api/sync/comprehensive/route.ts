import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { getClassroom } from '@/lib/google';
import { CourseModel } from '@/models/Course';
import { UserModel } from '@/models/User';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { CourseworkModel } from '@/models/Coursework';
import { SubmissionModel } from '@/models/Submission';
import { SyncLogModel } from '@/models/SyncLog';
import { AnalyticsModel } from '@/models/Analytics';
import { SchoolModel } from '@/models/School';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || (payload.role !== 'district-admin' && payload.role !== 'super-admin')) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const { syncType = 'full' } = await req.json();
    const syncId = uuidv4();
    const startTime = new Date();

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

    console.log(`Starting ${syncType} sync for ${payload.role}:`, payload.email);

    // Connect to database
    await connectToDatabase();

    // Get Google Classroom service
    const classroom = getClassroom();

    let totalRecordsProcessed = 0;
    let totalRecordsSynced = 0;
    let totalRecordsFailed = 0;

    // Initialize result variables
    let coursesResult = { processed: 0, synced: 0, failed: 0 };
    let usersResult = { processed: 0, synced: 0, failed: 0 };
    let courseworkResult = { processed: 0, synced: 0, failed: 0 };

    try {
      // Update sync status
      await SyncLogModel.findOneAndUpdate(
        { syncId },
        { status: 'in_progress' }
      );

      // Execute sync based on type
      if (syncType === 'courses' || syncType === 'full') {
        // 1. Sync Courses
        console.log('Syncing courses...');
        coursesResult = await syncCourses(classroom, syncId);
        totalRecordsProcessed += coursesResult.processed;
        totalRecordsSynced += coursesResult.synced;
        totalRecordsFailed += coursesResult.failed;
      }

      if (syncType === 'users' || syncType === 'full') {
        // 2. Sync Users and Roster Memberships
        console.log('Syncing users and roster memberships...');
        usersResult = await syncUsersAndRosters(classroom, syncId);
        totalRecordsProcessed += usersResult.processed;
        totalRecordsSynced += usersResult.synced;
        totalRecordsFailed += usersResult.failed;
      }

      if (syncType === 'submissions' || syncType === 'full') {
        // 3. Sync Coursework and Submissions
        console.log('Syncing coursework and submissions...');
        courseworkResult = await syncCourseworkAndSubmissions(classroom, syncId);
        totalRecordsProcessed += courseworkResult.processed;
        totalRecordsSynced += courseworkResult.synced;
        totalRecordsFailed += courseworkResult.failed;
      }

      if (syncType === 'full') {
        // 4. Calculate Analytics
        console.log('Calculating analytics...');
        await calculateAnalytics(syncId);

        // 5. Update Schools
        console.log('Updating school information...');
        await updateSchoolInformation(syncId);
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
            coursesCount: coursesResult.synced,
            usersCount: usersResult.synced,
            submissionsCount: courseworkResult.synced,
            lastSyncTime: endTime
          }
        }
      );

      console.log(`Sync completed successfully. Processed: ${totalRecordsProcessed}, Synced: ${totalRecordsSynced}, Failed: ${totalRecordsFailed}`);

      return NextResponse.json({
        success: true,
        message: 'Sync completed successfully',
        syncId,
        duration,
        recordsProcessed: totalRecordsProcessed,
        recordsSynced: totalRecordsSynced,
        recordsFailed: totalRecordsFailed
      });

    } catch (error) {
      console.error('Sync failed:', error);
      
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

async function syncCourses(classroom: any, syncId: string) {
  let processed = 0;
  let synced = 0;
  let failed = 0;

  try {
    const coursesResponse = await classroom.courses.list({ pageSize: 100 });
    const courses = coursesResponse.data.courses || [];

    for (const course of courses) {
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

async function syncUsersAndRosters(classroom: any, syncId: string) {
  let processed = 0;
  let synced = 0;
  let failed = 0;

  try {
    // Get all courses
    const courses = await CourseModel.find({}, 'courseId');
    
    for (const course of courses) {
      try {
        // Get roster for this course
        const rosterResponse = await classroom.courses.students.list({
          courseId: course.courseId,
          pageSize: 100
        });

        const students = rosterResponse.data.students || [];
        
        for (const student of students) {
          processed++;
          try {
            // Create or update user
            await UserModel.findOneAndUpdate(
              { email: student.profile.emailAddress },
              {
                email: student.profile.emailAddress,
                externalId: student.userId,
                givenName: student.profile.name.givenName,
                familyName: student.profile.name.familyName,
                fullName: student.profile.name.fullName,
                photoUrl: student.profile.photoUrl,
                role: 'student'
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
        const teachersResponse = await classroom.courses.teachers.list({
          courseId: course.courseId,
          pageSize: 100
        });

        const teachers = teachersResponse.data.teachers || [];
        
        for (const teacher of teachers) {
          processed++;
          try {
            // Create or update user
            await UserModel.findOneAndUpdate(
              { email: teacher.profile.emailAddress },
              {
                email: teacher.profile.emailAddress,
                externalId: teacher.userId,
                givenName: teacher.profile.name.givenName,
                familyName: teacher.profile.name.familyName,
                fullName: teacher.profile.name.fullName,
                photoUrl: teacher.profile.photoUrl,
                role: 'teacher'
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

async function syncCourseworkAndSubmissions(classroom: any, syncId: string) {
  let processed = 0;
  let synced = 0;
  let failed = 0;

  try {
    // Get all courses
    const courses = await CourseModel.find({}, 'courseId');
    
    for (const course of courses) {
      try {
        // Get coursework for this course
        const courseworkResponse = await classroom.courses.courseWork.list({
          courseId: course.courseId,
          pageSize: 100
        });

        const coursework = courseworkResponse.data.courseWork || [];
        
        for (const work of coursework) {
          processed++;
          try {
            // Sync coursework
            await CourseworkModel.findOneAndUpdate(
              { courseWorkId: work.id },
              {
                courseId: course.courseId,
                courseWorkId: work.id,
                title: work.title,
                description: work.description,
                dueDate: work.dueDate ? new Date(work.dueDate.year, work.dueDate.month - 1, work.dueDate.day) : null,
                state: work.state,
                maxPoints: work.maxPoints,
                updateTime: work.updateTime ? new Date(work.updateTime) : new Date(),
                creationTime: work.creationTime ? new Date(work.creationTime) : new Date(),
                materials: work.materials || [] // Store materials including forms
              },
              { upsert: true, new: true }
            );

            // Get submissions for this coursework
            const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
              courseId: course.courseId,
              courseWorkId: work.id,
              pageSize: 100
            });

            const submissions = submissionsResponse.data.studentSubmissions || [];
            
            for (const submission of submissions) {
              processed++;
              try {
                await SubmissionModel.findOneAndUpdate(
                  { submissionId: submission.id },
                  {
                    courseId: course.courseId,
                    courseWorkId: work.id,
                    submissionId: submission.id,
                    userEmail: submission.userId,
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

async function calculateAnalytics(syncId: string) {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format

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

    console.log('Analytics calculated successfully');
  } catch (error) {
    console.error('Error calculating analytics:', error);
    throw error;
  }
}

async function updateSchoolInformation(syncId: string) {
  try {
    // Get unique districts from users
    const districts = await UserModel.distinct('district', { district: { $exists: true, $ne: null } });
    
    for (const district of districts) {
      // Count students and teachers in this district
      const studentCount = await UserModel.countDocuments({ role: 'student', district });
      const teacherCount = await UserModel.countDocuments({ role: 'teacher', district });
      
      // Count active courses in this district
      const activeCourses = await CourseModel.countDocuments({ courseState: 'ACTIVE' });

      // Update or create school record
      await SchoolModel.findOneAndUpdate(
        { district },
        {
          schoolId: `school_${district.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${district} School`,
          district,
          state: 'Bhutan', // Default state
          enrollmentCount: studentCount,
          teacherCount,
          activeCourses,
          lastSyncTime: new Date()
        },
        { upsert: true, new: true }
      );
    }

    console.log('School information updated successfully');
  } catch (error) {
    console.error('Error updating school information:', error);
    throw error;
  }
}
