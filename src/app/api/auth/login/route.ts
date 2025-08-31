import { NextRequest, NextResponse } from 'next/server';
import { signAuthToken, verifyStaticCredentials } from '@/lib/auth';

export async function POST(req: NextRequest) {
	const { username, password } = await req.json();

	if (!username || !password) {
		return NextResponse.json({ message: 'Missing credentials' }, { status: 400 });
	}

	const isValid = verifyStaticCredentials(username, password);
	if (!isValid) {
		return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
	}

	const token = signAuthToken({ username, role: 'admin' });
	const res = NextResponse.json({ success: true });
	res.cookies.set('token', token, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 7,
	});
	return res;
}
