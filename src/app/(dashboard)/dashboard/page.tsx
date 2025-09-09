"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Course = {
	courseId: string;
	name?: string;
	section?: string;
	courseState?: string;
	room?: string;
};

interface CourseData {
	courseId: string;
	name?: string;
	section?: string;
	courseState?: string;
	room?: string;
}

export default function DashboardPage() {
	const router = useRouter();
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(12);
	const [total, setTotal] = useState(0);
	const [q, setQ] = useState('');
	const [syncing, setSyncing] = useState(false);

	async function load() {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
			if (q) params.set('q', q);
			const res = await fetch(`/api/db/courses?${params.toString()}`, { cache: 'no-store' });
			if (!res.ok) throw new Error('Failed to load courses');
			const data = await res.json();
			setCourses((data.courses || []).map((c: CourseData) => ({
				courseId: c.courseId,
				name: c.name,
				section: c.section,
				courseState: c.courseState,
				room: c.room,
			})));
			setTotal(data.total || 0);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to load courses');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, q]);

	async function syncCourses() {
		setSyncing(true);
		try {
			const res = await fetch('/api/sync/courses', { method: 'POST' });
			if (!res.ok) throw new Error('Sync failed');
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Sync failed');
		} finally {
			setSyncing(false);
		}
	}

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	// Loading skeleton component
	const LoadingSkeleton = () => (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="h-5 bg-gray-200 rounded mb-2"></div>
							<div className="h-4 bg-gray-200 rounded w-3/4"></div>
						</div>
						<div className="h-6 w-16 bg-gray-200 rounded-full ml-2"></div>
					</div>
					<div className="mt-3 h-4 bg-gray-200 rounded w-1/2"></div>
					<div className="mt-4 h-8 bg-gray-200 rounded w-24"></div>
				</div>
			))}
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
				<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight text-gray-900">Your Classrooms</h1>
						<p className="text-sm text-gray-600">Synced from Google Classroom, served from MongoDB.</p>
					</div>
					<div className="flex items-center gap-2">
						<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search classrooms" className="rounded-md border px-3 py-2 text-sm text-black placeholder-black" />
						<Link href="/dashboard/bulk-upload" className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">
							Bulk Upload
						</Link>
						<button onClick={syncCourses} disabled={syncing} className="px-3 py-2 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800">
							{syncing ? 'Syncing…' : 'Sync classroom'}
						</button>
						<Link href="/dashboard/create-course" className="px-3 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700">
							Create Course
						</Link>
					</div>
				</div>

				{error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

				{loading ? (
					<div className="space-y-4">
						<div className="flex items-center justify-center py-8">
							<div className="text-center">
								<div className="inline-flex items-center space-x-2 text-gray-600">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
									<span className="text-lg font-medium">Loading classrooms...</span>
								</div>
								<p className="text-sm text-gray-500 mt-2">Fetching your course data from the database</p>
							</div>
						</div>
						<LoadingSkeleton />
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{courses.map((c) => (
							<div key={c.courseId} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
								<div className="flex items-start justify-between">
									<div>
										<div className="text-base font-medium text-gray-900">{c.name || 'Untitled course'}</div>
										<div className="text-sm text-gray-600">{c.section || '—'}</div>
									</div>
									<span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{c.courseState || 'UNKNOWN'}</span>
								</div>
								<div className="mt-3 text-sm text-gray-600">Room: {c.room || '—'}</div>
								<div className="mt-4 flex items-center gap-2">
									<button type="button" onClick={() => router.push(`/dashboard/courses/${c.courseId}`)} className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800">
										Open classroom
									</button>
									<button type="button" onClick={() => router.push(`/dashboard/courses/${c.courseId}/roster`)} className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">
										Manage Roster
									</button>
									<button type="button" onClick={() => router.push(`/dashboard/courses/${c.courseId}/coursework`)} className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-sm hover:bg-purple-700">
										Manage Coursework
									</button>
								</div>
							</div>
						))}
						{!loading && courses.length === 0 && (
							<div className="text-gray-600">No classrooms found.</div>
						)}
					</div>
				)}

				{totalPages > 1 && (
					<div className="flex items-center justify-center gap-2">
						<button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded border text-sm disabled:opacity-50">Prev</button>
						<span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
						<button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 rounded border text-sm disabled:opacity-50">Next</button>
					</div>
				)}
			</div>
		</div>
	);
}
