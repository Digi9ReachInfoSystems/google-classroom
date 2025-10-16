import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

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

		// Use service account for Admin SDK access (has proper permissions)
		const { getAdminDirectory, getCustomerId } = await import('@/lib/google');
		const admin = getAdminDirectory();

		// Get the actual customer ID dynamically
		const customerId = await getCustomerId();
		console.log('Using customer ID:', customerId);

		// Try to list all schemas in the domain
		try {
			const schemaResponse = await admin.schemas.list({
				customerId: customerId
			});
			
			const schemas = schemaResponse.data.schemas || [];
			
			// Filter for custom schemas
			const customSchemas = schemas.filter((schema: any) => 
				schema.schemaName && 
				(schema.schemaName === 'TeacherProfile' || schema.schemaName === 'StudentProfile')
			);

			return NextResponse.json({
				success: true,
				message: 'Schema check completed',
				user_email: payload.email,
				total_schemas: schemas.length,
				all_schemas: schemas.map((s: any) => ({
					schemaId: s.schemaId,
					schemaName: s.schemaName,
					displayName: s.displayName,
					fields: s.fields?.map((f: any) => ({
						fieldName: f.fieldName,
						fieldType: f.fieldType,
						displayName: f.displayName
					})) || []
				})),
				custom_schemas_found: customSchemas.map((s: any) => ({
					schemaId: s.schemaId,
					schemaName: s.schemaName,
					displayName: s.displayName,
					fields: s.fields?.map((f: any) => ({
						fieldName: f.fieldName,
						fieldType: f.fieldType,
						displayName: f.displayName
					})) || []
				})),
				teacher_profile_exists: customSchemas.some((s: any) => s.schemaName === 'TeacherProfile'),
				student_profile_exists: customSchemas.some((s: any) => s.schemaName === 'StudentProfile')
			});

		} catch (error: any) {
			return NextResponse.json({
				success: false,
				message: 'Failed to list schemas',
				error: error.message,
				code: error.code,
				details: error.details
			}, { status: 500 });
		}

	} catch (error: any) {
		console.error('Check schemas error:', error);
		return NextResponse.json({
			message: 'Error checking schemas',
			error: error.message
		}, { status: 500 });
	}
}
