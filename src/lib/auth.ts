import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME as string;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;

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

type CookieOptions = {
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'none';
        path?: string;
        maxAge?: number;
        domain?: string;
};

function deriveCookieDomain(hostname?: string): string | undefined {
        if (AUTH_COOKIE_DOMAIN) {
                return AUTH_COOKIE_DOMAIN;
        }

        if (!hostname) {
                return undefined;
        }

        const lowerHost = hostname.toLowerCase();

        // Skip localhost or IP addresses, they should remain host-only cookies
        if (lowerHost === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(lowerHost)) {
                return undefined;
        }

        const hostParts = lowerHost.split('.');

        if (hostParts.length === 2) {
                // Already an apex domain (e.g. example.com)
                return lowerHost;
        }

        if (hostParts.length === 3 && hostParts[hostParts.length - 2].length > 3) {
                // Common subdomain pattern (e.g. app.example.com)
                return hostParts.slice(-2).join('.');
        }

        return undefined;
}

export function buildAuthCookieOptions(hostname?: string, maxAge = 60 * 60 * 24 * 7, isSecure = false): CookieOptions {
        const options: CookieOptions = {
                httpOnly: true,
                secure: isSecure,
                sameSite: 'none',
                path: '/',
                maxAge,
        };

        const domain = deriveCookieDomain(hostname);
        console.log('[Cookie Debug] hostname:', hostname, 'derived domain:', domain, 'isSecure:', isSecure);
        
        // Don't set domain for now - use host-only cookies to avoid subdomain issues
        // if (domain) {
        //         options.domain = domain;
        // }

        return options;
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
