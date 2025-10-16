import { NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { RosterMembershipModel } from '@/models/RosterMembership';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
	try {
		console.log('Starting sync users from Google Classroom...');
		await connectToDatabase();
		console.log('Connected to database');
		
		const classroom = getClassroom();
		console.log('Got classroom instance');
		
		// Step 1: Get all courses
		const allCourses: any[] = [];
		let pageToken: string | undefined = undefined;
		do {
			const res: any = await classroom.courses.list({ pageSize: 300, pageToken });
			allCourses.push(...(res.data.courses || []));
			pageToken = res.data.nextPageToken || undefined;
		} while (pageToken);

		console.log(`Found ${allCourses.length} courses`);

		// Step 2: For each course, get all students and teachers
		const allUsers = new Map<string, any>(); // Use Map to avoid duplicates
		const rosterMemberships: any[] = [];

		for (const course of allCourses) {
			console.log(`Processing course: ${course.name} (${course.id})`);
			
			try {
				// Get students
				const studentsRes = await classroom.courses.students.list({
					courseId: course.id,
					pageSize: 1000
				});

				if (studentsRes.data.students) {
					for (const student of studentsRes.data.students) {
						if (student.profile?.emailAddress) {
							const email = student.profile.emailAddress.toLowerCase();
							allUsers.set(email, {
								email,
								fullName: student.profile.name?.fullName || '',
								givenName: student.profile.name?.givenName || '',
								familyName: student.profile.name?.familyName || '',
								role: 'student',
								externalId: student.profile.id,
								photoUrl: student.profile.photoUrl
							});

							// Add roster membership
							rosterMemberships.push({
								courseId: course.id,
								userEmail: email,
								role: 'student'
							});
						}
					}
				}

				// Get teachers
				const teachersRes = await classroom.courses.teachers.list({
					courseId: course.id,
					pageSize: 1000
				});

				if (teachersRes.data.teachers) {
					for (const teacher of teachersRes.data.teachers) {
						if (teacher.profile?.emailAddress) {
							const email = teacher.profile.emailAddress.toLowerCase();
							allUsers.set(email, {
								email,
								fullName: teacher.profile.name?.fullName || '',
								givenName: teacher.profile.name?.givenName || '',
								familyName: teacher.profile.name?.familyName || '',
								role: 'teacher',
								externalId: teacher.profile.id,
								photoUrl: teacher.profile.photoUrl
							});

							// Add roster membership
							rosterMemberships.push({
								courseId: course.id,
								userEmail: email,
								role: 'teacher'
							});
						}
					}
				}

			} catch (error) {
				console.error(`Error processing course ${course.id}:`, error);
				continue;
			}
		}

		console.log(`Found ${allUsers.size} unique users`);
		console.log(`Found ${rosterMemberships.length} roster memberships`);

		// Step 3: Bulk upsert users
		const userOps = Array.from(allUsers.values()).map((user) => ({
			updateOne: {
				filter: { email: user.email },
				update: {
					$set: {
						email: user.email,
						fullName: user.fullName,
						givenName: user.givenName,
						familyName: user.familyName,
						role: user.role,
						externalId: user.externalId,
						photoUrl: user.photoUrl
					},
				},
				upsert: true,
			},
		}));

		console.log('Starting bulk write for users...');
		const userResult = await UserModel.bulkWrite(userOps, { ordered: false });
		console.log('Users bulk write completed');

		// Step 4: Bulk upsert roster memberships
		const rosterOps = rosterMemberships.map((membership) => ({
			updateOne: {
				filter: { 
					courseId: membership.courseId, 
					userEmail: membership.userEmail, 
					role: membership.role 
				},
				update: {
					$set: membership,
				},
				upsert: true,
			},
		}));

		console.log('Starting bulk write for roster memberships...');
		const rosterResult = await RosterMembershipModel.bulkWrite(rosterOps, { ordered: false });
		console.log('Roster memberships bulk write completed');
		
		return NextResponse.json({ 
			success: true,
			users: allUsers.size,
			rosterMemberships: rosterMemberships.length,
			userResult,
			rosterResult
		});

	} catch (e) {
		console.error('Sync users error:', e);
		const message = e instanceof Error ? e.message : 'Failed to sync users';
		return NextResponse.json({ message }, { status: 500 });
	}
}
