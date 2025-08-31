import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
	try {
		const classroom = getClassroom();
		const all: any[] = [];
		let pageToken: string | undefined = undefined;
		do {
			const result = await classroom.courses.list({ pageSize: 300, pageToken });
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
