import { NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';

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

export async function GET() {
	try {
		const classroom = getClassroom();
		const all: Course[] = [];
		let pageToken: string | undefined = undefined;
		do {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result: any = await classroom.courses.list({ pageSize: 300, pageToken });
			const courses = result.data.courses || [];
			all.push(...courses);
			pageToken = result.data.nextPageToken || undefined;
		} while (pageToken);

		return NextResponse.json({ count: all.length, courses: all });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to fetch courses';
		return NextResponse.json({ message }, { status: 500 });
	}
}
