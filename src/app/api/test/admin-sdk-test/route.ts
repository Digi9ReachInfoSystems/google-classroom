import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
	try {
		console.log('=== Google Admin SDK Directory API Test ===');
		
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

		console.log('Testing Admin SDK with user:', payload.email);

		// Use service account for Admin SDK access (has proper permissions)
		try {
			const { getAdminDirectory } = await import('@/lib/google');
			const admin = getAdminDirectory();
			
			console.log('Admin SDK client created, fetching user data...');
			
			// Get user data with full projection to include custom schemas
			// Using the correct Google Admin SDK Directory API endpoint
			const userResponse = await admin.users.get({
				userKey: payload.email,
				projection: 'full'
			});
			
			console.log('User data fetched successfully');
			
			const userData = userResponse.data;
			const customSchemas = userData.customSchemas || {};
			
			// Extract TeacherProfile and StudentProfile
			const teacherProfile = customSchemas['TeacherProfile'] || null;
			const studentProfile = customSchemas['StudentProfile'] || null;
			
			console.log('Custom schemas found:', Object.keys(customSchemas));
			console.log('TeacherProfile:', teacherProfile);
			console.log('StudentProfile:', studentProfile);

			return NextResponse.json({
				success: true,
				message: 'Admin SDK Directory API test successful',
				user_email: payload.email,
				user_data: {
					id: userData.id,
					primaryEmail: userData.primaryEmail,
					name: userData.name,
					organizations: userData.organizations,
                                  department: (userData as any).department,
                                  title: (userData as any).title,
					location: (userData as any).location
				},
				custom_schemas: {
					available_schemas: Object.keys(customSchemas),
					full_custom_schemas: customSchemas,
					teacher_profile: teacherProfile,
					student_profile: studentProfile,
					has_teacher_profile: !!teacherProfile,
					has_student_profile: !!studentProfile
				},
				raw_response: userData
			});

		} catch (adminError: any) {
			console.error('Admin SDK error:', adminError);
			
			return NextResponse.json({
				success: false,
				message: 'Admin SDK Directory API test failed',
				error: {
					code: adminError.code,
					message: adminError.message,
					details: adminError.details || null
				},
				user_email: payload.email,
				possible_causes: [
					'User is not in a Google Workspace domain',
					'Missing admin.directory.user.readonly scope',
					'User does not have custom attributes defined',
					'Domain admin has not granted access to custom schemas'
				]
			}, { status: 500 });
		}

	} catch (error: any) {
		console.error('Admin SDK test error:', error);
		return NextResponse.json({
			message: 'Error in Admin SDK test',
			error: error.message
		}, { status: 500 });
	}
}
