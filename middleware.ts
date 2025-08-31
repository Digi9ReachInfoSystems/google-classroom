import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// Allow login API and page
	if (pathname.startsWith('/api/auth') || pathname.startsWith('/login')) {
		return NextResponse.next();
	}

	// Protect dashboard routes
	if (pathname.startsWith('/dashboard')) {
		const token = req.cookies.get('token')?.value;
		if (!token) {
			return NextResponse.redirect(new URL('/login', req.url));
		}
		const payload = verifyAuthToken(token);
		if (!payload) {
			return NextResponse.redirect(new URL('/login', req.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/dashboard/:path*', '/api/:path*', '/login'],
};
