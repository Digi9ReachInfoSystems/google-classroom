import { NextRequest, NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/google';

export async function GET(req: NextRequest) {
	try {
		console.log('=== Customer ID Test ===');
		
		// Get the customer ID dynamically
		const customerId = await getCustomerId();
		
		return NextResponse.json({
			success: true,
			message: 'Customer ID retrieved successfully',
			customer_id: customerId,
			note: 'This should be your actual Google Workspace customer ID instead of "my_customer"'
		});

	} catch (error: any) {
		console.error('Customer ID test error:', error);
		return NextResponse.json({
			success: false,
			message: 'Error retrieving customer ID',
			error: error.message
		}, { status: 500 });
	}
}
