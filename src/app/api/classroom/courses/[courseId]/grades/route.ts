import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';
import { connectToDatabase } from '@/lib/mongodb';
import { SubmissionModel } from '@/models/Submission';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ courseId: string }> }) {
	try {
		const { params } = await ctx;
		const { courseId } = await params;
		
		// Connect to database
		await connectToDatabase();
		
		// Always fetch fresh data from Google Classroom
		const classroom = getClassroom();
		
		// First, get all coursework for this course
		const courseWorkIds: string[] = [];
		let cwPageToken: string | undefined = undefined;
		try {
			do {
				const cwRes = await classroom.courses.courseWork.list({ courseId, pageSize: 100, pageToken: cwPageToken });
				const items = cwRes.data.courseWork || [];
				for (const item of items) {
					if (item.id) courseWorkIds.push(item.id);
				}
				cwPageToken = cwRes.data.nextPageToken || undefined;
			} while (cwPageToken);
		} catch (apiError) {
			console.error('Google API Error (coursework):', apiError);
			throw new Error(`Google API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
		}

		// For each coursework, fetch its student submissions (grades are included in submissions)
		const allGrades: any[] = [];
		for (const courseWorkId of courseWorkIds) {
			let subPageToken: string | undefined = undefined;
			try {
				do {
					const subRes = await classroom.courses.courseWork.studentSubmissions.list({ 
						courseId, 
						courseWorkId, 
						pageSize: 100, 
						pageToken: subPageToken 
					});
					
					// Filter submissions that have grades
					const gradedSubmissions = (subRes.data.studentSubmissions || []).filter(
						(sub: any) => sub.assignedGrade !== null && sub.assignedGrade !== undefined
					);
					
					allGrades.push(...gradedSubmissions);
					subPageToken = subRes.data.nextPageToken || undefined;
				} while (subPageToken);
			} catch (apiError) {
				console.error(`Google API Error (grades for coursework ${courseWorkId}):`, apiError);
				// Continue with other coursework even if one fails
			}
		}

		// Store submissions with grades in database (for backup/reference, but always return fresh API data)
		const submissionPromises = allGrades.map(async (sub) => {
			if (!sub.id || !sub.courseWorkId) return;

			await SubmissionModel.findOneAndUpdate(
				{ submissionId: sub.id },
				{
					courseId,
					courseWorkId: sub.courseWorkId,
					submissionId: sub.id,
					userEmail: sub.userId || '', // Google API might not provide userEmail directly
					state: sub.state,
					late: sub.late,
					uploadedTime: sub.uploadedTime ? new Date(sub.uploadedTime) : undefined,
					updateTime: sub.updateTime ? new Date(sub.updateTime) : undefined,
					assignedGrade: sub.assignedGrade
				},
				{ upsert: true, new: true }
			);
		});

		await Promise.all(submissionPromises);

		// Return fresh grades data from API
		const formattedGrades = allGrades.map(sub => ({
			submissionId: sub.id,
			courseWorkId: sub.courseWorkId,
			userEmail: sub.userId || '',
			grade: sub.assignedGrade,
			state: sub.state,
			late: sub.late
		}));

		return NextResponse.json({ count: formattedGrades.length, grades: formattedGrades });
	} catch (e) {
		console.error('Grades API Error:', e);
		const message = e instanceof Error ? e.message : 'Failed to fetch grades';
		return NextResponse.json({ message }, { status: 500 });
	}
}
