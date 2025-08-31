"use client";

import { useEffect, useMemo, useState } from 'react';
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

type CourseDetails = {
	teachers: any[];
	students: any[];
	courseWork: any[];
	loading: boolean;
	error: string | null;
};

export default function CoursesPage() {
	const router = useRouter();
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [expanded, setExpanded] = useState<string | null>(null);
	const [detailsById, setDetailsById] = useState<Record<string, CourseDetails>>({});
	const [studentQuery, setStudentQuery] = useState('');
	const [teacherQuery, setTeacherQuery] = useState('');
	const [courseworkQuery, setCourseworkQuery] = useState('');

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

	async function toggleExpand(courseId?: string) {
		if (!courseId) return;
		if (expanded === courseId) {
			setExpanded(null);
			return;
		}
		setExpanded(courseId);
		if (!detailsById[courseId]) {
			setDetailsById((prev) => ({
				...prev,
				[courseId]: { teachers: [], students: [], courseWork: [], loading: true, error: null },
			}));
			try {
				const [tRes, sRes, cwRes] = await Promise.all([
					fetch(`/api/classroom/courses/${courseId}/teachers`),
					fetch(`/api/classroom/courses/${courseId}/students`),
					fetch(`/api/classroom/courses/${courseId}/coursework`),
				]);
				if (!tRes.ok || !sRes.ok || !cwRes.ok) throw new Error('Failed to load course details');
				const t = await tRes.json();
				const s = await sRes.json();
				const cw = await cwRes.json();
				setDetailsById((prev) => ({
					...prev,
					[courseId]: {
						teachers: t.teachers || [],
						students: s.students || [],
						courseWork: cw.courseWork || [],
						loading: false,
						error: null,
					},
				}));
			} catch (e) {
				setDetailsById((prev) => ({
					...prev,
					[courseId]: { teachers: [], students: [], courseWork: [], loading: false, error: e instanceof Error ? e.message : 'Failed to load' },
				}));
			}
		}
	}

	const current = expanded ? detailsById[expanded] : undefined;
	const filteredTeachers = useMemo(() => {
		if (!current) return [] as any[];
		const q = teacherQuery.trim().toLowerCase();
		if (!q) return current.teachers;
		return current.teachers.filter((t: any) => (t.profile?.name?.fullName || '').toLowerCase().includes(q) || (t.profile?.emailAddress || '').toLowerCase().includes(q));
	}, [current, teacherQuery]);
	const filteredStudents = useMemo(() => {
		if (!current) return [] as any[];
		const q = studentQuery.trim().toLowerCase();
		if (!q) return current.students;
		return current.students.filter((s: any) => (s.profile?.name?.fullName || '').toLowerCase().includes(q) || (s.profile?.emailAddress || '').toLowerCase().includes(q));
	}, [current, studentQuery]);
	const filteredCoursework = useMemo(() => {
		if (!current) return [] as any[];
		const q = courseworkQuery.trim().toLowerCase();
		if (!q) return current.courseWork;
		return current.courseWork.filter((cw: any) => (cw.title || '').toLowerCase().includes(q));
	}, [current, courseworkQuery]);

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
								{/* <button type="button" onClick={() => toggleExpand(c.id)} className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800">
									{expanded === c.id ? 'Hide details' : 'Show details'}
								</button> */}
								<button type="button" onClick={() => router.push(`/dashboard/courses/${c.id}`)} className="px-3 py-1.5 rounded-md border text-sm text-gray-700 hover:bg-gray-50">
									Open classroom
								</button>
							</div>

							{expanded === c.id && (
								<div className="mt-4 space-y-4">
									{(!current || current.loading) && <div className="text-sm text-gray-600">Loading details…</div>}
									{current?.error && <div className="text-sm text-red-600">{current.error}</div>}
									{current && !current.loading && !current.error && (
										<div className="grid grid-cols-1 gap-4">
											<div className="rounded-lg border border-gray-200 bg-white p-4">
												<div className="text-sm font-medium text-gray-700 mb-2">Teachers ({filteredTeachers.length})</div>
												<div className="mb-2">
													<input value={teacherQuery} onChange={(e) => setTeacherQuery(e.target.value)} placeholder="Search teachers" className="w-full rounded-md border px-3 py-2 text-sm" />
												</div>
												<div className="overflow-x-auto rounded border">
													<table className="min-w-full text-sm">
														<thead className="bg-gray-50">
															<tr>
																<th className="px-3 py-2 text-left">Name</th>
																<th className="px-3 py-2 text-left">Email</th>
															</tr>
														</thead>
														<tbody>
															{filteredTeachers.map((t: any) => (
																<tr key={t.userId} className="border-t">
																	<td className="px-3 py-2">{t.profile?.name?.fullName || '—'}</td>
																	<td className="px-3 py-2">{t.profile?.emailAddress || '—'}</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											</div>

											<div className="rounded-lg border border-gray-200 bg-white p-4">
												<div className="text-sm font-medium text-gray-700 mb-2">Students ({filteredStudents.length})</div>
												<div className="mb-2">
													<input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="Search students" className="w-full rounded-md border px-3 py-2 text-sm" />
												</div>
												<div className="overflow-x-auto rounded border">
													<table className="min-w-full text-sm">
														<thead className="bg-gray-50">
															<tr>
																<th className="px-3 py-2 text-left">Name</th>
																<th className="px-3 py-2 text-left">Email</th>
															</tr>
														</thead>
														<tbody>
															{filteredStudents.map((s: any) => (
																<tr key={s.userId} className="border-t">
																	<td className="px-3 py-2">{s.profile?.name?.fullName || '—'}</td>
																	<td className="px-3 py-2">{s.profile?.emailAddress || '—'}</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											</div>

											<div className="rounded-lg border border-gray-200 bg-white p-4">
												<div className="text-sm font-medium text-gray-700 mb-2">Coursework ({filteredCoursework.length})</div>
												<div className="mb-2">
													<input value={courseworkQuery} onChange={(e) => setCourseworkQuery(e.target.value)} placeholder="Search coursework" className="w-full rounded-md border px-3 py-2 text-sm" />
												</div>
												<div className="overflow-x-auto rounded border">
													<table className="min-w-full text-sm">
														<thead className="bg-gray-50">
															<tr>
																<th className="px-3 py-2 text-left">Title</th>
																<th className="px-3 py-2 text-left">State</th>
																<th className="px-3 py-2 text-left">Due</th>
															</tr>
														</thead>
														<tbody>
															{filteredCoursework.map((cw: any) => (
																<tr key={cw.id} className="border-t">
																	<td className="px-3 py-2">{cw.title || '—'}</td>
																	<td className="px-3 py-2">{cw.state || '—'}</td>
																	<td className="px-3 py-2">{cw.dueDate ? `${cw.dueDate.year}-${cw.dueDate.month}-${cw.dueDate.day}` : '—'}</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											</div>
										</div>
									)}
								</div>
							)}
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
