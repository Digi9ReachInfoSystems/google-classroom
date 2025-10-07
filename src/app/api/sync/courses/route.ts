import { NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';

interface Course {
	id?: string;
	name?: string;
	section?: string;
	descriptionHeading?: string;
	description?: string;
	room?: string;
	ownerId?: string;
	enrollmentCode?: string;
	courseState?: string;
	updateTime?: string;
	creationTime?: string;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
	try {
		console.log('Starting sync courses...');
		console.log('Using delegated admin email:', process.env.GOOGLE_DELEGATED_ADMIN || 'admin@digi9.co.in');
		await connectToDatabase();
		console.log('Connected to database');
		
		const classroom = getClassroom();
		console.log('Got classroom instance');
		
		const all: Course[] = [];
		let pageToken: string | undefined = undefined;
		try {
			do {
				// Try without teacherId first to see all courses the service account can access
				const res: any = await classroom.courses.list({ 
					pageSize: 300, 
					pageToken
				});
				console.log('Google Classroom API response:', res.data);
				all.push(...(res.data.courses || []));
				pageToken = res.data.nextPageToken || undefined;
			} while (pageToken);
		} catch (apiError) {
			console.error('Google Classroom API error:', apiError);
			return NextResponse.json({ 
				message: 'Failed to fetch courses from Google Classroom. Check service account permissions.',
				error: apiError instanceof Error ? apiError.message : 'Unknown API error'
			}, { status: 500 });
		}

		console.log(`Fetched ${all.length} courses from Google Classroom`);
		console.log('All courses:', all);

		if (all.length === 0) {
			console.log('No courses found. This could mean:');
			console.log('1. No courses exist in Google Classroom for this service account');
			console.log('2. Service account does not have proper permissions');
			console.log('3. Delegated admin email does not have access to courses');
			return NextResponse.json({ 
				synced: 0,
				message: 'No courses found. Check service account permissions and delegated admin access.'
			});
		}

		const ops = all.map((c) => ({
			updateOne: {
				filter: { courseId: c.id },
				update: {
					$set: {
						courseId: c.id,
						name: c.name,
						section: c.section,
						descriptionHeading: c.descriptionHeading,
						description: c.description,
						room: c.room,
						ownerId: c.ownerId,
						enrollmentCode: c.enrollmentCode,
						courseState: c.courseState,
						updateTime: c.updateTime ? new Date(c.updateTime) : undefined,
						createdTime: c.creationTime ? new Date(c.creationTime) : undefined,
					},
				},
				upsert: true,
			},
		}));

		console.log('Starting bulk write operation...');
		const result = await CourseModel.bulkWrite(ops, { ordered: false });
		console.log('Bulk write completed successfully');
		
		return NextResponse.json({ synced: all.length, result });
	} catch (e) {
		console.error('Sync courses error:', e);
		const message = e instanceof Error ? e.message : 'Failed to sync courses';
		return NextResponse.json({ message }, { status: 500 });
	}
}
