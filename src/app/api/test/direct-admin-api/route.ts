import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
	try {
		console.log('=== Direct Admin SDK API Test ===');
		
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

		// Use service account for Admin SDK access (has proper permissions)
		const { getAdminDirectory } = await import('@/lib/google');
		const admin = getAdminDirectory();

		try {
			console.log(`Making direct API call to: GET https://admin.googleapis.com/admin/directory/v1/users/${payload.email}?projection=full`);
			
			// Direct API call using the exact endpoint you mentioned
			const userResponse = await admin.users.get({
				userKey: payload.email,
				projection: 'full'
			});
			
			console.log('API call successful, processing response...');
			
			const userData = userResponse.data;
			const customSchemas = userData.customSchemas || {};
			
			// Log all available data for debugging
			console.log('Full user data keys:', Object.keys(userData));
			console.log('Custom schemas keys:', Object.keys(customSchemas));
			console.log('Raw custom schemas:', customSchemas);
			
			// Check for TeacherProfile and StudentProfile
			const teacherProfile = customSchemas['TeacherProfile'];
			const studentProfile = customSchemas['StudentProfile'];
			
			console.log('TeacherProfile found:', !!teacherProfile, teacherProfile);
			console.log('StudentProfile found:', !!studentProfile, studentProfile);

			return NextResponse.json({
				success: true,
				message: 'Direct Admin SDK API call successful',
				api_endpoint: `GET https://admin.googleapis.com/admin/directory/v1/users/${payload.email}?projection=full`,
				user_email: payload.email,
				response_data: {
					user_id: userData.id,
					primary_email: userData.primaryEmail,
					name: userData.name,
					custom_schemas: customSchemas,
					custom_schemas_keys: Object.keys(customSchemas),
					teacher_profile: teacherProfile,
					student_profile: studentProfile,
					has_teacher_profile: !!teacherProfile,
					has_student_profile: !!studentProfile
				},
				full_response: userData,
				debug_info: {
					total_response_keys: Object.keys(userData).length,
					custom_schemas_count: Object.keys(customSchemas).length,
					response_structure: {
						has_custom_schemas: 'customSchemas' in userData,
						custom_schemas_type: typeof userData.customSchemas,
						custom_schemas_value: userData.customSchemas
					}
				}
			});

		} catch (apiError: any) {
			console.error('Direct API call failed:', apiError);
			
			return NextResponse.json({
				success: false,
				message: 'Direct Admin SDK API call failed',
				api_endpoint: `GET https://admin.googleapis.com/admin/directory/v1/users/${payload.email}?projection=full`,
				error: {
					code: apiError.code,
					message: apiError.message,
					details: apiError.details || null,
					status: apiError.status
				},
				possible_causes: [
					'User not found in directory',
					'Insufficient permissions',
					'Custom schemas not assigned to user',
					'OAuth scope missing'
				]
			}, { status: 500 });
		}

	} catch (error: any) {
		console.error('Direct Admin SDK test error:', error);
		return NextResponse.json({
			message: 'Error in direct Admin SDK test',
			error: error.message
		}, { status: 500 });
	}
}
