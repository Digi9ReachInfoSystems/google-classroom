import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient } from '@/lib/user-oauth';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
	try {
		console.log('=== User Profile Test API ===');
		
		// Check authentication
		const token = req.cookies.get('token')?.value;
		if (!token) {
			return NextResponse.json({ 
				success: false, 
				message: 'No authentication token found' 
			}, { status: 401 });
		}

		console.log('Token found, verifying...');
		const payload = verifyAuthToken(token);
		if (!payload) {
			return NextResponse.json({ 
				success: false, 
				message: 'Invalid or expired token' 
			}, { status: 401 });
		}

		console.log('Token verified successfully:', {
			email: payload.email,
			role: payload.role,
			userId: payload.userId,
			hasAccessToken: !!payload.accessToken,
			hasRefreshToken: !!payload.refreshToken
		});

		// Check if we have OAuth tokens
		if (!payload.accessToken) {
			return NextResponse.json({
				success: false,
				message: 'No OAuth tokens found in JWT',
				debug: {
					jwt_payload: payload
				}
			}, { status: 401 });
		}

		try {
			console.log('Creating OAuth client with user tokens...');
			
			// Create OAuth client with user's tokens
			const oauth2Client = createUserOAuthClient({
				access_token: payload.accessToken,
				refresh_token: payload.refreshToken
			});

			console.log('OAuth client created, fetching user profile...');

			// Create OAuth2 instance to get user profile
			const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
			
			// Get user profile information
			const profileResponse = await oauth2.userinfo.get();
			const profile = profileResponse.data;

			console.log('Profile fetched successfully:', {
				id: profile.id,
				email: profile.email,
				name: profile.name,
				given_name: profile.given_name,
				family_name: profile.family_name,
				verified_email: profile.verified_email
			});

			// Also try to get additional profile info if available
			let additionalInfo = {};
			try {
				// Try to get more detailed profile information including custom attributes
				const people = google.people({ version: 'v1', auth: oauth2Client });
				const peopleResponse = await people.people.get({
					resourceName: 'people/me',
					personFields: 'names,emailAddresses,photos,organizations,phoneNumbers,addresses,userDefined,metadata'
				});
				
				additionalInfo = {
					detailed_profile: peopleResponse.data,
					people_api_available: true,
					user_defined_fields: (peopleResponse.data as any).userDefined || []
				};
				console.log('Additional profile info fetched from People API');
				console.log('User defined fields found:', (peopleResponse.data as any).userDefined?.length || 0);
                  } catch (peopleError: any) {
                          console.log('People API not available or failed:', peopleError.message);
                          additionalInfo = {
                                  people_api_available: false,
                                  people_api_error: peopleError.message
				};
			}

			const responseData = {
				success: true,
				message: 'User profile data retrieved successfully',
				timestamp: new Date().toISOString(),
				jwt_payload: payload,
				oauth_tokens: {
					has_access_token: !!payload.accessToken,
					has_refresh_token: !!payload.refreshToken,
					access_token_preview: payload.accessToken ? `${payload.accessToken.substring(0, 20)}...` : null
				},
				google_profile: {
					id: profile.id,
					email: profile.email,
					verified_email: profile.verified_email,
					name: profile.name,
					given_name: profile.given_name,
					family_name: profile.family_name,
					picture: profile.picture,
					locale: profile.locale,
					hd: profile.hd, // Hosted domain (for G Suite accounts)
					link: profile.link
				},
				profile_display_options: {
					primary_name: profile.name,
					first_name: profile.given_name,
					last_name: profile.family_name,
					email_username: profile.email ? profile.email.split('@')[0] : null,
					capitalized_username: profile.email ? 
						profile.email.split('@')[0].charAt(0).toUpperCase() + profile.email.split('@')[0].slice(1) : null
				},
				...additionalInfo
			};

			return NextResponse.json(responseData, { status: 200 });

		} catch (googleError: any) {
			console.error('Google API error:', googleError);
			
			return NextResponse.json({
				success: false,
				message: 'Failed to fetch profile from Google',
				error: {
					code: googleError.code,
					message: googleError.message,
					details: googleError.details || null
				},
				debug: {
					jwt_payload: payload,
					has_oauth_tokens: !!payload.accessToken
				}
			}, { status: 500 });
		}

	} catch (error: any) {
		console.error('User profile test API error:', error);
		return NextResponse.json({
			success: false,
			message: 'Internal server error',
			error: error.message,
			stack: error.stack
		}, { status: 500 });
	}
}
