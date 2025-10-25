import { NextRequest, NextResponse } from 'next/server';
import { buildAuthCookieOptions, signAuthToken, verifyStaticCredentials } from '@/lib/auth';

export async function POST(req: NextRequest) {
	const { username, password } = await req.json();

	if (!username || !password) {
		return NextResponse.json({ message: 'Missing credentials' }, { status: 400 });
	}

	const isValid = verifyStaticCredentials(username, password);
	if (!isValid) {
		return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
	}

	const token = signAuthToken({ email: username, role: 'super-admin', userId: username });
	const res = NextResponse.json({ success: true });
	const isSecure = req.nextUrl.protocol === 'https:';
	res.cookies.set('token', token, buildAuthCookieOptions(req.nextUrl.hostname, 60 * 60 * 24 * 7, isSecure));
	return res;
}
