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

		// Initialize Google Classroom API with user's OAuth credentials
		const oauth2Client = createUserOAuthClient({
			access_token: payload.accessToken,
			refresh_token: payload.refreshToken
		});
		
		const classroom = getClassroomWithUserAuth(oauth2Client);

		try {
			console.log('Fetching courses for student:', payload.email);
			
			// Fetch courses where the student is enrolled using Google Classroom API
			const coursesResponse = await classroom.courses.list({
				pageSize: 100
			});

			const allCourses = coursesResponse.data.courses || [];
			console.log(`Found ${allCourses.length} total courses`);

			// Filter courses where the student is actually enrolled
			const studentCourses = [];
			
			for (const course of allCourses) {
				if (!course.id) continue;
				
				try {
					console.log(`Checking course: ${course.name} (${course.id})`);
					
					// Check if the student is enrolled in this course
					const studentsResponse = await classroom.courses.students.list({
						courseId: course.id
					});
					
					const students = studentsResponse.data.students || [];
					console.log(`Course ${course.name} has ${students.length} students:`, students.map(s => s.profile?.emailAddress));
					
					const isEnrolled = students.some(
						student => student.profile?.emailAddress?.toLowerCase() === payload.email.toLowerCase()
					);
					
					if (isEnrolled) {
						console.log(`Student ${payload.email} is enrolled in course ${course.name}`);
						
						studentCourses.push({
							id: course.id,
							name: course.name,
							section: course.section,
							description: course.description,
							room: course.room,
							courseState: course.courseState,
							alternateLink: course.alternateLink,
							teacherGroupEmail: course.teacherGroupEmail,
							courseGroupEmail: course.courseGroupEmail,
							updateTime: course.updateTime,
							creationTime: course.creationTime
						});
					}
				} catch (error) {
					console.warn(`Error checking students for course ${course.id}:`, error);
					// Continue to next course
				}
			}
			
			console.log(`Found ${studentCourses.length} courses where student is enrolled`);

			return NextResponse.json({
				success: true,
				courses: studentCourses,
				total: studentCourses.length,
				source: 'google_classroom'
			});

		} catch (googleError: any) {
			console.error('Error fetching student courses from Google Classroom:', googleError);
			
			if (googleError.code === 403) {
				return NextResponse.json(
					{ success: false, error: 'Permission denied. Please check your Google Classroom API permissions.' },
					{ status: 403 }
				);
			}
			
			return NextResponse.json(
				{ success: false, error: 'Failed to fetch courses from Google Classroom' },
				{ status: 500 }
			);
		}

	} catch (error) {
		console.error('Student courses API error:', error);
		return NextResponse.json({
			success: false,
			message: 'Internal server error'
		}, { status: 500 });
	}
}
