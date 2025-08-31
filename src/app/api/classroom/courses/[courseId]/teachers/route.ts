import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';
import { connectToDatabase } from '@/lib/mongodb';
import { RosterMembershipModel } from '@/models/RosterMembership';
import { UserModel } from '@/models/User';

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
				const res = await classroom.courses.teachers.list({ courseId, pageSize: 100, pageToken });
				all.push(...(res.data.teachers || []));
				pageToken = res.data.nextPageToken || undefined;
			} while (pageToken);
		} catch (apiError) {
			console.error('Google API Error:', apiError);
			throw new Error(`Google API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
		}

		// Store teachers in database (for backup/reference, but always return fresh API data)
		const teacherPromises = all.map(async (teacher) => {
			const email = teacher.profile?.emailAddress;
			if (!email) return;

			// Store user if not exists
			await UserModel.findOneAndUpdate(
				{ email },
				{
					email,
					externalId: teacher.userId,
					role: 'teacher',
					givenName: teacher.profile?.name?.givenName,
					familyName: teacher.profile?.name?.familyName,
					fullName: teacher.profile?.name?.fullName
				},
				{ upsert: true, new: true }
			);

			// Store roster membership
			await RosterMembershipModel.findOneAndUpdate(
				{ courseId, userEmail: email, role: 'teacher' },
				{ courseId, userEmail: email, role: 'teacher' },
				{ upsert: true, new: true }
			);
		});

		await Promise.all(teacherPromises);

		// Return fresh data from API
		const formattedTeachers = all.map(teacher => ({
			userId: teacher.userId,
			profile: {
				name: {
					givenName: teacher.profile?.name?.givenName,
					familyName: teacher.profile?.name?.familyName,
					fullName: teacher.profile?.name?.fullName || teacher.profile?.emailAddress
				},
				emailAddress: teacher.profile?.emailAddress
			}
		}));

		return NextResponse.json({ count: formattedTeachers.length, teachers: formattedTeachers });
	} catch (e) {
		console.error('Teachers API Error:', e);
		const message = e instanceof Error ? e.message : 'Failed to fetch course teachers';
		return NextResponse.json({ message }, { status: 500 });
	}
}
