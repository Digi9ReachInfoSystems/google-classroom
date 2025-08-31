"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
	const router = useRouter();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			});
			if (!res.ok) {
				const data = (await res.json()) as { message?: string };
				throw new Error(data.message || 'Login failed');
			}
			router.replace('/dashboard');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Login failed';
			setError(message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
			<form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
				<h1 className="text-xl font-semibold text-black">Sign in</h1>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<div className="space-y-2">
					<label className="block text-sm font-medium text-black">Username</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
						placeholder="admin"
						required
					/>
				</div>
				<div className="space-y-2">
					<label className="block text-sm font-medium text-black">Password</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
						placeholder="••••••••"
						required
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					className="w-full bg-black text-white rounded py-2 hover:opacity-90 disabled:opacity-50"
				>
					{loading ? 'Signing in…' : 'Sign in'}
				</button>
			</form>
		</div>
	);
}
