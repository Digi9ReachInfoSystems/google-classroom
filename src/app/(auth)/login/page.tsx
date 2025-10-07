"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState<string | null>(null);

	// Handle OAuth errors from URL parameters
	useEffect(() => {
		const errorParam = searchParams.get('error');
		const emailParam = searchParams.get('email');
		
		if (errorParam) {
			switch (errorParam) {
				case 'oauth_denied':
					setError('Google OAuth was denied. Please try again.');
					break;
				case 'no_code':
					setError('No authorization code received from Google.');
					break;
				case 'user_not_found':
					setError('User not found. Please contact your administrator to be added to the system.');
					break;
				case 'user_not_synced':
					setError(`User ${emailParam} not found in the system. Please contact your administrator to sync users from Google Classroom first.`);
					break;
				case 'callback_failed':
					setError('OAuth callback failed. Please try again.');
					break;
				default:
					setError('An error occurred during authentication.');
			}
		}
	}, [searchParams]);

	async function handleGoogleLogin() {
		setError(null);
		setSuccess(null);
		setLoading(true);
		
		try {
			console.log('Getting Google OAuth URL...');
			
			// Get Google OAuth URL
			const res = await fetch('/api/auth/google-url');
			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to get Google auth URL');
			}

			console.log('Redirecting to Google OAuth:', data.authUrl);
			
			// Redirect to Google OAuth
			window.location.href = data.authUrl;
			
		} catch (err) {
			console.error('Google OAuth error:', err);
			const message = err instanceof Error ? err.message : 'OAuth failed';
			setError(message);
			setLoading(false);
		}
	}


	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
				<div className="text-center">
					<h1 className="text-2xl font-semibold text-black mb-2">Google Classroom Analytics</h1>
					<p className="text-sm text-gray-600 mb-6">Sign in with your Google account</p>
				</div>
				
				{error && (
					<div className="bg-red-50 border border-red-200 rounded-md p-3">
						<p className="text-sm text-red-600">{error}</p>
					</div>
				)}

				{success && (
					<div className="bg-green-50 border border-green-200 rounded-md p-3">
						<p className="text-sm text-green-600">{success}</p>
					</div>
				)}

				<button
					onClick={handleGoogleLogin}
					disabled={loading}
					className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg py-3 px-4 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<svg className="w-5 h-5" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					<span className="text-gray-700 font-medium">
						{loading ? 'Signing in…' : 'Sign in with Google'}
					</span>
				</button>

				<div className="text-center">
					<p className="text-xs text-gray-500 mb-2">
						Access is restricted to authorized users only
					</p>
					<a 
						href="/static-login" 
						className="text-xs text-blue-600 hover:text-blue-800 underline"
					>
						Admin Login (District Admin / Super Admin)
					</a>
				</div>
			</div>
		</div>
	);
}
