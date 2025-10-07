import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient } from '@/lib/user-oauth';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
	try {
		console.log('=== Custom Attributes Test API ===');
		
		// Check authentication
		const token = req.cookies.get('token')?.value;
		if (!token) {
			return NextResponse.json({ 
				success: false, 
				message: 'No authentication token found' 
			}, { status: 401 });
		}

		const payload = verifyAuthToken(token);
		if (!payload) {
			return NextResponse.json({ 
				success: false, 
				message: 'Invalid or expired token' 
			}, { status: 401 });
		}

		if (!payload.accessToken) {
			return NextResponse.json({
				success: false,
				message: 'No OAuth tokens found in JWT'
			}, { status: 401 });
		}

		// Create OAuth client
		const oauth2Client = createUserOAuthClient({
			access_token: payload.accessToken,
			refresh_token: payload.refreshToken
		});

		try {
			// Fetch custom attributes from People API
			const people = google.people({ version: 'v1', auth: oauth2Client });
			const peopleResponse = await people.people.get({
				resourceName: 'people/me',
				personFields: 'userDefined,metadata,names,emailAddresses'
			});
			
			const personData = peopleResponse.data;
			const userDefined = (personData as any).userDefined || [];

			console.log(`Found ${userDefined.length} user defined fields`);

			// Process user defined fields (these contain our custom attributes)
			const processedUserDefined = userDefined.map((field: any) => ({
				key: field.key,
				value: field.value,
				metadata: field.metadata,
				source: field.source || 'unknown'
			}));

			// Create a lookup object for easy access
			const userDefinedLookup: { [key: string]: any } = {};
			processedUserDefined.forEach((field: any) => {
				userDefinedLookup[field.key] = field.value;
			});

			// Extract TeacherProfile and StudentProfile if they exist
			const teacherProfile = userDefinedLookup['TeacherProfile'];
			const studentProfile = userDefinedLookup['StudentProfile'];

			// Parse nested profile data
			let parsedTeacherProfile = null;
			let parsedStudentProfile = null;

			if (teacherProfile) {
				try {
					// Try to parse as JSON if it's a string
					parsedTeacherProfile = typeof teacherProfile === 'string' ? JSON.parse(teacherProfile) : teacherProfile;
				} catch (e) {
					parsedTeacherProfile = { raw_value: teacherProfile };
				}
			}

			if (studentProfile) {
				try {
					// Try to parse as JSON if it's a string
					parsedStudentProfile = typeof studentProfile === 'string' ? JSON.parse(studentProfile) : studentProfile;
				} catch (e) {
					parsedStudentProfile = { raw_value: studentProfile };
				}
			}

			return NextResponse.json({
				success: true,
				message: 'Custom attributes fetched successfully',
				timestamp: new Date().toISOString(),
				user_info: {
					email: payload.email,
					role: payload.role
				},
				profile_types: {
					teacher_profile: parsedTeacherProfile,
					student_profile: parsedStudentProfile,
					has_teacher_profile: !!teacherProfile,
					has_student_profile: !!studentProfile
				},
				user_defined_fields: {
					count: userDefined.length,
					raw: processedUserDefined,
					lookup: userDefinedLookup
				},
				all_attributes_combined: userDefinedLookup,
				metadata: personData.metadata || {},
				raw_response: {
					userDefined: userDefined
				}
			});

		} catch (googleError: any) {
			console.error('Google People API error:', googleError);
			
			return NextResponse.json({
				success: false,
				message: 'Failed to fetch custom attributes from Google People API',
				error: {
					code: googleError.code,
					message: googleError.message,
					details: googleError.details || null
				}
			}, { status: 500 });
		}

	} catch (error: any) {
		console.error('Custom attributes test API error:', error);
		return NextResponse.json({
			success: false,
			message: 'Internal server error',
			error: error.message
		}, { status: 500 });
	}
}
