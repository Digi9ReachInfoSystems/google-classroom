import { NextResponse } from 'next/server';
import { getGoogleAuthURL } from '@/lib/google-oauth';

export async function GET() {
	try {
		const authUrl = getGoogleAuthURL();
		return NextResponse.json({ authUrl });
	} catch (error) {
		console.error('Error generating Google auth URL:', error);
		return NextResponse.json({ 
			error: 'Failed to generate Google auth URL' 
		}, { status: 500 });
	}
}
