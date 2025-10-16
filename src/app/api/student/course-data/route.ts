import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient, getClassroomWithUserAuth } from '@/lib/user-oauth';

export async function GET(req: NextRequest) {
	try {
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

		// Check if we have OAuth tokens
		if (!payload.accessToken) {
			return NextResponse.json({ 
				success: false, 
				error: 'No OAuth tokens found. Please log in again.' 
			}, { status: 401 });
		}

		// Get course ID from query parameters
		const { searchParams } = new URL(req.url);
		const courseId = searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
		}

		// Initialize Google Classroom API with user's OAuth credentials
		const oauth2Client = createUserOAuthClient({
			access_token: payload.accessToken,
			refresh_token: payload.refreshToken
		});
		
		const classroom = getClassroomWithUserAuth(oauth2Client);

		try {
			console.log('Fetching course data for:', courseId);
			
			// Fetch course details
			const courseResponse = await classroom.courses.get({ id: courseId });
			const course = courseResponse.data;
			
			// Fetch course work
			const courseWorkResponse = await classroom.courses.courseWork.list({
				courseId: courseId,
				pageSize: 50,
				orderBy: 'updateTime desc'
			});
			const courseWork = courseWorkResponse.data.courseWork || [];
			
			// Fetch submissions for the student
			const submissions = [];
			for (const work of courseWork) {
				if (work.id) {
					try {
						const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
							courseId: courseId,
							courseWorkId: work.id,
							userId: payload.email
						});
						
						const studentSubmissions = submissionsResponse.data.studentSubmissions || [];
						submissions.push(...studentSubmissions.map(sub => ({
							id: sub.id,
							courseWorkId: work.id,
							state: sub.state,
							assignedGrade: sub.assignedGrade,
							draftGrade: sub.draftGrade,
							submitted: sub.state === 'TURNED_IN' || sub.state === 'RETURNED',
							late: sub.late || false,
							updateTime: sub.updateTime,
							creationTime: sub.creationTime
						})));
					} catch (error) {
						console.warn(`Error fetching submissions for course work ${work.id}:`, error);
					}
				}
			}
			
			console.log(`Found ${courseWork.length} course work items and ${submissions.length} submissions`);
			
			const courseData = {
				course: {
					id: course.id,
					name: course.name,
					section: course.section,
					description: course.description,
					room: course.room,
					updateTime: course.updateTime,
					creationTime: course.creationTime
				},
				courseWork: courseWork.map(work => ({
					id: work.id,
					title: work.title,
					description: work.description,
					state: work.state,
					dueDate: work.dueDate,
					maxPoints: work.maxPoints,
					workType: work.workType,
					creationTime: work.creationTime,
					updateTime: work.updateTime
				})),
				submissions: submissions
			};

			return NextResponse.json({
				success: true,
				data: courseData,
				source: 'google_classroom'
			});

		} catch (googleError: any) {
			console.error('Error fetching course data from Google Classroom:', googleError);
			
			if (googleError.code === 403) {
				return NextResponse.json(
					{ success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
					{ status: 403 }
				);
			}
			
			return NextResponse.json(
				{ success: false, error: 'Failed to fetch course data from Google Classroom' },
				{ status: 500 }
			);
		}

	} catch (error) {
		console.error('Course data API error:', error);
		return NextResponse.json({
			success: false,
			message: 'Internal server error'
		}, { status: 500 });
	}
}
