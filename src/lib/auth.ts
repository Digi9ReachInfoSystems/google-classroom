import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME as string;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;

if (!JWT_SECRET) {
	throw new Error('Please define JWT_SECRET in .env.local');
}

export function verifyStaticCredentials(username: string, password: string): boolean {
	return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export interface AuthTokenPayload {
	email: string;
	role: 'student' | 'teacher' | 'district-admin' | 'super-admin';
	userId?: string;
	accessToken?: string;
	refreshToken?: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function getRoleBasedRedirect(role: string): string {
	switch (role) {
		case 'student':
			return '/student/dashboard';
		case 'teacher':
			return '/teacher/dashboard';
		case 'district-admin':
			return '/districtadmin/overview';
		case 'super-admin':
			return '/superadmin/overview';
		default:
			return '/dashboard';
	}
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
	} catch {
		return null;
	}
}
