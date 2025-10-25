import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, getUserInfo } from '@/lib/google-oauth';
import { signAuthToken, getRoleBasedRedirect, buildAuthCookieOptions } from '@/lib/auth';
import { detectGoogleClassroomRole } from '@/lib/google';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const code = searchParams.get('code');
		const error = searchParams.get('error');
		const state = searchParams.get('state');

		if (error) {
			console.error('OAuth error:', error);
			return NextResponse.redirect(new URL('/login?error=oauth_denied', req.nextUrl.origin));
		}

		if (!code) {
			return NextResponse.redirect(new URL('/login?error=no_code', req.nextUrl.origin));
		}

		console.log('OAuth callback received code:', code);
		console.log('OAuth state parameter:', state);

		// Exchange code for tokens
		const { oauth2Client, tokens } = await getTokensFromCode(code);
		console.log('Tokens received successfully');
		console.log('Token details:', { 
			hasAccessToken: !!tokens.access_token, 
			hasRefreshToken: !!tokens.refresh_token,
			tokenType: tokens.token_type 
		});

		// Get user info from Google
		const userInfo = await getUserInfo(oauth2Client);
		console.log('User info received:', { email: userInfo.email, name: userInfo.name });

		// Determine role based on state parameter or auto-detect
		let role: 'student' | 'teacher' | 'district-admin' | 'super-admin';
		
		if (state && state.startsWith('admin-')) {
			// Admin role from state parameter
			const adminRole = state.replace('admin-', '');
			if (adminRole === 'district-admin' || adminRole === 'super-admin') {
				role = adminRole;
				console.log('Admin role from state:', role);
			} else {
				// Fallback to auto-detection
				role = await detectGoogleClassroomRole(userInfo.email || '', oauth2Client);
				console.log('Fallback detected role:', role);
			}
		} else {
			// Auto-detect role from Google Classroom using user's OAuth credentials
			role = await detectGoogleClassroomRole(userInfo.email || '', oauth2Client);
			console.log('Detected role:', role);
		}

		// Determine role-based redirect
		const redirectPath = getRoleBasedRedirect(role);
		console.log('Redirect path determined:', redirectPath);

		// Create JWT token (no MongoDB persistence, role is detected from Google Classroom)
		const token = signAuthToken({
			email: userInfo.email || '',
			role: role,
			userId: userInfo.email || '',
			accessToken: tokens.access_token || undefined,
			refreshToken: tokens.refresh_token || undefined
		});
		console.log('JWT token created');

		// Create response with redirect - use the request origin
		const baseUrl = req.nextUrl.origin;
		const res = NextResponse.redirect(new URL(redirectPath, baseUrl));

		// Set authentication cookie using buildAuthCookieOptions for consistent settings
		// Check if we're using HTTPS
		const isSecure = req.nextUrl.protocol === 'https:';
		res.cookies.set('token', token, buildAuthCookieOptions(req.nextUrl.hostname, 60 * 60 * 24 * 7, isSecure));

		console.log('Redirecting to:', redirectPath);
		console.log('Cookie set with token length:', token.length);
		console.log('Response headers:', Object.fromEntries(res.headers.entries()));
		return res;

	} catch (error) {
		console.error('OAuth callback error:', error);
		console.error('Error details:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});
		return NextResponse.redirect(new URL('/login?error=callback_failed', req.nextUrl.origin));
	}
}
