"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Course = {
	id?: string;
	name?: string;
	section?: string;
	courseState?: string;
	ownerId?: string;
	room?: string;
};

export default function CoursesPage() {
	const router = useRouter();
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch('/api/classroom/courses');
				if (!res.ok) throw new Error('Failed to load courses');
				const data = (await res.json()) as { courses: Course[] };
				setCourses(data.courses || []);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Failed to load courses');
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-semibold text-gray-900">All Classrooms</h1>
					<Link href="/dashboard" className="text-sm text-gray-700 hover:underline">Back to Dashboard</Link>
				</div>

				{error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{courses.map((c) => (
						<div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
							<div className="flex items-start justify-between">
								<div>
									<div className="text-base font-medium text-gray-900">{c.name || 'Untitled course'}</div>
									<div className="text-sm text-gray-600">{c.section || '—'}</div>
								</div>
								<span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{c.courseState || 'UNKNOWN'}</span>
							</div>
							<div className="mt-3 text-sm text-gray-600">Room: {c.room || '—'}</div>
							<div className="mt-4 flex items-center gap-2">
								<button type="button" onClick={() => router.push(`/dashboard/courses/${c.id}`)} className="px-3 py-1.5 rounded-md border text-sm text-gray-700 hover:bg-gray-50">
									Open classroom
								</button>
							</div>
						</div>
					))}
					{!loading && courses.length === 0 && (
						<div className="text-gray-600">No classrooms found.</div>
					)}
					{loading && <div className="text-gray-600">Loading…</div>}
				</div>
			</div>
		</div>
	);
}
