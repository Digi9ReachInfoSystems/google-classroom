import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	console.log('Middleware checking path:', pathname);

	// Allow auth, login, student, teacher API routes, and static login
	if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/student') || pathname.startsWith('/api/teacher') || pathname.startsWith('/api/superadmin') || pathname.startsWith('/api/districtadmin') || pathname.startsWith('/login') || pathname.startsWith('/static-login') || pathname.startsWith('/landingpage')) {
		console.log('Allowing auth/login/student/teacher/superadmin/districtadmin API route');
		return NextResponse.next();
	}

	// Check for authentication token
	const token = req.cookies.get('token')?.value;
	const allCookies = req.cookies.getAll();
	console.log('[Middleware] All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
	console.log('[Middleware] Token found:', !!token);
	console.log('[Middleware] Request URL:', req.url);
	console.log('[Middleware] Request hostname:', req.nextUrl.hostname);
	
	if (!token) {
		console.log('[Middleware] No token, redirecting to login');
		return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
	}

	const payload = verifyAuthToken(token);
	console.log('Token payload:', payload);
	console.log('Token verification result:', !!payload);
	if (!payload) {
		console.log('Invalid token, redirecting to login');
		console.log('Token value (first 50 chars):', token.substring(0, 50));
		return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
	}

	// Role-based route protection
	const userRole = payload.role;
	console.log('User role:', userRole);
	
	// Define role-based access patterns
	const roleRoutes = {
		student: ['/student'],
		teacher: ['/teacher'],
		'district-admin': ['/districtadmin'],
		'super-admin': ['/superadmin']
	};

	// Check if user has access to current route
	const allowedRoutes = roleRoutes[userRole] || [];
	const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));
	console.log('Allowed routes for role:', allowedRoutes);
	console.log('Has access to current route:', hasAccess);

	if (!hasAccess && !pathname.startsWith('/api/')) {
		// Redirect to appropriate dashboard based on role
		const redirectMap = {
			student: '/student/dashboard',
			teacher: '/teacher/dashboard',
			'district-admin': '/districtadmin/overview',
			'super-admin': '/superadmin/overview'
		};
		
		const redirectPath = redirectMap[userRole] || '/dashboard';
		console.log('Redirecting to:', redirectPath);
		return NextResponse.redirect(new URL(redirectPath, req.nextUrl.origin));
	}

	console.log('Middleware allowing access');
	return NextResponse.next();
}

export const config = {
	matcher: [
		'/dashboard/:path*',
		'/student/:path*',
		'/teacher/:path*',
		'/districtadmin/:path*',
		'/superadmin/:path*',
		'/api/:path*',
		'/login',
		'/static-login'
	],
};
