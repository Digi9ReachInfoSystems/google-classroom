import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
	try {
		console.log('=== Debug Custom Schemas ===');
		
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

		// Test different approaches to get custom schemas
		const results = [];

		// 1. Try to get user with full projection
		try {
			console.log('Testing full projection...');
			const userResponse = await admin.users.get({
				userKey: payload.email,
				projection: 'full'
			});
			
			results.push({
				test: 'full_projection',
				success: true,
				customSchemas: userResponse.data.customSchemas || {},
				customSchemasKeys: Object.keys(userResponse.data.customSchemas || {}),
				rawResponse: userResponse.data
			});
		} catch (error: any) {
			results.push({
				test: 'full_projection',
				success: false,
				error: error.message
			});
		}

		// 2. Try to get user with custom projection
		try {
			console.log('Testing custom projection...');
			const userResponse = await admin.users.get({
				userKey: payload.email,
				projection: 'custom'
			});
			
			results.push({
				test: 'custom_projection',
				success: true,
				customSchemas: userResponse.data.customSchemas || {},
				customSchemasKeys: Object.keys(userResponse.data.customSchemas || {}),
				rawResponse: userResponse.data
			});
		} catch (error: any) {
			results.push({
				test: 'custom_projection',
				success: false,
				error: error.message
			});
		}

		// 3. Try to list custom schemas for the domain
		try {
			console.log('Testing schema list...');
			const schemaResponse = await admin.schemas.list({
				customerId: 'my_customer'
			});
			
			results.push({
				test: 'schema_list',
				success: true,
				schemas: schemaResponse.data.schemas || [],
				schemaCount: (schemaResponse.data.schemas || []).length
			});
		} catch (error: any) {
			results.push({
				test: 'schema_list',
				success: false,
				error: error.message
			});
		}

		// 4. Try to get user with basic projection
		try {
			console.log('Testing basic projection...');
			const userResponse = await admin.users.get({
				userKey: payload.email,
				projection: 'basic'
			});
			
			results.push({
				test: 'basic_projection',
				success: true,
				hasCustomSchemas: !!userResponse.data.customSchemas,
				customSchemas: userResponse.data.customSchemas || {},
				rawResponse: userResponse.data
			});
		} catch (error: any) {
			results.push({
				test: 'basic_projection',
				success: false,
				error: error.message
			});
		}

		// 5. Try to get user without projection parameter
		try {
			console.log('Testing no projection...');
			const userResponse = await admin.users.get({
				userKey: payload.email
			});
			
			results.push({
				test: 'no_projection',
				success: true,
				hasCustomSchemas: !!userResponse.data.customSchemas,
				customSchemas: userResponse.data.customSchemas || {},
				rawResponse: userResponse.data
			});
		} catch (error: any) {
			results.push({
				test: 'no_projection',
				success: false,
				error: error.message
			});
		}

		return NextResponse.json({
			message: 'Custom schemas debug results',
			user_email: payload.email,
			tests: results,
			summary: {
				total_tests: results.length,
				successful_tests: results.filter(r => r.success).length,
				custom_schemas_found: results.some(r => r.success && r.customSchemasKeys && r.customSchemasKeys.length > 0),
				schema_list_available: results.find(r => r.test === 'schema_list')?.success || false
			}
		});

	} catch (error: any) {
		console.error('Debug custom schemas error:', error);
		return NextResponse.json({
			message: 'Error in custom schemas debug',
			error: error.message
		}, { status: 500 });
	}
}
