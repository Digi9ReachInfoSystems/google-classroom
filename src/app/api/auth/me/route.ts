import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
	try {
		const token = req.cookies.get('token')?.value;
		
		if (!token) {
			return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
		}

		const payload = verifyAuthToken(token);
		if (!payload) {
			return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
		}

		// Return user info from JWT token (no MongoDB dependency)
		return NextResponse.json({
			user: {
				email: payload.email,
				role: payload.role,
				userId: payload.userId
			}
		});

	} catch (error) {
		console.error('Get user info error:', error);
		return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
	}
}
