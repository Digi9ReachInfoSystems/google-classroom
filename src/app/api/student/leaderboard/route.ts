import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';
import { connectToDatabase } from '@/lib/mongodb';
import { BadgeModel } from '@/models/Badge';
import { CertificateModel } from '@/models/Certificate';
import { UserModel } from '@/models/User';
import { StageCompletionModel } from '@/models/StageCompletion';
import { RosterMembershipModel } from '@/models/RosterMembership';

interface StudentData {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  completionPercentage: number;
  totalAssignments: number;
  completedAssignments: number;
  averageGrade?: number;
  badges: number;
  certificates: number;
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

    // Get course ID from query parameters
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    try {
      console.log('Fetching leaderboard data for course:', courseId);

      // Connect to database
      await connectToDatabase();

      // Try database approach first
      const rosterMembers = await RosterMembershipModel.find({
        courseId: courseId,
        role: 'student'
      }).select('userEmail');

      const studentEmails = rosterMembers.map(member => member.userEmail);
      console.log(`Found ${studentEmails.length} students in course from database`);

      let studentData: StudentData[] = [];

      if (studentEmails.length > 0) {
        // Database approach - get student details from UserModel
        const students = await UserModel.find({
          email: { $in: studentEmails },
          role: 'student'
        }).select('email givenName familyName fullName');

        console.log(`Found ${students.length} student profiles in database`);

        for (const student of students) {
          // Get stage completions for this student
          const stageCompletions = await StageCompletionModel.find({
            courseId,
            studentEmail: student.email
          });

          // Calculate completion based on stage completions
          const completedStages = stageCompletions.length;
          
          // Define the main stages that count for completion
          const mainStages = ['pre-survey', 'ideas', 'post-survey', 'course'];
          const completedMainStages = stageCompletions.filter(stage => 
            mainStages.includes(stage.stageId)
          ).length;
          
          const completionPercentage = Math.min(100, Math.round((completedMainStages / mainStages.length) * 100));

          // Get badge count for this student
          const badgeCount = await BadgeModel.countDocuments({
            courseId,
            studentEmail: student.email
          });

          // Get certificate count for this student
          const certificateCount = await CertificateModel.countDocuments({
            courseId,
            studentEmail: student.email
          });

          const studentName = student.fullName || 
                             (student.givenName && student.familyName ? 
                               `${student.givenName} ${student.familyName}` : null) ||
                             student.email || 'Unknown Student';

          studentData.push({
            id: student.email,
            name: studentName,
            email: student.email,
            profilePicture: undefined,
            completionPercentage,
            totalAssignments: mainStages.length,
            completedAssignments: completedMainStages,
            averageGrade: undefined,
            badges: badgeCount,
            certificates: certificateCount
          });
        }
      } else {
        // Fallback to Google Classroom API approach
        console.log('No database roster found, falling back to Google Classroom API');
        
        // Check if we have OAuth tokens for fallback
        if (!payload.accessToken) {
          return NextResponse.json({ 
            success: false, 
            error: 'No OAuth tokens found. Please log in again.' 
          }, { status: 401 });
        }

        // Initialize Google Classroom API with user's OAuth credentials
        const oauth2Client = createUserOAuthClient({
          access_token: payload.accessToken,
          refresh_token: payload.refreshToken
        });
        
        const classroom = getClassroomWithUserAuth(oauth2Client);

        // Fetch students from Google Classroom
        const studentsResponse = await classroom.courses.students.list({
          courseId: courseId,
          pageSize: 100
        });

        const students = studentsResponse.data.students || [];
        console.log(`Found ${students.length} students in course from Google Classroom`);

        for (const student of students) {
          if (!student.profile?.emailAddress) continue;

          // Get stage completions for this student
          const stageCompletions = await StageCompletionModel.find({
            courseId,
            studentEmail: student.profile.emailAddress
          });

          // Calculate completion based on stage completions
          const completedStages = stageCompletions.length;
          
          // Define the main stages that count for completion
          const mainStages = ['pre-survey', 'ideas', 'post-survey', 'course'];
          const completedMainStages = stageCompletions.filter(stage => 
            mainStages.includes(stage.stageId)
          ).length;
          
          const completionPercentage = Math.min(100, Math.round((completedMainStages / mainStages.length) * 100));

          // Get badge count for this student
          const badgeCount = await BadgeModel.countDocuments({
            courseId,
            studentEmail: student.profile.emailAddress
          });

          // Get certificate count for this student
          const certificateCount = await CertificateModel.countDocuments({
            courseId,
            studentEmail: student.profile.emailAddress
          });

          const studentName = student.profile.name?.fullName || 
                             `${student.profile.name?.givenName || ''} ${student.profile.name?.familyName || ''}`.trim() ||
                             student.profile.emailAddress || 'Unknown Student';

          studentData.push({
            id: student.profile.id || student.profile.emailAddress,
            name: studentName,
            email: student.profile.emailAddress,
            profilePicture: student.profile.photoUrl || undefined,
            completionPercentage,
            totalAssignments: mainStages.length,
            completedAssignments: completedMainStages,
            averageGrade: undefined,
            badges: badgeCount,
            certificates: certificateCount
          });
        }
      }

      // If no students found, at least show the current user
      if (studentData.length === 0) {
        console.log('No students found, showing current user only');
        
        // Get current user's data
        const currentUser = await UserModel.findOne({ email: payload.email });
        if (currentUser) {
          const stageCompletions = await StageCompletionModel.find({
            courseId,
            studentEmail: currentUser.email
          });

          const completedStages = stageCompletions.length;
          const totalStages = 4;
          const completionPercentage = Math.round((completedStages / totalStages) * 100);

          const badgeCount = await BadgeModel.countDocuments({
            courseId,
            studentEmail: currentUser.email
          });

          const certificateCount = await CertificateModel.countDocuments({
            courseId,
            studentEmail: currentUser.email
          });

          const studentName = currentUser.fullName || 
                             (currentUser.givenName && currentUser.familyName ? 
                               `${currentUser.givenName} ${currentUser.familyName}` : null) ||
                             currentUser.email || 'Unknown Student';

          studentData.push({
            id: currentUser.email,
            name: studentName,
            email: currentUser.email,
            profilePicture: undefined,
            completionPercentage,
            totalAssignments: totalStages,
            completedAssignments: completedStages,
            averageGrade: undefined,
            badges: badgeCount,
            certificates: certificateCount
          });
        }
      }

      // Sort students by completion percentage (descending)
      studentData.sort((a, b) => {
        if (b.completionPercentage !== a.completionPercentage) {
          return b.completionPercentage - a.completionPercentage;
        }
        // If completion is the same, sort by average grade
        if (a.averageGrade && b.averageGrade) {
          return b.averageGrade - a.averageGrade;
        }
        // Finally, sort by name
        return a.name.localeCompare(b.name);
      });

      // Add rank to each student
      const rankedStudents = studentData.map((student, index) => ({
        ...student,
        rank: index + 1,
        isCurrentUser: student.email.toLowerCase() === payload.email.toLowerCase()
      }));

      console.log(`Processed ${rankedStudents.length} students for leaderboard`);
      console.log('Returning students:', rankedStudents.map(s => ({ name: s.name, email: s.email, isCurrentUser: s.isCurrentUser })));

      return NextResponse.json({
        success: true,
        students: rankedStudents,
        totalStudents: rankedStudents.length,
        courseId: courseId
      });

    } catch (error: any) {
      console.error('Error fetching leaderboard data:', error);
      
      // If it's a Google Classroom permission error, provide helpful message
      if (error.code === 403) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Students cannot view other students in this course.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
