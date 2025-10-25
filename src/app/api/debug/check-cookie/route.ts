import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
	try {
		const allCookies = req.cookies.getAll();
		const token = req.cookies.get('token')?.value;
		
		let tokenPayload = null;
		if (token) {
			tokenPayload = verifyAuthToken(token);
		}
		
		return NextResponse.json({
			success: true,
			hostname: req.nextUrl.hostname,
			protocol: req.nextUrl.protocol,
			origin: req.nextUrl.origin,
			cookies: {
				all: allCookies,
				token: token ? {
					exists: true,
					length: token.length,
					first50: token.substring(0, 50),
					valid: !!tokenPayload,
					payload: tokenPayload
				} : {
					exists: false
				}
			},
			headers: {
				cookie: req.headers.get('cookie'),
				host: req.headers.get('host'),
				origin: req.headers.get('origin'),
				referer: req.headers.get('referer')
			}
		});
	} catch (error) {
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}

