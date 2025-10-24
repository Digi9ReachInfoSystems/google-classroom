import { google } from 'googleapis';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET as string;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI as string;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
	throw new Error('Missing Google OAuth environment variables');
}

// OAuth2 client for user authentication
export function getOAuth2Client() {
	return new google.auth.OAuth2(
		GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		GOOGLE_REDIRECT_URI
	);
}

// Generate Google OAuth URL
export function getGoogleAuthURL() {
	const oauth2Client = getOAuth2Client();
	
	const scopes = [
		'https://www.googleapis.com/auth/userinfo.email',
		'https://www.googleapis.com/auth/userinfo.profile',
		'https://www.googleapis.com/auth/classroom.courses.readonly',
		'https://www.googleapis.com/auth/classroom.rosters.readonly',
		'https://www.googleapis.com/auth/classroom.profile.emails',
		'https://www.googleapis.com/auth/classroom.announcements',
		'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
		'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
		'https://www.googleapis.com/auth/classroom.coursework.me',
		'https://www.googleapis.com/auth/classroom.coursework.students',
		'https://www.googleapis.com/auth/user.addresses.read',
		'https://www.googleapis.com/auth/user.phonenumbers.read',
		'https://www.googleapis.com/auth/user.birthday.read',
		'https://www.googleapis.com/auth/user.emails.read',
		'https://www.googleapis.com/auth/admin.directory.user.readonly'
	];

	return oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: scopes,
		prompt: 'consent', // Changed from 'select_account' to 'consent' to force refresh token
		include_granted_scopes: true
	});
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
	const oauth2Client = getOAuth2Client();
	
	try {
		console.log('Exchanging code for tokens...');
		const { tokens } = await oauth2Client.getToken(code);
		console.log('Tokens received:', { 
			hasAccessToken: !!tokens.access_token, 
			hasRefreshToken: !!tokens.refresh_token,
			tokenType: tokens.token_type 
		});
		
		oauth2Client.setCredentials(tokens);
		console.log('OAuth2 client credentials set');
		
		return { oauth2Client, tokens };
	} catch (error) {
		console.error('Error getting tokens:', error);
		throw new Error('Failed to exchange authorization code for tokens');
	}
}

// Get user info from Google
export async function getUserInfo(oauth2Client: any) {
	try {
		const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
		const userInfo = await oauth2.userinfo.get();
		
		return {
			email: userInfo.data.email,
			name: userInfo.data.name,
			picture: userInfo.data.picture,
			verified_email: userInfo.data.verified_email
		};
	} catch (error) {
		console.error('Error getting user info:', error);
		throw new Error('Failed to get user information');
	}
}
