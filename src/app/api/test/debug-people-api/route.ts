import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient } from '@/lib/user-oauth';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
	try {
		console.log('=== Debug People API ===');
		
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
				message: 'No OAuth tokens found in JWT'
			}, { status: 401 });
		}

		console.log('User info:', {
			email: payload.email,
			role: payload.role,
			hasAccessToken: !!payload.accessToken,
			hasRefreshToken: !!payload.refreshToken
		});

		// Create OAuth client and fetch profile
		const oauth2Client = createUserOAuthClient({
			access_token: payload.accessToken,
			refresh_token: payload.refreshToken
		});

		console.log('OAuth client created successfully');

		const people = google.people({ version: 'v1', auth: oauth2Client });

		// Try different field combinations to see what's available
		const fieldTests = [
			{
				name: 'Basic fields',
				fields: 'names,emailAddresses'
			},
			{
				name: 'With userDefined',
				fields: 'names,emailAddresses,userDefined'
			},
			{
				name: 'All available fields',
				fields: 'names,emailAddresses,photos,organizations,phoneNumbers,addresses,userDefined,metadata'
			},
			{
				name: 'Extended fields',
				fields: 'names,emailAddresses,photos,organizations,phoneNumbers,addresses,birthdays,ageRanges,biographies,coverPhotos,locales,metadata,userDefined,relations,interests,skills,braggingRights,occupations'
			}
		];

		const results = [];

		for (const test of fieldTests) {
			try {
				console.log(`Testing ${test.name}...`);
				const response = await people.people.get({
					resourceName: 'people/me',
					personFields: test.fields
				});
				
				const data = response.data;
				const userDefined = (data as any).userDefined || [];
				
				results.push({
					test_name: test.name,
					fields_requested: test.fields,
					success: true,
					userDefined_count: userDefined.length,
					userDefined_data: userDefined,
					all_fields_returned: Object.keys(data),
					raw_response: data
				});
				
				console.log(`${test.name} - UserDefined count: ${userDefined.length}`);
				
			} catch (error: any) {
				console.log(`${test.name} failed:`, error.message);
				results.push({
					test_name: test.name,
					fields_requested: test.fields,
					success: false,
					error: error.message,
					error_code: error.code
				});
			}
		}

		// Also try to get the person's resource name and check if it's accessible
		let personInfo = null;
		try {
			console.log('Getting person resource info...');
			const response = await people.people.get({
				resourceName: 'people/me',
				personFields: 'metadata'
			});
			
			personInfo = {
				resourceName: response.data.resourceName,
				metadata: (response.data as any).metadata,
				etag: response.data.etag
			};
		} catch (error: any) {
			personInfo = {
				error: error.message,
				code: error.code
			};
		}

		return NextResponse.json({
			message: 'People API Debug Results',
			user: {
				email: payload.email,
				role: payload.role
			},
			oauth_tokens: {
				has_access_token: !!payload.accessToken,
				has_refresh_token: !!payload.refreshToken,
				access_token_preview: payload.accessToken ? `${payload.accessToken.substring(0, 20)}...` : null
			},
			person_info: personInfo,
			field_tests: results,
			summary: {
				total_tests: results.length,
				successful_tests: results.filter(r => r.success).length,
				userDefined_found: results.some(r => r.success && r.userDefined_count > 0)
			}
		});

	} catch (error: any) {
		console.error('Debug People API error:', error);
		return NextResponse.json({
			message: 'Error in debug API',
			error: error.message,
			stack: error.stack
		}, { status: 500 });
	}
}
