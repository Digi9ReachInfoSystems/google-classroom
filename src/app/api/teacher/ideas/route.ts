import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
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

    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No OAuth credentials found' 
      }, { status: 401 });
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

    // Fetch coursework to find "Idea Submission" assignment
    const courseworkResponse = await classroom.courses.courseWork.list({
      courseId: courseId,
      pageSize: 100
    });

    const allCoursework = courseworkResponse.data.courseWork || [];
    const ideaCoursework = allCoursework.find((cw: any) => 
      cw.title && cw.title.toLowerCase().includes('idea')
    );

    if (!ideaCoursework) {
      return NextResponse.json({
        success: true,
        totalStudents: 0,
        totalIdeasSubmitted: 0,
        ideas: []
      });
    }

    // Get the idea submission form URL
    let ideaFormUrl = '';
    if (ideaCoursework.materials) {
      for (const material of ideaCoursework.materials) {
        if (material.form && material.form.formUrl) {
          ideaFormUrl = material.form.formUrl;
          break;
        }
      }
    }

    // Fetch all students in the course
    const studentsResponse = await classroom.courses.students.list({
      courseId: courseId,
      pageSize: 100
    });

    const students = studentsResponse.data.students || [];

    // Fetch submissions for the idea assignment
    const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
      courseId: courseId,
      courseWorkId: ideaCoursework.id,
      pageSize: 100
    });

    const submissions = submissionsResponse.data.studentSubmissions || [];

    // Build ideas data
    const ideas = students.map((student: any) => {
      const studentEmail = student.profile?.emailAddress || '';
      const studentName = student.profile?.name?.fullName || 'Unknown';
      
      const submission = submissions.find((sub: any) => sub.userId === studentEmail);
      const isSubmitted = submission?.state === 'TURNED_IN' || submission?.state === 'RETURNED';
      
      return {
        studentName,
        studentEmail,
        ideaTitle: '-', // Will be populated from form responses later
        category: '-', // Will be populated from form responses later
        dateSubmitted: isSubmitted && submission.updateTime 
          ? new Date(submission.updateTime).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          : '-',
        status: isSubmitted ? 'completed' : 'pending',
        fileUrl: ideaFormUrl || undefined // Show form link for all students if available
      };
    });

    const totalIdeasSubmitted = ideas.filter(i => i.status === 'completed').length;

    return NextResponse.json({
      success: true,
      totalStudents: students.length,
      totalIdeasSubmitted,
      submittedPercentage: students.length > 0 ? Math.round((totalIdeasSubmitted / students.length) * 100) : 0,
      ideas
    });

  } catch (error) {
    console.error('Teacher ideas API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

