import { NextRequest, NextResponse } from 'next/server';
import { buildAuthCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
        const res = NextResponse.json({ success: true });

        // Clear the authentication cookie
        const options = buildAuthCookieOptions(req.nextUrl.hostname, 0);
        res.cookies.set('token', '', options);

        return res;
}
