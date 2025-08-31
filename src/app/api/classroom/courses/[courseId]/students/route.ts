import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

interface Student {
	userId?: string;
	profile?: {
		id?: string;
		name?: {
			givenName?: string;
			familyName?: string;
			fullName?: string;
		};
		emailAddress?: string;
	};
	courseId?: string;
}

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
		const all: Student[] = [];
		let pageToken: string | undefined = undefined;
		
		try {
			do {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const res: any = await classroom.courses.students.list({ courseId, pageSize: 100, pageToken });
				all.push(...(res.data.students || []));
				pageToken = res.data.nextPageToken || undefined;
			} while (pageToken);
		} catch (apiError) {
			console.error('Google API Error:', apiError);
			throw new Error(`Google API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
		}

		// Store students in database (for backup/reference, but always return fresh API data)
		const studentPromises = all.map(async (student) => {
			if (!student.profile?.emailAddress) return;

			await UserModel.findOneAndUpdate(
				{ email: student.profile.emailAddress },
				{
					email: student.profile.emailAddress,
					fullName: student.profile.name?.fullName || `${student.profile.name?.givenName || ''} ${student.profile.name?.familyName || ''}`.trim(),
					givenName: student.profile.name?.givenName || '',
					familyName: student.profile.name?.familyName || '',
					role: 'student',
					externalId: student.userId || student.profile.id || student.profile.emailAddress
				},
				{ upsert: true, new: true }
			);
		});

		await Promise.all(studentPromises);

		// Return fresh data from API
		return NextResponse.json({ count: all.length, students: all });
	} catch (e) {
		console.error('Students API Error:', e);
		const message = e instanceof Error ? e.message : 'Failed to fetch students';
		return NextResponse.json({ message }, { status: 500 });
	}
}
