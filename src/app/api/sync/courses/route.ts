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
		await connectToDatabase();
		console.log('Connected to database');
		
		const classroom = getClassroom();
		console.log('Got classroom instance');
		
		const all: Course[] = [];
		let pageToken: string | undefined = undefined;
		do {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const res: any = await classroom.courses.list({ pageSize: 300, pageToken });
			all.push(...(res.data.courses || []));
			pageToken = res.data.nextPageToken || undefined;
		} while (pageToken);

		console.log(`Fetched ${all.length} courses from Google Classroom`);

		if (all.length === 0) {
			return NextResponse.json({ synced: 0 });
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
