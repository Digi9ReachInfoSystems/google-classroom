import { NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test API to fetch courses directly from Google Classroom API
 * This API does NOT use MongoDB - it fetches directly from Google
 * 
 * Usage: GET http://localhost:3000/api/test/google-courses
 */
export async function GET() {
  try {
    console.log('=== TEST: Fetching courses from Google Classroom API ===');
    console.log('Service Account Email:', process.env.GOOGLE_CLIENT_EMAIL);
    console.log('Delegated Admin Email:', process.env.GOOGLE_DELEGATED_ADMIN || 'admin@digi9.co.in');
    console.log('Domain:', process.env.GOOGLE_DOMAIN);

    // Get Google Classroom service instance
    const classroom = getClassroom();
    console.log('✓ Google Classroom service initialized');

    // Fetch courses from Google Classroom API
    const startTime = Date.now();
    console.log('Fetching courses from Google Classroom...');

    const allCourses: any[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;

    do {
      pageCount++;
      console.log(`Fetching page ${pageCount}...`);

      const response = await classroom.courses.list({
        pageSize: 100,
        pageToken,
        // courseStates: ['ACTIVE'], // Uncomment to fetch only active courses
      });

      const courses = response.data.courses || [];
      allCourses.push(...courses);
      pageToken = response.data.nextPageToken || undefined;

      console.log(`Page ${pageCount}: Found ${courses.length} courses`);
    } while (pageToken);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✓ Successfully fetched ${allCourses.length} courses in ${duration}ms`);

    // Format response with detailed course information
    const formattedCourses = allCourses.map(course => ({
      id: course.id,
      name: course.name,
      section: course.section,
      description: course.description,
      descriptionHeading: course.descriptionHeading,
      room: course.room,
      ownerId: course.ownerId,
      courseState: course.courseState,
      enrollmentCode: course.enrollmentCode,
      creationTime: course.creationTime,
      updateTime: course.updateTime,
      alternateLink: course.alternateLink,
      teacherGroupEmail: course.teacherGroupEmail,
      courseGroupEmail: course.courseGroupEmail,
    }));

    // Group courses by state
    const coursesByState = allCourses.reduce((acc: any, course) => {
      const state = course.courseState || 'UNKNOWN';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      message: 'Successfully fetched courses from Google Classroom API',
      source: 'Google Classroom API (Direct)',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        totalCourses: allCourses.length,
        pagesProcessed: pageCount,
        coursesByState,
      },
      serviceAccount: {
        email: process.env.GOOGLE_CLIENT_EMAIL,
        delegatedAdmin: process.env.GOOGLE_DELEGATED_ADMIN,
        domain: process.env.GOOGLE_DOMAIN,
      },
      courses: formattedCourses,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ Error fetching courses from Google Classroom:', error);
    
    // Detailed error information
    const errorDetails: any = {
      success: false,
      message: 'Failed to fetch courses from Google Classroom API',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    // Add more error details if available
    if (error instanceof Error) {
      errorDetails.errorName = error.name;
      errorDetails.errorStack = error.stack?.split('\n').slice(0, 5); // First 5 lines of stack
    }

    // Check for specific Google API errors
    if ((error as any).code) {
      errorDetails.errorCode = (error as any).code;
      errorDetails.errorDetails = (error as any).errors;
    }

    // Common troubleshooting tips
    errorDetails.troubleshooting = [
      'Verify service account has domain-wide delegation enabled',
      'Check if delegated admin email has access to Google Classroom',
      'Ensure service account has necessary API scopes enabled',
      'Verify Google Classroom API is enabled in Google Cloud Console',
      'Check if there are any courses in the Google Classroom account',
    ];

    return NextResponse.json(errorDetails, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

/**
 * POST endpoint to test with specific parameters
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      pageSize = 100, 
      courseStates = null,
      teacherId = null 
    } = body;

    console.log('=== TEST: Fetching courses with custom parameters ===');
    console.log('Parameters:', { pageSize, courseStates, teacherId });

    const classroom = getClassroom();
    const startTime = Date.now();

    const allCourses: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const params: any = {
        pageSize,
        pageToken,
      };

      if (courseStates) {
        params.courseStates = courseStates;
      }

      if (teacherId) {
        params.teacherId = teacherId;
      }

      const response = await classroom.courses.list(params);
      const courses = response.data.courses || [];
      allCourses.push(...courses);
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    const endTime = Date.now();
    const duration = endTime - startTime;

    return NextResponse.json({
      success: true,
      message: 'Successfully fetched courses with custom parameters',
      duration: `${duration}ms`,
      parameters: { pageSize, courseStates, teacherId },
      totalCourses: allCourses.length,
      courses: allCourses.map(course => ({
        id: course.id,
        name: course.name,
        section: course.section,
        courseState: course.courseState,
        ownerId: course.ownerId,
      })),
    });

  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch courses',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
