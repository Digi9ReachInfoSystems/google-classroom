import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { StageCompletionModel } from '@/models/StageCompletion';
import { google } from 'googleapis';

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

		// Check OAuth credentials
		if (!payload.accessToken) {
			return NextResponse.json({ 
				success: false,
				message: 'No OAuth credentials found. Please log in again.' 
			}, { status: 401 });
		}

		// Get course ID from query parameters
		const { searchParams } = new URL(req.url);
		const courseId = searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
		}

		await connectToDatabase();
		
		// Create OAuth2 client with user's credentials
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

			console.log('Found material completions:', materialCompletions.map(mc => ({
				stageId: mc.stageId,
				courseId: mc.courseId,
				studentEmail: mc.studentEmail,
				completedAt: mc.completedAt
			})));

			const completedMaterialIds = new Set(
				materialCompletions.map(mc => mc.stageId.replace('material-', ''))
			);
			
			console.log('Completed material IDs:', Array.from(completedMaterialIds));

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
				
				if (work.id && (isCompletedLocally || submission)) {
					console.log(`Coursework ${work.id} (${work.title}):`, {
						hasGoogleSubmission: !!submission,
						submissionState: submission?.state,
						isCompletedLocally,
						willShowAsCompleted: !!(submission || isCompletedLocally)
					});
				}

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

			return NextResponse.json({
				success: true,
				coursework: courseworkData,
				total: courseworkData.length
			});

		} catch (googleError: any) {
			console.error('Error fetching coursework:', googleError);
			
			// Return mock data if Google API fails
			const mockCoursework = [
				{
					id: '1',
					title: 'Assignment 1',
					description: 'Complete the reading and answer questions',
					state: 'PUBLISHED',
					dueDate: { year: 2024, month: 12, day: 15 },
					maxPoints: 100,
					workType: 'ASSIGNMENT',
					submission: {
						id: '1',
						state: 'TURNED_IN',
						assignedGrade: 88,
						submitted: true,
						late: false
					}
				},
				{
					id: '2',
					title: 'Quiz 1',
					description: 'Multiple choice quiz on chapter 1',
					state: 'PUBLISHED',
					dueDate: { year: 2024, month: 12, day: 20 },
					maxPoints: 50,
					workType: 'QUIZ',
					submission: {
						id: '2',
						state: 'NEW',
						assignedGrade: null,
						submitted: false,
						late: false
					}
				}
			];

			return NextResponse.json({
				success: true,
				coursework: mockCoursework,
				total: mockCoursework.length,
				source: 'mock'
			});
		}

	} catch (error) {
		console.error('Coursework API error:', error);
		return NextResponse.json({
			success: false,
			message: 'Internal server error'
		}, { status: 500 });
	}
}
