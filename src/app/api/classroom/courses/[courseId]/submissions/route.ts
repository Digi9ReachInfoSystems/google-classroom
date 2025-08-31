import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';
import { connectToDatabase } from '@/lib/mongodb';
import { SubmissionModel } from '@/models/Submission';
import { CourseworkModel } from '@/models/Coursework';

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

		// For each coursework, fetch its student submissions
		const all: any[] = [];
		for (const courseWorkId of courseWorkIds) {
			let subPageToken: string | undefined = undefined;
			try {
				do {
					const subRes = await classroom.courses.courseWork.studentSubmissions.list({ courseId, courseWorkId, pageSize: 100, pageToken: subPageToken });
					all.push(...(subRes.data.studentSubmissions || []));
					subPageToken = subRes.data.nextPageToken || undefined;
				} while (subPageToken);
			} catch (apiError) {
				console.error(`Google API Error (submissions for coursework ${courseWorkId}):`, apiError);
				// Continue with other coursework even if one fails
			}
		}

		// Store submissions in database (for backup/reference, but always return fresh API data)
		const submissionPromises = all.map(async (sub) => {
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

		// Return fresh data from API
		return NextResponse.json({ count: all.length, studentSubmissions: all });
	} catch (e) {
		console.error('Submissions API Error:', e);
		const message = e instanceof Error ? e.message : 'Failed to fetch submissions';
		return NextResponse.json({ message }, { status: 500 });
	}
}
