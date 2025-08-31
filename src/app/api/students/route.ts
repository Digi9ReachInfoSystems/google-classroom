import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { SubmissionModel } from '@/models/Submission';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	await connectToDatabase();

	const { searchParams } = new URL(req.url);
	const states = searchParams.getAll('state');
	const districts = searchParams.getAll('district');
	const genders = searchParams.getAll('gender');

	const match: Record<string, any> = { role: 'student' };
	if (states.length) match.state = { $in: states };
	if (districts.length) match.district = { $in: districts };
	if (genders.length) match.gender = { $in: genders };

	const students = await UserModel.find(match, {
		fullName: 1,
		email: 1,
		state: 1,
		district: 1,
		gender: 1,
	}).lean();

	const emails = students.map((s) => s.email);

	// Aggregate submissions for metrics
	const metrics = await SubmissionModel.aggregate([
		{ $match: { userEmail: { $in: emails } } },
		{
			$group: {
				_id: '$userEmail',
				totalAssignments: { $addToSet: '$courseWorkId' },
				completedCount: {
					$sum: {
						$cond: [{ $in: ['$state', ['TURNED_IN', 'RETURNED']] }, 1, 0],
					},
				},
				lateCount: { $sum: { $cond: ['$late', 1, 0] } },
			},
		},
		{
			$project: {
				totalAssignments: { $size: '$totalAssignments' },
				completedCount: 1,
				lateCount: 1,
			},
		},
	]).exec();

	const metricsByEmail = new Map(
		metrics.map((m) => [m._id as string, { totalAssignments: m.totalAssignments, completedCount: m.completedCount, lateCount: m.lateCount }])
	);

	const table = students.map((s) => {
		const m = metricsByEmail.get(s.email) || { totalAssignments: 0, completedCount: 0, lateCount: 0 };
		const latePct = m.totalAssignments > 0 ? Math.round((m.lateCount / m.totalAssignments) * 100) : 0;
		return {
			name: (s as any).fullName || s.email,
			email: s.email,
			state: (s as any).state || '',
			district: (s as any).district || '',
			gender: (s as any).gender || '',
			assignments: m.totalAssignments,
			completed: m.completedCount,
			latePct,
		};
	});

	const totalStudents = table.length;
	const totalAssignments = table.reduce((acc, r) => acc + r.assignments, 0);
	const totalCompleted = table.reduce((acc, r) => acc + r.completed, 0);
	const totalLate = table.reduce((acc, r) => acc + (r.latePct > 0 ? 1 : 0), 0);
	const completionRate = totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;
	const lateRate = totalStudents > 0 ? Math.round((totalLate / totalStudents) * 100) : 0;

	return NextResponse.json({
		kpis: {
			totalStudents,
			completionRate,
			lateRate,
		},
		table,
	});
}
