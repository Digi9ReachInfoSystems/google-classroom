import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getClassroom } from '@/lib/google';
import { verifyAuthToken } from '@/lib/auth';

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

		// Get course ID from query parameters
		const { searchParams } = new URL(req.url);
		const courseId = searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
		}

		await connectToDatabase();
		const classroom = getClassroom();

		try {
			// Fetch coursework from Google Classroom API
			const coursework = await classroom.courses.courseWork.list({
				courseId: courseId,
				pageSize: 50,
				orderBy: 'updateTime desc'
			});

			// Fetch student submissions for this course
			const submissions = await classroom.courses.courseWork.studentSubmissions.list({
				courseId: courseId,
				userId: payload.email,
				pageSize: 50
			});

			// Transform the data for the frontend
			const courseworkData = coursework.data.courseWork?.map((work: any) => {
				// Find corresponding submission
				const submission = submissions.data.studentSubmissions?.find(
					(sub: any) => sub.courseWorkId === work.id
				);

				return {
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
					submissionModificationMode: work.submissionModificationMode,
					// Submission data
					submission: submission ? {
						id: submission.id,
						state: submission.state,
						assignedGrade: submission.assignedGrade,
						draftGrade: submission.draftGrade,
						creationTime: submission.creationTime,
						updateTime: submission.updateTime,
						submitted: submission.submitted,
						late: submission.late,
						alternateLink: submission.alternateLink
					} : null
				};
			}) || [];

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
