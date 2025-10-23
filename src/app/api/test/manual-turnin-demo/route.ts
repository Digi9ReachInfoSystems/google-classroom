import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { google } from 'googleapis';
import { ensureValidToken } from '@/lib/token-refresh';

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

    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No OAuth credentials found' 
      }, { status: 401 });
    }

    // Ensure we have valid OAuth tokens
    const tokenResult = await ensureValidToken(payload.accessToken, payload.refreshToken);
    if (!tokenResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: tokenResult.error || 'OAuth token validation failed',
        needsReauth: tokenResult.needsReauth
      }, { status: 401 });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: tokenResult.accessToken,
      refresh_token: tokenResult.refreshToken
    });

    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

    // Get student's courses
    const coursesResponse = await classroom.courses.list({ pageSize: 10 });
    const courses = coursesResponse.data.courses || [];

    // For each course, get coursework and submissions
    const courseData = [];
    for (const course of courses) {
      try {
        // Get coursework for this course
        const courseworkResponse = await classroom.courses.courseWork.list({
          courseId: course.id,
          pageSize: 5
        });
        
        const coursework = courseworkResponse.data.courseWork || [];
        
        // For each coursework, get student submissions
        const courseworkData = [];
        for (const work of coursework) {
          try {
            const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
              courseId: course.id,
              courseWorkId: work.id,
              userId: payload.email,
              pageSize: 5
            });
            
            const submissions = submissionsResponse.data.studentSubmissions || [];
            
            courseworkData.push({
              id: work.id,
              title: work.title,
              description: work.description,
              state: work.state,
              dueDate: work.dueDate,
              submissions: submissions.map(sub => ({
                id: sub.id,
                state: sub.state,
                userId: sub.userId,
                creationTime: sub.creationTime,
                updateTime: sub.updateTime,
                canTurnIn: sub.state === 'CREATED' || sub.state === 'NEW',
                isTurnedIn: sub.state === 'TURNED_IN' || sub.state === 'RETURNED'
              }))
            });
          } catch (error) {
            console.log(`Error fetching submissions for coursework ${work.id}:`, error.message);
            courseworkData.push({
              id: work.id,
              title: work.title,
              error: 'Failed to fetch submissions'
            });
          }
        }
        
        courseData.push({
          id: course.id,
          name: course.name,
          section: course.section,
          courseState: course.courseState,
          coursework: courseworkData
        });
      } catch (error) {
        console.log(`Error fetching coursework for course ${course.id}:`, error.message);
        courseData.push({
          id: course.id,
          name: course.name,
          error: 'Failed to fetch coursework'
        });
      }
    }

    return NextResponse.json({
      success: true,
      studentEmail: payload.email,
      courses: courseData,
      instructions: {
        title: 'Manual TurnIn API Demo',
        description: 'This endpoint shows all your courses, coursework, and submissions that can be turned in manually.',
        usage: {
          getSubmissionDetails: 'GET /api/student/manual-turnin?courseId={courseId}&courseWorkId={courseWorkId}&submissionId={submissionId}',
          turnInSubmission: 'POST /api/student/manual-turnin with {courseId, courseWorkId, submissionId} in body'
        },
        examples: {
          getSubmission: {
            method: 'GET',
            url: '/api/student/manual-turnin?courseId=123456789&courseWorkId=987654321&submissionId=submission123',
            description: 'Get details about a specific submission'
          },
          turnInSubmission: {
            method: 'POST',
            url: '/api/student/manual-turnin',
            body: {
              courseId: '123456789',
              courseWorkId: '987654321',
              submissionId: 'submission123'
            },
            description: 'Turn in a specific submission'
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Manual turnIn demo error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch course data',
      details: error.message
    }, { status: 500 });
  }
}
