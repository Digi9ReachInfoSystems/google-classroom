import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CourseModel } from '@/models/Course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	await connectToDatabase();
	const { searchParams } = new URL(req.url);
	const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
	const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12', 10)));
	const q = (searchParams.get('q') || '').trim();

	const filter: any = {};
	if (q) {
		filter.$or = [
			{ name: { $regex: q, $options: 'i' } },
			{ section: { $regex: q, $options: 'i' } },
			{ room: { $regex: q, $options: 'i' } },
		];
	}

	const total = await CourseModel.countDocuments(filter);
	const courses = await CourseModel.find(filter)
		.sort({ updateTime: -1, createdAt: -1 })
		.skip((page - 1) * pageSize)
		.limit(pageSize)
		.lean();

	return NextResponse.json({ page, pageSize, total, courses });
}
