import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

interface Teacher {
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
		const all: Teacher[] = [];
		let pageToken: string | undefined = undefined;
		
		try {
			do {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const res: any = await classroom.courses.teachers.list({ courseId, pageSize: 100, pageToken });
				all.push(...(res.data.teachers || []));
				pageToken = res.data.nextPageToken || undefined;
			} while (pageToken);
		} catch (apiError) {
			console.error('Google API Error:', apiError);
			throw new Error(`Google API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
		}

		// Store teachers in database (for backup/reference, but always return fresh API data)
		const teacherPromises = all.map(async (teacher) => {
			if (!teacher.profile?.emailAddress) return;

			await UserModel.findOneAndUpdate(
				{ email: teacher.profile.emailAddress },
				{
					email: teacher.profile.emailAddress,
					fullName: teacher.profile.name?.fullName || `${teacher.profile.name?.givenName || ''} ${teacher.profile.name?.familyName || ''}`.trim(),
					givenName: teacher.profile.name?.givenName || '',
					familyName: teacher.profile.name?.familyName || '',
					role: 'teacher',
					externalId: teacher.userId || teacher.profile.id || teacher.profile.emailAddress
				},
				{ upsert: true, new: true }
			);
		});

		await Promise.all(teacherPromises);

		// Return fresh data from API
		return NextResponse.json({ count: all.length, teachers: all });
	} catch (e) {
		console.error('Teachers API Error:', e);
		const message = e instanceof Error ? e.message : 'Failed to fetch teachers';
		return NextResponse.json({ message }, { status: 500 });
	}
}
