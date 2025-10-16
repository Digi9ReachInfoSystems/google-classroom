import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient } from '@/lib/user-oauth';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
	try {
		// Check authentication
		const token = req.cookies.get('token')?.value;
		if (!token) {
			return NextResponse.json({ message: 'No authentication token found' }, { status: 401 });
		}

		const payload = verifyAuthToken(token);
		if (!payload) {
			return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
		}

		if (!payload.accessToken) {
			return NextResponse.json({
				message: 'No OAuth tokens found in JWT',
				jwt_payload: payload
			}, { status: 401 });
		}

		// Create OAuth client and fetch profile
		const oauth2Client = createUserOAuthClient({
			access_token: payload.accessToken,
			refresh_token: payload.refreshToken
		});

		const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
		const profileResponse = await oauth2.userinfo.get();
		const profile = profileResponse.data;

		// Try to get additional info from People API including custom attributes
		let peopleData = null;
		try {
			const people = google.people({ version: 'v1', auth: oauth2Client });
			const peopleResponse = await people.people.get({
				resourceName: 'people/me',
				personFields: 'names,emailAddresses,photos,organizations,phoneNumbers,addresses,birthdays,ageRanges,biographies,coverPhotos,locales,metadata,userDefined,relations,interests,skills,braggingRights,occupations'
			});
			peopleData = peopleResponse.data;
          } catch (peopleError: any) {
                  peopleData = { error: peopleError.message };
		}

		// Return all raw data
		return NextResponse.json({
			message: 'All user profile data (raw format)',
			timestamp: new Date().toISOString(),
			jwt_payload: payload,
			google_oauth2_profile: profile,
			google_people_api_data: peopleData,
			display_options: {
				primary_name: profile.name,
				first_name: profile.given_name,
				last_name: profile.family_name,
				email: profile.email,
				email_username: profile.email?.split('@')[0],
				capitalized_username: profile.email ? 
					profile.email.split('@')[0].charAt(0).toUpperCase() + profile.email.split('@')[0].slice(1) : null,
				picture_url: profile.picture,
				verified_email: profile.verified_email,
				locale: profile.locale,
				hosted_domain: profile.hd
			}
		});

	} catch (error: any) {
		console.error('User profile raw API error:', error);
		return NextResponse.json({
			message: 'Error fetching user profile data',
			error: error.message,
			details: error
		}, { status: 500 });
	}
}
