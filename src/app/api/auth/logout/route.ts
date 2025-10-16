import { NextResponse } from 'next/server';

export async function POST() {
	const res = NextResponse.json({ success: true });
	
	// Clear the authentication cookie
	res.cookies.set('token', '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 0, // Expire immediately
	});

	return res;
}
