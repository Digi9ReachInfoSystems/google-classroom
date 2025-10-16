"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SyncResult {
	success: boolean;
	message?: string;
	users?: number;
	courses?: number;
	rosterMemberships?: number;
	userResult?: any;
	courseResult?: any;
	rosterResult?: any;
}

export default function SyncPage() {
	const router = useRouter();
	const [syncing, setSyncing] = useState(false);
	const [result, setResult] = useState<SyncResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleSyncCourses = async () => {
		setSyncing(true);
		setError(null);
		setResult(null);

		try {
			const res = await fetch('/api/sync/comprehensive', { 
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ syncType: 'courses' })
			});
			const data = await res.json();

			if (res.ok) {
				setResult({
					success: true,
					message: 'Courses synced successfully',
					courses: data.recordsSynced
				});
			} else {
				throw new Error(data.message || 'Failed to sync courses');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to sync courses');
		} finally {
			setSyncing(false);
		}
	};

	const handleSyncUsers = async () => {
		setSyncing(true);
		setError(null);
		setResult(null);

		try {
			const res = await fetch('/api/sync/comprehensive', { 
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ syncType: 'users' })
			});
			const data = await res.json();

			if (res.ok) {
				setResult({
					success: true,
					message: 'Users synced successfully',
					users: data.recordsSynced,
					rosterMemberships: data.recordsSynced
				});
			} else {
				throw new Error(data.message || 'Failed to sync users');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to sync users');
		} finally {
			setSyncing(false);
		}
	};

	const handleFullSync = async () => {
		setSyncing(true);
		setError(null);
		setResult(null);

		try {
			const res = await fetch('/api/sync/comprehensive', { 
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ syncType: 'full' })
			});
			const data = await res.json();

			if (res.ok) {
				setResult({
					success: true,
					message: 'Full sync completed successfully',
					courses: data.recordsSynced,
					users: data.recordsSynced,
					rosterMemberships: data.recordsSynced
				});
			} else {
				throw new Error(data.message || 'Failed to perform full sync');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to sync');
		} finally {
			setSyncing(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight text-gray-900">Sync Management</h1>
						<p className="text-sm text-gray-600">Sync data from Google Classroom to your local database</p>
					</div>
					<button
						onClick={() => router.push('/dashboard')}
						className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800"
					>
						Back to Dashboard
					</button>
				</div>

				{error && (
					<div className="rounded-md border border-red-200 bg-red-50 p-4">
						<div className="text-sm text-red-700">{error}</div>
					</div>
				)}

				{result && (
					<div className="rounded-md border border-green-200 bg-green-50 p-4">
						<div className="text-sm text-green-700 font-medium mb-2">{result.message}</div>
						{result.courses && (
							<div className="text-sm text-green-600">Courses: {result.courses}</div>
						)}
						{result.users && (
							<div className="text-sm text-green-600">Users: {result.users}</div>
						)}
						{result.rosterMemberships && (
							<div className="text-sm text-green-600">Roster Memberships: {result.rosterMemberships}</div>
						)}
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Sync Courses */}
					<div className="bg-white rounded-lg border border-gray-200 p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-2">Sync Courses</h3>
						<p className="text-sm text-gray-600 mb-4">
							Sync all courses from Google Classroom to your database
						</p>
						<button
							onClick={handleSyncCourses}
							disabled={syncing}
							className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{syncing ? 'Syncing...' : 'Sync Courses'}
						</button>
					</div>

					{/* Sync Users */}
					<div className="bg-white rounded-lg border border-gray-200 p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-2">Sync Users</h3>
						<p className="text-sm text-gray-600 mb-4">
							Sync all students and teachers from Google Classroom courses
						</p>
						<button
							onClick={handleSyncUsers}
							disabled={syncing}
							className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{syncing ? 'Syncing...' : 'Sync Users'}
						</button>
					</div>

					{/* Full Sync */}
					<div className="bg-white rounded-lg border border-gray-200 p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-2">Full Sync</h3>
						<p className="text-sm text-gray-600 mb-4">
							Sync both courses and users in the correct order
						</p>
						<button
							onClick={handleFullSync}
							disabled={syncing}
							className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{syncing ? 'Syncing...' : 'Full Sync'}
						</button>
					</div>
				</div>

				{/* Instructions */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
					<h3 className="text-lg font-medium text-blue-900 mb-2">Sync Instructions</h3>
					<div className="text-sm text-blue-800 space-y-2">
						<p><strong>Recommended Order:</strong></p>
						<ol className="list-decimal list-inside space-y-1 ml-4">
							<li>First, run <strong>Sync Courses</strong> to get all courses from Google Classroom</li>
							<li>Then, run <strong>Sync Users</strong> to get all students and teachers from those courses</li>
							<li>Or use <strong>Full Sync</strong> to do both steps automatically</li>
						</ol>
						<p className="mt-4">
							<strong>Note:</strong> Users must be synced before they can log in via OAuth. 
							The system will check if a user exists in the database before allowing login.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
