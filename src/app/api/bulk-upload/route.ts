import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import * as XLSX from 'xlsx';

interface UploadRow {
	email: string;
	externalId?: string;
	role: string;
	schoolId?: string;
	gender?: string;
	state?: string;
	district?: string;
	cohort?: string;
}

interface ExcelRow {
	email?: string;
	externalId?: string;
	role?: string;
	schoolId?: string;
	gender?: string;
	state?: string;
	district?: string;
	cohort?: string;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	const token = req.cookies.get('token')?.value;
	if (!token || !verifyAuthToken(token)) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	const formData = await req.formData();
	const file = formData.get('file');
	if (!(file instanceof File)) {
		return NextResponse.json({ message: 'Missing file' }, { status: 400 });
	}

	await connectToDatabase();

	const buffer = Buffer.from(await file.arrayBuffer());
	const workbook = XLSX.read(buffer, { type: 'buffer' });
	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];
	const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '' });

	let created = 0;
	let updated = 0;
	const failures: Array<{ row: number; email?: string; error: string }> = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const email = String(row.email || '').trim().toLowerCase();
		if (!email) {
			failures.push({ row: i + 2, error: 'Missing email' });
			continue;
		}

		const payload: UploadRow = {
			email,
			externalId: String(row.externalId || '').trim() || undefined,
			role: (String(row.role || '').trim().toLowerCase() as 'student' | 'teacher' | 'admin') || 'student',
			schoolId: String(row.schoolId || '').trim() || undefined,
			gender: String(row.gender || '').trim() || undefined,
			state: String(row.state || '').trim() || undefined,
			district: String(row.district || '').trim() || undefined,
			cohort: String(row.cohort || '').trim() || undefined,
		};

		try {
			const res = await UserModel.findOneAndUpdate(
				{ email: payload.email },
				{ $set: payload },
				{ upsert: true, new: true, setDefaultsOnInsert: true }
			);
			if (res.createdAt && res.updatedAt && res.createdAt.getTime() === res.updatedAt.getTime()) {
				created += 1;
			} else {
				updated += 1;
			}
		} catch (e) {
			failures.push({ row: i + 2, email, error: e instanceof Error ? e.message : 'Unknown error' });
		}
	}

	return NextResponse.json({ created, updated, failed: failures.length, failures });
}
