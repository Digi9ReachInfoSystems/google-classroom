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

		// Helper to get proper origin
		const getOrigin = (req: NextRequest) => {
			const forwardedHost = req.headers.get('x-forwarded-host');
			const forwardedProto = req.headers.get('x-forwarded-proto');
			if (forwardedHost) {
				return `${forwardedProto || 'https'}://${forwardedHost}`;
			}
			return req.nextUrl.origin;
		};

		if (error) {
			console.error('OAuth error:', error);
			return NextResponse.redirect(new URL('/login?error=oauth_denied', getOrigin(req)));
		}

		if (!code) {
			return NextResponse.redirect(new URL('/login?error=no_code', getOrigin(req)));
		}

		console.log('OAuth callback received code:', code);
		console.log('OAuth state parameter:', state);
		console.log('[OAuth Callback] Request headers:', {
			host: req.headers.get('host'),
			'x-forwarded-host': req.headers.get('x-forwarded-host'),
			'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
			'x-forwarded-for': req.headers.get('x-forwarded-for'),
			origin: req.headers.get('origin'),
			referer: req.headers.get('referer')
		});

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

		// Create response with redirect - detect proper origin
		// Check X-Forwarded headers first (for proxies/load balancers)
		const forwardedHost = req.headers.get('x-forwarded-host');
		const forwardedProto = req.headers.get('x-forwarded-proto');
		
		let baseUrl: string;
		if (forwardedHost) {
			const protocol = forwardedProto || 'https';
			baseUrl = `${protocol}://${forwardedHost}`;
			console.log('[OAuth Callback] Using forwarded headers:', { forwardedHost, forwardedProto, baseUrl });
		} else {
			baseUrl = req.nextUrl.origin;
			console.log('[OAuth Callback] Using nextUrl.origin:', baseUrl);
		}
		
		console.log('[OAuth Callback] Final redirect base URL:', baseUrl);
		const res = NextResponse.redirect(new URL(redirectPath, baseUrl));

		// Set authentication cookie using buildAuthCookieOptions for consistent settings
		// Use forwarded host/proto if available (for proxies)
		const hostname = forwardedHost || req.nextUrl.hostname;
		const protocol = forwardedProto || req.nextUrl.protocol;
		const isSecure = protocol === 'https' || protocol === 'https:';
		const cookieOptions = buildAuthCookieOptions(hostname, 60 * 60 * 24 * 7, isSecure);
		
		console.log('[OAuth Callback] Setting cookie with options:', cookieOptions);
		console.log('[OAuth Callback] Hostname for cookie:', hostname);
		console.log('[OAuth Callback] Protocol for cookie:', protocol);
		console.log('[OAuth Callback] Is secure:', isSecure);
		console.log('[OAuth Callback] Redirect path:', redirectPath);
		console.log('[OAuth Callback] Token length:', token.length);
		
		res.cookies.set('token', token, cookieOptions);
		
		// Also log what cookies are being set
		const setCookieHeader = res.headers.get('set-cookie');
		console.log('[OAuth Callback] Set-Cookie header:', setCookieHeader);
		
		return res;

	} catch (error) {
		console.error('OAuth callback error:', error);
		console.error('Error details:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});
		
		// Helper to get proper origin
		const getOrigin = (req: NextRequest) => {
			const forwardedHost = req.headers.get('x-forwarded-host');
			const forwardedProto = req.headers.get('x-forwarded-proto');
			if (forwardedHost) {
				return `${forwardedProto || 'https'}://${forwardedHost}`;
			}
			return req.nextUrl.origin;
		};
		
		return NextResponse.redirect(new URL('/login?error=callback_failed', getOrigin(req)));
	}
}
