import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';
import { connectToDatabase } from '@/lib/mongodb';
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
		const all: any[] = [];
		let pageToken: string | undefined = undefined;
		
		try {
			do {
				const res = await classroom.courses.courseWork.list({ courseId, pageSize: 100, pageToken });
				all.push(...(res.data.courseWork || []));
				pageToken = res.data.nextPageToken || undefined;
			} while (pageToken);
		} catch (apiError) {
			console.error('Google API Error:', apiError);
			throw new Error(`Google API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
		}

		// Store coursework in database (for backup/reference, but always return fresh API data)
		const courseworkPromises = all.map(async (cw) => {
			if (!cw.id) return;

			// Convert due date if it exists
			let dueDate = null;
			if (cw.dueDate) {
				dueDate = new Date(cw.dueDate.year, cw.dueDate.month - 1, cw.dueDate.day);
			}

			await CourseworkModel.findOneAndUpdate(
				{ courseWorkId: cw.id },
				{
					courseId,
					courseWorkId: cw.id,
					title: cw.title,
					description: cw.description,
					dueDate,
					state: cw.state,
					maxPoints: cw.maxPoints,
					updateTime: cw.updateTime ? new Date(cw.updateTime) : undefined,
					creationTime: cw.creationTime ? new Date(cw.creationTime) : undefined
				},
				{ upsert: true, new: true }
			);
		});

		await Promise.all(courseworkPromises);

		// Return fresh data from API
		return NextResponse.json({ count: all.length, courseWork: all });
	} catch (e) {
		console.error('Coursework API Error:', e);
		const message = e instanceof Error ? e.message : 'Failed to fetch courseWork';
		return NextResponse.json({ message }, { status: 500 });
	}
}
