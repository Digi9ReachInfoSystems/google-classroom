import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient } from '@/lib/user-oauth';
import { google } from 'googleapis';

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

		// Check if we have OAuth tokens
		if (!payload.accessToken) {
			return NextResponse.json({ 
				success: false, 
				error: 'No OAuth tokens found. Please log in again.' 
			}, { status: 401 });
		}

		try {
			// Create OAuth client with user's tokens
			const oauth2Client = createUserOAuthClient({
				access_token: payload.accessToken,
				refresh_token: payload.refreshToken
			});

			// Create OAuth2 instance to get user profile
			const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
			
			// Get user profile information
			const profileResponse = await oauth2.userinfo.get();
			const profile = profileResponse.data;

			// Also try to get custom attributes from Google Admin SDK Directory API
			let additionalProfileData = {};
			let teacherProfile = null;
			let studentProfile = null;
			
		try {
			// Use service account for Admin SDK access (has proper permissions)
			const { getAdminDirectory } = await import('@/lib/google');
			const admin = getAdminDirectory();
			
			// Get user data from Admin SDK Directory API with full projection
			const userResponse = await admin.users.get({
				userKey: payload.email,
				projection: 'full'
			});
			
			const customSchemas = userResponse.data.customSchemas || {};
			
			// Extract TeacherProfile and StudentProfile from customSchemas
			teacherProfile = customSchemas['TeacherProfile'] || null;
			studentProfile = customSchemas['StudentProfile'] || null;
			
			console.log('Full user data response:', userResponse.data);
			console.log('Custom schemas found:', Object.keys(customSchemas));
			console.log('TeacherProfile:', teacherProfile);
			console.log('StudentProfile:', studentProfile);
			
			additionalProfileData = {
				customSchemas: customSchemas,
				teacherProfile: teacherProfile,
				studentProfile: studentProfile,
				hasTeacherProfile: !!teacherProfile,
				hasStudentProfile: !!studentProfile,
				fullUserData: userResponse.data
			};
		} catch (adminError: any) {
				console.warn('Could not fetch custom attributes from Admin SDK:', adminError.message);
				// Fallback to People API if Admin SDK fails
				try {
					const people = google.people({ version: 'v1', auth: oauth2Client });
					const peopleResponse = await people.people.get({
						resourceName: 'people/me',
						personFields: 'userDefined,metadata'
					});
					
					const userDefined = (peopleResponse.data as any).userDefined || [];
					
				// Create lookup for easy access
				const allAttributes: any = {};
				userDefined.forEach((field: any) => allAttributes[field.key] = field.value);
				
				// Extract TeacherProfile and StudentProfile
				const teacherProfileRaw = allAttributes['TeacherProfile'];
				const studentProfileRaw = allAttributes['StudentProfile'];
					
					// Parse nested profile data
					if (teacherProfileRaw) {
						try {
							teacherProfile = typeof teacherProfileRaw === 'string' ? JSON.parse(teacherProfileRaw) : teacherProfileRaw;
						} catch (e) {
							teacherProfile = { raw_value: teacherProfileRaw };
						}
					}
					
					if (studentProfileRaw) {
						try {
							studentProfile = typeof studentProfileRaw === 'string' ? JSON.parse(studentProfileRaw) : studentProfileRaw;
						} catch (e) {
							studentProfile = { raw_value: studentProfileRaw };
						}
					}
					
					additionalProfileData = {
						userDefined: userDefined,
						metadata: (peopleResponse.data as any).metadata || {},
						teacherProfile: teacherProfile,
						studentProfile: studentProfile,
						hasTeacherProfile: !!teacherProfile,
						hasStudentProfile: !!studentProfile
					};
			} catch (peopleError: any) {
				console.warn('Could not fetch from People API either:', peopleError?.message);
			}
			}

			return NextResponse.json({
				success: true,
				profile: {
					id: profile.id,
					email: profile.email,
					name: profile.name,
					given_name: profile.given_name,
					family_name: profile.family_name,
					picture: profile.picture,
					verified_email: profile.verified_email,
					locale: profile.locale,
					...additionalProfileData
				}
			});

		} catch (googleError: any) {
			console.error('Error fetching Google profile:', googleError);
			
			if (googleError.code === 403) {
				return NextResponse.json(
					{ success: false, error: 'Permission denied. Please check your Google OAuth permissions.' },
					{ status: 403 }
				);
			}
			
			return NextResponse.json(
				{ success: false, error: 'Failed to fetch profile from Google' },
				{ status: 500 }
			);
		}

	} catch (error) {
		console.error('Get user profile error:', error);
		return NextResponse.json({ 
			success: false, 
			message: 'Internal server error' 
		}, { status: 500 });
	}
}
