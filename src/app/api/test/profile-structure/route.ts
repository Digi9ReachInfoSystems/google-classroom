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
				message: 'No OAuth tokens found in JWT'
			}, { status: 401 });
		}

		// Create OAuth client and fetch profile
		const oauth2Client = createUserOAuthClient({
			access_token: payload.accessToken,
			refresh_token: payload.refreshToken
		});

		const people = google.people({ version: 'v1', auth: oauth2Client });
		const peopleResponse = await people.people.get({
			resourceName: 'people/me',
			personFields: 'userDefined,names,emailAddresses'
		});
		
		const personData = peopleResponse.data;
		const userDefined = (personData as any).userDefined || [];

		// Create lookup for easy access
		const allAttributes: { [key: string]: any } = {};
		userDefined.forEach((field: any) => allAttributes[field.key] = field.value);

		// Extract and parse TeacherProfile and StudentProfile
		const teacherProfileRaw = allAttributes['TeacherProfile'];
		const studentProfileRaw = allAttributes['StudentProfile'];

		let teacherProfile = null;
		let studentProfile = null;

		if (teacherProfileRaw) {
			try {
				teacherProfile = typeof teacherProfileRaw === 'string' ? JSON.parse(teacherProfileRaw) : teacherProfileRaw;
			} catch (e) {
				teacherProfile = { raw_value: teacherProfileRaw };
			}
		}

		if (studentProfileRaw) {
			try {
				studentProfile = typeof studentProfileRaw === 'string' ? JSON.parse(studentProfileRaw) : studentProfileRaw;
			} catch (e) {
				studentProfile = { raw_value: studentProfileRaw };
			}
		}

		return NextResponse.json({
			message: 'Profile structure breakdown for TeacherProfile and StudentProfile',
			user: {
				email: payload.email,
				role: payload.role
			},
			available_user_defined_fields: Object.keys(allAttributes),
			teacher_profile: {
				exists: !!teacherProfile,
				raw_value: teacherProfileRaw,
				parsed_data: teacherProfile,
				expected_fields: ['schoolname', 'district'],
				available_fields: teacherProfile ? Object.keys(teacherProfile) : []
			},
			student_profile: {
				exists: !!studentProfile,
				raw_value: studentProfileRaw,
				parsed_data: studentProfile,
				expected_fields: ['gender', 'grade', 'schoolname', 'district', 'age', 'disability'],
				available_fields: studentProfile ? Object.keys(studentProfile) : []
			},
			all_user_defined_data: allAttributes,
			raw_user_defined_response: userDefined
		});

	} catch (error: any) {
		console.error('Profile structure API error:', error);
		return NextResponse.json({
			message: 'Error fetching profile structure',
			error: error.message
		}, { status: 500 });
	}
}
