import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
	const token = req.cookies.get('token')?.value;
	const jwtSecret = process.env.JWT_SECRET;
	
	let decoded: any = null;
	let verified: any = null;
	let error: string | null = null;
	
	if (token && jwtSecret) {
		try {
			decoded = jwt.decode(token);
		} catch (e) {
			error = `Decode error: ${e}`;
		}
		
		try {
			verified = jwt.verify(token, jwtSecret);
		} catch (e) {
			error = error ? `${error}; Verify error: ${e}` : `Verify error: ${e}`;
		}
	}
	
	return NextResponse.json({
		hasToken: !!token,
		tokenLength: token?.length,
		tokenFirst50: token?.substring(0, 50),
		jwtSecretLength: jwtSecret?.length,
		jwtSecretValue: jwtSecret, // Show actual value
		jwtSecretFirst10: jwtSecret?.substring(0, 10),
		decoded,
		verified,
		error,
		envCheck: {
			hasJWT_SECRET: !!process.env.JWT_SECRET,
			jwtSecretRaw: JSON.stringify(process.env.JWT_SECRET)
		}
	});
}

