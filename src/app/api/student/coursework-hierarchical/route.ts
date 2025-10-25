import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { StageCompletionModel } from '@/models/StageCompletion';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Only allow students to access this endpoint
    if (payload.role !== 'student') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check OAuth credentials
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false,
        message: 'No OAuth credentials found. Please log in again.' 
      }, { status: 401 });
    }

    await connectToDatabase();

    // Set up OAuth2 client
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_OAUTH_CLIENT_ID,
			process.env.GOOGLE_OAUTH_CLIENT_SECRET,
			process.env.GOOGLE_OAUTH_REDIRECT_URI
		);

    oauth2Client.setCredentials({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });

    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

    try {
      // Fetch coursework from Google Classroom API
      const courseworkResponse = await classroom.courses.courseWork.list({
        courseId: courseId,
        pageSize: 100,
        orderBy: 'updateTime desc'
      });

      const allCoursework = courseworkResponse.data.courseWork || [];

      // Get all material completions from MongoDB
      const materialCompletions = await StageCompletionModel.find({
        courseId: courseId,
        studentEmail: payload.email,
        stageId: { $regex: '^material-' }
      });

      const completedMaterialIds = new Set(
        materialCompletions.map(mc => mc.stageId.replace('material-', ''))
      );

      // Fetch submissions for each coursework individually
      const courseworkData = [];
      for (const work of allCoursework) {
        if (!work.id) continue;

        let submission = null;
        try {
          const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
            courseId: courseId,
            courseWorkId: work.id,
            userId: payload.email,
            pageSize: 10
          });

          const submissions = submissionsResponse.data.studentSubmissions || [];
          submission = submissions.find((sub: any) => sub.userId === payload.email);
        } catch (error) {
          console.warn(`Error fetching submission for coursework ${work.id}:`, error);
        }

        // Check if material is completed in MongoDB (for video-based assignments)
        const isCompletedLocally = completedMaterialIds.has(work.id);

        courseworkData.push({
          id: work.id,
          title: work.title,
          description: work.description,
          state: work.state,
          alternateLink: work.alternateLink,
          creationTime: work.creationTime,
          updateTime: work.updateTime,
          dueDate: work.dueDate,
          dueTime: work.dueTime,
          maxPoints: work.maxPoints,
          workType: work.workType,
          materials: work.materials || [],
          submissionModificationMode: work.submissionModificationMode,
          // Submission data - use local completion if no Google submission
          submission: submission ? {
            id: submission.id,
            state: submission.state,
            assignedGrade: submission.assignedGrade,
            draftGrade: submission.draftGrade,
            creationTime: submission.creationTime,
            updateTime: submission.updateTime,
            submitted: (submission as any).submitted,
            late: submission.late,
            alternateLink: submission.alternateLink
          } : (isCompletedLocally ? {
            id: work.id,
            state: 'TURNED_IN',
            assignedGrade: null,
            draftGrade: null,
            creationTime: null,
            updateTime: null,
            submitted: true,
            late: false,
            alternateLink: null
          } : null)
        });
      }

      // Filter out survey and idea assignments
      const learningModules = courseworkData.filter((item: any) => {
        const title = item.title?.toLowerCase() || '';
        return !title.includes('survey') && !title.includes('idea');
      });

      // Organize into hierarchical structure
      const hierarchicalData = organizeIntoHierarchy(learningModules);

      return NextResponse.json({
        success: true,
        hierarchicalData: hierarchicalData,
        total: learningModules.length
      });

    } catch (googleError: any) {
      console.error('Error fetching coursework:', googleError);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch coursework from Google Classroom',
        error: googleError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Coursework hierarchical API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// Function to organize coursework into hierarchical structure
function organizeIntoHierarchy(coursework: any[]) {
  // Flatten structure: Learning Modules → Assignments → Videos/Quizzes (skip Topics)
  const assignments = coursework.map(assignment => ({
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    workType: assignment.workType,
    materials: assignment.materials || [],
    submission: assignment.submission,
    maxPoints: assignment.maxPoints,
    dueDate: assignment.dueDate,
    type: 'assignment',
    children: organizeAssignmentContent(assignment.materials || [])
  }));

  // Convert to hierarchical structure
  const hierarchicalStructure = {
    learningModules: {
      id: 'learning-modules',
      title: 'Learning Modules',
      type: 'module',
      children: assignments
    }
  };

  return hierarchicalStructure;
}

// Function to organize assignment content (videos first, then quizzes at the end)
function organizeAssignmentContent(materials: any[]) {
  const videos: any[] = [];
  const quizzes: any[] = [];
  const resources: any[] = [];

  materials.forEach(material => {
    // Check for videos
    if (material.youtubeVideo || 
        (material.link && getYouTubeEmbedUrl(material.link.url)) ||
        material.driveFile?.driveFile?.videoMediaMetadata) {
      videos.push(material);
    }
    // Check for quizzes/forms
    else if (material.form || 
             (material.link && (material.link.url.includes('docs.google.com/forms') || material.link.url.includes('forms.gle')))) {
      quizzes.push(material);
    }
    // Everything else is a resource
    else {
      resources.push(material);
    }
  });

  // Return videos first, then resources, then quizzes at the end
  return {
    videos: videos,
    resources: resources,
    quizzes: quizzes
  };
}

// Helper function to detect YouTube URLs
function getYouTubeEmbedUrl(url: string) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
}
