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

    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    await connectToDatabase();

    // Set up OAuth2 client
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

    try {
      // Fetch coursework from Google Classroom API
      const courseworkResponse = await classroom.courses.courseWork.list({
        courseId: courseId,
        pageSize: 100,
        orderBy: 'updateTime desc'
      });

      const allCoursework = courseworkResponse.data.courseWork || [];

      // Filter out survey and idea assignments
      const learningModules = allCoursework.filter((item: any) => {
        const title = item.title?.toLowerCase() || '';
        return !title.includes('survey') && !title.includes('idea');
      });

      // Debug: Show all titles and how they would be categorized
      const debugData = learningModules.map(item => {
        const title = item.title || '';
        let topicName = 'General';
        
        // Pattern 1: "Topic X:" or "Module X - Topic Y:"
        const topicMatch = title.match(/(?:Module\s*\d+\s*-\s*)?(?:Topic\s*\d+[:\-]|Chapter\s*\d+[:\-]|Unit\s*\d+[:\-]|Lesson\s*\d+[:\-])/i);
        if (topicMatch) {
          topicName = topicMatch[0].replace(/[:\-]$/, '').trim();
        }
        // Pattern 2: Look for common topic indicators
        else if (title.match(/^(Introduction|Overview|Basics|Fundamentals|Advanced|Conclusion)/i)) {
          topicName = title.match(/^(Introduction|Overview|Basics|Fundamentals|Advanced|Conclusion)/i)?.[0] || 'Unknown Topic';
        }
        // Pattern 3: Group by first few words if they seem like topics
        else {
          const words = title.split(' ');
          if (words.length >= 2) {
            const firstTwoWords = words.slice(0, 2).join(' ');
            if (firstTwoWords.length <= 20 && !firstTwoWords.includes('Assignment') && !firstTwoWords.includes('Quiz')) {
              topicName = firstTwoWords;
            }
          }
        }

        return {
          id: item.id,
          title: title,
          extractedTopic: topicName,
          workType: item.workType,
          hasMaterials: !!(item.materials && item.materials.length > 0),
          materialsCount: item.materials?.length || 0
        };
      });

      return NextResponse.json({
        success: true,
        totalCoursework: allCoursework.length,
        learningModules: learningModules.length,
        debugData: debugData,
        allTitles: learningModules.map(item => item.title)
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
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
