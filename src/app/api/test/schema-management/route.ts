import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
	try {
		console.log('=== Schema Management Test ===');
		
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

		// Step 1: List all custom schemas in the domain
		let schemasResult = null;
		try {
			console.log('Fetching custom schemas...');
			const schemasResponse = await admin.schemas.list({
				customerId: customerId
			});
			
			const allSchemas = schemasResponse.data.schemas || [];
			const customSchemas = allSchemas.filter((schema: any) => 
				schema.schemaName && 
				(schema.schemaName === 'TeacherProfile' || schema.schemaName === 'StudentProfile')
			);

			schemasResult = {
				success: true,
				total_schemas: allSchemas.length,
				custom_schemas: customSchemas,
				all_schemas: allSchemas.map((s: any) => ({
					schemaId: s.schemaId,
					schemaName: s.schemaName,
					displayName: s.displayName,
					fields: s.fields?.map((f: any) => ({
						fieldName: f.fieldName,
						fieldType: f.fieldType,
						displayName: f.displayName
					})) || []
				}))
			};
		} catch (error: any) {
			schemasResult = {
				success: false,
				error: error.message
			};
		}

		// Step 2: Check current user's custom schemas
		let userSchemasResult = null;
		try {
			console.log('Checking user custom schemas...');
			const userResponse = await admin.users.get({
				userKey: payload.email,
				projection: 'full'
			});
			
			userSchemasResult = {
				success: true,
				custom_schemas: userResponse.data.customSchemas || {},
				custom_schemas_keys: Object.keys(userResponse.data.customSchemas || {}),
				has_custom_schemas: Object.keys(userResponse.data.customSchemas || {}).length > 0
			};
		} catch (error: any) {
			userSchemasResult = {
				success: false,
				error: error.message
			};
		}

		// Step 3: Try to update user with test custom schema values (if schemas exist)
		let updateResult = null;
		if (schemasResult.success && schemasResult.custom_schemas.length > 0) {
			try {
				console.log('Attempting to update user with custom schema values...');
				
				// Try to update the user with custom schema values
				const updateResponse = await admin.users.update({
					userKey: payload.email,
					requestBody: {
						customSchemas: {
							TeacherProfile: {
								schoolname: "Test School",
								district: "Test District"
							},
							StudentProfile: {
								gender: "Male",
								grade: "12",
								schoolname: "Test School",
								district: "Test District",
								age: "17",
								disability: "None"
							}
						}
					}
				});
				
				updateResult = {
					success: true,
					message: 'Successfully updated user with custom schema values',
					updated_custom_schemas: updateResponse.data.customSchemas || {}
				};
			} catch (error: any) {
				updateResult = {
					success: false,
					error: error.message,
					code: error.code,
					message: 'Failed to update user with custom schema values'
				};
			}
		}

		return NextResponse.json({
			message: 'Schema management test results',
			user_email: payload.email,
			customer_id: customerId,
			schemas_check: schemasResult,
			user_schemas_check: userSchemasResult,
			update_attempt: updateResult,
			recommendations: {
				if_no_schemas: "Custom schemas don't exist. Create them in Google Admin Console → Directory → Users → Manage custom attributes",
				if_schemas_exist_but_empty: "Custom schemas exist but aren't assigned to user. Assign values in Admin Console → Users → Select User → Custom Attributes",
				if_update_successful: "Custom schemas were successfully assigned to user. Test the profile API again.",
				if_update_failed: "Unable to assign custom schemas programmatically. Use Google Admin Console to assign values manually."
			}
		});

	} catch (error: any) {
		console.error('Schema management test error:', error);
		return NextResponse.json({
			message: 'Error in schema management test',
			error: error.message
		}, { status: 500 });
	}
}
