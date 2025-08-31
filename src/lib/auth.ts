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
	username: string;
	role: 'admin';
}

export function signAuthToken(payload: AuthTokenPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
	} catch {
		return null;
	}
}
