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
				const res = await classroom.courses.students.list({ courseId, pageSize: 100, pageToken });
				all.push(...(res.data.students || []));
				pageToken = res.data.nextPageToken || undefined;
			} while (pageToken);
		} catch (apiError) {
			console.error('Google API Error:', apiError);
			throw new Error(`Google API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
		}

		// Store students in database (for backup/reference, but always return fresh API data)
		const studentPromises = all.map(async (student) => {
			const email = student.profile?.emailAddress;
			if (!email) return;

			// Store user if not exists
			await UserModel.findOneAndUpdate(
				{ email },
				{
					email,
					externalId: student.userId,
					role: 'student',
					givenName: student.profile?.name?.givenName,
					familyName: student.profile?.name?.familyName,
					fullName: student.profile?.name?.fullName
				},
				{ upsert: true, new: true }
			);

			// Store roster membership
			await RosterMembershipModel.findOneAndUpdate(
				{ courseId, userEmail: email, role: 'student' },
				{ courseId, userEmail: email, role: 'student' },
				{ upsert: true, new: true }
			);
		});

		await Promise.all(studentPromises);

		// Return fresh data from API
		const formattedStudents = all.map(student => ({
			userId: student.userId,
			profile: {
				name: {
					givenName: student.profile?.name?.givenName,
					familyName: student.profile?.name?.familyName,
					fullName: student.profile?.name?.fullName || student.profile?.emailAddress
				},
				emailAddress: student.profile?.emailAddress
			}
		}));

		return NextResponse.json({ count: formattedStudents.length, students: formattedStudents });
	} catch (e) {
		console.error('Students API Error:', e);
		const message = e instanceof Error ? e.message : 'Failed to fetch course students';
		return NextResponse.json({ message }, { status: 500 });
	}
}
