import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient } from '@/lib/user-oauth';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
	try {
		console.log('=== OAuth Debug API ===');
		
		// Check authentication
		const token = req.cookies.get('token')?.value;
		if (!token) {
			return NextResponse.json({ message: 'No authentication token found' }, { status: 401 });
		}

		const payload = verifyAuthToken(token);
		if (!payload) {
			return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
		}

		console.log('JWT Payload:', {
			email: payload.email,
			role: payload.role,
			userId: payload.userId,
			hasAccessToken: !!payload.accessToken,
			hasRefreshToken: !!payload.refreshToken,
			accessTokenLength: payload.accessToken?.length || 0,
			refreshTokenLength: payload.refreshToken?.length || 0
		});

		if (!payload.accessToken) {
			return NextResponse.json({
				message: 'No OAuth tokens found in JWT',
				jwt_payload: payload
			}, { status: 401 });
		}

		// Create OAuth client
		const oauth2Client = createUserOAuthClient({
			access_token: payload.accessToken,
			refresh_token: payload.refreshToken
		});

		console.log('OAuth client created');

		// Test basic OAuth2 access
		let oauth2Test = null;
		try {
			const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
			const userInfo = await oauth2.userinfo.get();
			oauth2Test = {
				success: true,
				data: userInfo.data
			};
		} catch (error: any) {
			oauth2Test = {
				success: false,
				error: error.message,
				code: error.code
			};
		}

		// Test People API access
		let peopleApiTest = null;
		try {
			const people = google.people({ version: 'v1', auth: oauth2Client });
			
			// First try with minimal fields
			const basicResponse = await people.people.get({
				resourceName: 'people/me',
				personFields: 'names,emailAddresses'
			});
			
			// Then try with userDefined
			const userDefinedResponse = await people.people.get({
				resourceName: 'people/me',
				personFields: 'names,emailAddresses,userDefined'
			});
			
			peopleApiTest = {
				success: true,
				basic_response: basicResponse.data,
				userDefined_response: userDefinedResponse.data,
				userDefined_count: ((userDefinedResponse.data as any).userDefined || []).length,
				all_available_fields: Object.keys(userDefinedResponse.data)
			};
		} catch (error: any) {
			peopleApiTest = {
				success: false,
				error: error.message,
				code: error.code,
				details: error.details
			};
		}

		// Check token info
		let tokenInfo = null;
		try {
			const tokenResponse = await oauth2Client.getTokenInfo(oauth2Client.credentials.access_token!);
			tokenInfo = {
				audience: tokenResponse.audience,
				scope: tokenResponse.scope,
				expiry_date: tokenResponse.expiry_date,
				issued_to: tokenResponse.issued_to,
				user_id: tokenResponse.user_id,
				verified_email: tokenResponse.verified_email,
				access_type: tokenResponse.access_type
			};
		} catch (error: any) {
			tokenInfo = {
				error: error.message
			};
		}

		return NextResponse.json({
			message: 'OAuth Debug Results',
			timestamp: new Date().toISOString(),
			jwt_payload: {
				email: payload.email,
				role: payload.role,
				userId: payload.userId,
				hasAccessToken: !!payload.accessToken,
				hasRefreshToken: !!payload.refreshToken
			},
			oauth2_test: oauth2Test,
			people_api_test: peopleApiTest,
			token_info: tokenInfo,
			oauth_credentials: {
				has_access_token: !!oauth2Client.credentials.access_token,
				has_refresh_token: !!oauth2Client.credentials.refresh_token,
				access_token_preview: oauth2Client.credentials.access_token ? 
					`${oauth2Client.credentials.access_token.substring(0, 20)}...` : null,
				scope: oauth2Client.credentials.scope,
				expiry_date: oauth2Client.credentials.expiry_date
			}
		});

	} catch (error: any) {
		console.error('OAuth debug error:', error);
		return NextResponse.json({
			message: 'Error in OAuth debug',
			error: error.message,
			stack: error.stack
		}, { status: 500 });
	}
}
