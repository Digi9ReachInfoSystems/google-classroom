import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { SubmissionModel } from '@/models/Submission';
import { RosterMembershipModel } from '@/models/RosterMembership';
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

    // Fetch user's district from database
    let user = await UserModel.findOne({ email: payload.email }).select('district');
    
    // If user doesn't exist, create them
    if (!user) {
      user = await UserModel.create({
        email: payload.email,
        role: 'district-admin',
        district: null // Will need to be set later
      });
      console.log('Created district admin user:', payload.email);
    }
    
    const userDistrict = user.district || null;
    console.log('District admin district:', userDistrict);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const schoolName = searchParams.get('schoolName');

    let progressData;

    if (courseId) {
      // Get progress for specific course
      progressData = await getCourseProgress(courseId, schoolName);
    } else {
      // Get progress for all courses in district
      progressData = await getDistrictProgress(userDistrict, schoolName);
    }

    return NextResponse.json({
      success: true,
      data: progressData,
      courseId: courseId || 'all'
    });

  } catch (error) {
    console.error('District admin class progress API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCourseProgress(courseId: string, schoolName?: string | null) {
  // Get students in this course
  const studentEmails = await RosterMembershipModel.distinct('userEmail', {
    courseId,
    role: 'student'
  });

  // Apply school filter if provided
  let filteredStudentEmails = studentEmails;
  if (schoolName) {
    const schoolStudents = await UserModel.distinct('email', {
      email: { $in: studentEmails },
      schoolName: schoolName
    });
    filteredStudentEmails = schoolStudents;
  }

  console.log(`Course ${courseId}: Found ${filteredStudentEmails.length} students${schoolName ? ` in ${schoolName}` : ''}`);

  if (filteredStudentEmails.length === 0) {
    // Return default data if no students
    return [
      { stage: "Pre Survey", y2025: 0 },
      { stage: "Course completed", y2025: 0 },
      { stage: "idea submission", y2025: 0 },
      { stage: "Post Survey", y2025: 0 },
      { stage: "certificate", y2025: 0 }
    ];
  }

  // Get all coursework for this course
  const coursework = await CourseworkModel.find({ courseId });
  console.log(`Course ${courseId}: Found ${coursework.length} coursework items`);

  if (coursework.length === 0) {
    // Return default data if no coursework
    return [
      { stage: "Pre Survey", y2025: 0 },
      { stage: "Course completed", y2025: 0 },
      { stage: "idea submission", y2025: 0 },
      { stage: "Post Survey", y2025: 0 },
      { stage: "certificate", y2025: 0 }
    ];
  }

  // Get submissions for filtered students in this course
  const submissions = await SubmissionModel.find({
    courseId,
    userEmail: { $in: filteredStudentEmails }
  });

  console.log(`Course ${courseId}: Found ${submissions.length} submissions`);

  // Calculate progress per student
  const studentProgressData = await Promise.all(
    filteredStudentEmails.map(async (email) => {
      const studentSubmissions = submissions.filter(s => s.userEmail === email);
      const completedSubmissions = studentSubmissions.filter(s => s.state === 'TURNED_IN').length;
      const totalCoursework = coursework.length;
      
      const progress = totalCoursework > 0 
        ? Math.round((completedSubmissions / totalCoursework) * 100)
        : 0;

      return progress;
    })
  );

  // Calculate completion rates for each stage
  const totalStudents = filteredStudentEmails.length;
  
  // Count students who completed pre-survey (progress > 0)
  const preSurveyCount = studentProgressData.filter(p => p > 0).length;
  
  // Count students who completed course (progress >= 80)
  const courseCompletedCount = studentProgressData.filter(p => p >= 80).length;
  
  // Count students who submitted ideas (progress >= 50)
  const ideaSubmissionCount = studentProgressData.filter(p => p >= 50).length;
  
  // Count students who completed post-survey (progress >= 90)
  const postSurveyCount = studentProgressData.filter(p => p >= 90).length;
  
  // Count students who earned certificate (progress === 100)
  const certificateCount = studentProgressData.filter(p => p === 100).length;

  console.log(`Course ${courseId}: Pre Survey: ${preSurveyCount}/${totalStudents}, Course: ${courseCompletedCount}/${totalStudents}, Ideas: ${ideaSubmissionCount}/${totalStudents}, Post: ${postSurveyCount}/${totalStudents}, Cert: ${certificateCount}/${totalStudents}`);

  // Create progress data for chart (5 stages - same as teacher)
  const progressData = [
    {
      stage: "Pre Survey",
      y2025: totalStudents > 0 ? Math.round((preSurveyCount / totalStudents) * 100) : 0
    },
    {
      stage: "Course completed",
      y2025: totalStudents > 0 ? Math.round((courseCompletedCount / totalStudents) * 100) : 0
    },
    {
      stage: "idea submission",
      y2025: totalStudents > 0 ? Math.round((ideaSubmissionCount / totalStudents) * 100) : 0
    },
    {
      stage: "Post Survey",
      y2025: totalStudents > 0 ? Math.round((postSurveyCount / totalStudents) * 100) : 0
    },
    {
      stage: "certificate",
      y2025: totalStudents > 0 ? Math.round((certificateCount / totalStudents) * 100) : 0
    }
  ];

  return progressData;
}

async function getDistrictProgress(district?: string, schoolName?: string | null) {
  // Get all students in district with optional school filter
  const query: any = { role: 'student' };
  if (district) query.district = district;
  if (schoolName) query.schoolName = schoolName;
  
  const districtStudentEmails = await UserModel.distinct('email', query);

  console.log(`District: Found ${districtStudentEmails.length} students${schoolName ? ` in ${schoolName}` : ''}`);

  if (districtStudentEmails.length === 0) {
    return [
      { stage: "Pre Survey", y2025: 0 },
      { stage: "Learning", y2025: 0 },
      { stage: "Ideas", y2025: 0 },
      { stage: "Post Survey", y2025: 0 }
    ];
  }

  // Get all coursework
  const totalCoursework = await CourseworkModel.countDocuments();
  console.log(`District: Found ${totalCoursework} total coursework items`);

  // Get all submissions for district students
  const submissions = await SubmissionModel.find({
    userEmail: { $in: districtStudentEmails }
  });

  console.log(`District: Found ${submissions.length} submissions`);

  if (submissions.length === 0 || totalCoursework === 0) {
    return [
      { stage: "Pre Survey", y2025: 0 },
      { stage: "Learning", y2025: 0 },
      { stage: "Ideas", y2025: 0 },
      { stage: "Post Survey", y2025: 0 }
    ];
  }

  // Calculate average progress across all students
  const studentProgressData = await Promise.all(
    districtStudentEmails.map(async (email) => {
      const studentSubmissions = submissions.filter(s => s.userEmail === email);
      const completedSubmissions = studentSubmissions.filter(s => s.state === 'TURNED_IN').length;
      
      const progress = totalCoursework > 0 
        ? Math.round((completedSubmissions / totalCoursework) * 100)
        : 0;

      return progress;
    })
  );

  // Calculate completion rates for each stage
  const totalStudents = districtStudentEmails.length;
  
  // Count students who completed pre-survey (progress > 0)
  const preSurveyCount = studentProgressData.filter(p => p > 0).length;
  
  // Count students who completed course (progress >= 80)
  const courseCompletedCount = studentProgressData.filter(p => p >= 80).length;
  
  // Count students who submitted ideas (progress >= 50)
  const ideaSubmissionCount = studentProgressData.filter(p => p >= 50).length;
  
  // Count students who completed post-survey (progress >= 90)
  const postSurveyCount = studentProgressData.filter(p => p >= 90).length;
  
  // Count students who earned certificate (progress === 100)
  const certificateCount = studentProgressData.filter(p => p === 100).length;

  console.log(`District: Pre Survey: ${preSurveyCount}/${totalStudents}, Course: ${courseCompletedCount}/${totalStudents}, Ideas: ${ideaSubmissionCount}/${totalStudents}, Post: ${postSurveyCount}/${totalStudents}, Cert: ${certificateCount}/${totalStudents}`);

  // Create progress data for chart (5 stages - same as teacher)
  const progressData = [
    {
      stage: "Pre Survey",
      y2025: totalStudents > 0 ? Math.round((preSurveyCount / totalStudents) * 100) : 0
    },
    {
      stage: "Course completed",
      y2025: totalStudents > 0 ? Math.round((courseCompletedCount / totalStudents) * 100) : 0
    },
    {
      stage: "idea submission",
      y2025: totalStudents > 0 ? Math.round((ideaSubmissionCount / totalStudents) * 100) : 0
    },
    {
      stage: "Post Survey",
      y2025: totalStudents > 0 ? Math.round((postSurveyCount / totalStudents) * 100) : 0
    },
    {
      stage: "certificate",
      y2025: totalStudents > 0 ? Math.round((certificateCount / totalStudents) * 100) : 0
    }
  ];

  return progressData;
}