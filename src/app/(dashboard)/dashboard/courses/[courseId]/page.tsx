"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DataTable from '@/components/DataTable';

export default function CourseDetailPage() {
	const params = useParams<{ courseId: string }>();
	const courseId = params.courseId as string;
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [teachers, setTeachers] = useState<any[]>([]);
	const [students, setStudents] = useState<any[]>([]);
	const [courseWork, setCourseWork] = useState<any[]>([]);
	const [submissions, setSubmissions] = useState<any[]>([]);
	const [grades, setGrades] = useState<any[]>([]);

	useEffect(() => {
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const [tRes, sRes, cwRes, subRes, gradesRes] = await Promise.all([
					fetch(`/api/classroom/courses/${courseId}/teachers`),
					fetch(`/api/classroom/courses/${courseId}/students`),
					fetch(`/api/classroom/courses/${courseId}/coursework`),
					fetch(`/api/classroom/courses/${courseId}/submissions`),
					fetch(`/api/classroom/courses/${courseId}/grades`),
				]);
				if (!tRes.ok || !sRes.ok || !cwRes.ok || !subRes.ok || !gradesRes.ok) throw new Error('Failed to load');
				const t = await tRes.json();
				const s = await sRes.json();
				const cw = await cwRes.json();
				const sub = await subRes.json();
				const grades = await gradesRes.json();
				
				setTeachers(t.teachers || []);
				setStudents(s.students || []);
				setCourseWork(cw.courseWork || []);
				setSubmissions(sub.studentSubmissions || []);
				setGrades(grades.grades || []);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Failed to load');
			} finally {
				setLoading(false);
			}
		})();
	}, [courseId]);

	// Transform data for DataTable
	const teachersData = teachers.map(t => ({
		name: t.profile?.name?.fullName || '—',
		email: t.profile?.emailAddress || '—'
	}));

	const studentsData = students.map(s => ({
		name: s.profile?.name?.fullName || '—',
		email: s.profile?.emailAddress || '—'
	}));

	const courseworkData = courseWork.map(cw => ({
		title: cw.title || '—',
		state: cw.state || '—',
		dueDate: cw.dueDate ? `${cw.dueDate.year}-${cw.dueDate.month}-${cw.dueDate.day}` : '—'
	}));

	const submissionsData = submissions.map(sub => ({
		submissionId: sub.id || '—',
		courseWorkId: sub.courseWorkId || '—',
		state: sub.state || '—',
		late: String(sub.late || false),
		grade: sub.assignedGrade ? `${sub.assignedGrade}` : '—'
	}));

	const gradesData = grades.map(grade => ({
		submissionId: grade.submissionId || '—',
		courseWorkId: grade.courseWorkId || '—',
		userEmail: grade.userEmail || '—',
		grade: grade.grade ? `${grade.grade}` : '—',
		state: grade.state || '—',
		late: String(grade.late || false)
	}));

	// Column definitions
	const teacherColumns = [
		{ key: 'name', label: 'Name', sortable: true, filterable: true },
		{ key: 'email', label: 'Email', sortable: true, filterable: true }
	];

	const studentColumns = [
		{ key: 'name', label: 'Name', sortable: true, filterable: true },
		{ key: 'email', label: 'Email', sortable: true, filterable: true }
	];

	const courseworkColumns = [
		{ key: 'title', label: 'Title', sortable: true, filterable: true },
		{ key: 'state', label: 'State', sortable: true, filterable: true },
		{ key: 'dueDate', label: 'Due Date', sortable: true, filterable: true }
	];

	const submissionColumns = [
		{ key: 'submissionId', label: 'Submission ID', sortable: true, filterable: true },
		{ key: 'courseWorkId', label: 'CourseWork ID', sortable: true, filterable: true },
		{ key: 'state', label: 'State', sortable: true, filterable: true },
		{ key: 'late', label: 'Late', sortable: true, filterable: true },
		{ key: 'grade', label: 'Grade', sortable: true, filterable: true }
	];

	const gradesColumns = [
		{ key: 'submissionId', label: 'Submission ID', sortable: true, filterable: true },
		{ key: 'courseWorkId', label: 'CourseWork ID', sortable: true, filterable: true },
		{ key: 'userEmail', label: 'Student Email', sortable: true, filterable: true },
		{ key: 'grade', label: 'Grade', sortable: true, filterable: true },
		{ key: 'state', label: 'State', sortable: true, filterable: true },
		{ key: 'late', label: 'Late', sortable: true, filterable: true }
	];

	// Loading skeleton component
	const LoadingSkeleton = () => (
		<div className="space-y-8">
			{/* Teachers Table Skeleton */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
						<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
					</div>
				</div>
				<div className="px-6 py-4 border-b border-gray-200 space-y-4">
					<div className="flex items-center space-x-4">
						<div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
						<div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i}>
								<div className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
								<div className="h-8 bg-gray-200 rounded animate-pulse"></div>
							</div>
						))}
					</div>
				</div>
				<div className="max-h-80 overflow-y-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								{Array.from({ length: 3 }).map((_, i) => (
									<th key={i} className="px-6 py-3 text-left">
										<div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
									</th>
								))}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{Array.from({ length: 5 }).map((_, i) => (
								<tr key={i}>
									{Array.from({ length: 3 }).map((_, j) => (
										<td key={j} className="px-6 py-4">
											<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Students Table Skeleton */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
						<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
					</div>
				</div>
				<div className="px-6 py-4 border-b border-gray-200 space-y-4">
					<div className="flex items-center space-x-4">
						<div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
						<div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i}>
								<div className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
								<div className="h-8 bg-gray-200 rounded animate-pulse"></div>
							</div>
						))}
					</div>
				</div>
				<div className="max-h-80 overflow-y-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								{Array.from({ length: 3 }).map((_, i) => (
									<th key={i} className="px-6 py-3 text-left">
										<div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
									</th>
								))}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{Array.from({ length: 5 }).map((_, i) => (
								<tr key={i}>
									{Array.from({ length: 3 }).map((_, j) => (
										<td key={j} className="px-6 py-4">
											<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Coursework Table Skeleton */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
						<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
					</div>
				</div>
				<div className="px-6 py-4 border-b border-gray-200 space-y-4">
					<div className="flex items-center space-x-4">
						<div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
						<div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i}>
								<div className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
								<div className="h-8 bg-gray-200 rounded animate-pulse"></div>
							</div>
						))}
					</div>
				</div>
				<div className="max-h-80 overflow-y-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								{Array.from({ length: 4 }).map((_, i) => (
									<th key={i} className="px-6 py-3 text-left">
										<div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
									</th>
								))}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{Array.from({ length: 5 }).map((_, i) => (
								<tr key={i}>
									{Array.from({ length: 4 }).map((_, j) => (
										<td key={j} className="px-6 py-4">
											<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Submissions Table Skeleton */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
						<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
					</div>
				</div>
				<div className="px-6 py-4 border-b border-gray-200 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<div className="h-10 bg-gray-200 rounded animate-pulse"></div>
						<div className="h-10 bg-gray-200 rounded animate-pulse"></div>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i}>
								<div className="h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
								<div className="h-8 bg-gray-200 rounded animate-pulse"></div>
							</div>
						))}
					</div>
				</div>
				<div className="max-h-80 overflow-y-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								{Array.from({ length: 4 }).map((_, i) => (
									<th key={i} className="px-6 py-3 text-left">
										<div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
									</th>
								))}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{Array.from({ length: 5 }).map((_, i) => (
								<tr key={i}>
									{Array.from({ length: 4 }).map((_, j) => (
										<td key={j} className="px-6 py-4">
											<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-semibold text-gray-900">Course {courseId}</h1>
						<Link href="/dashboard" className="text-sm text-gray-700 hover:underline">Back to Dashboard</Link>
					</div>

					<div className="flex items-center justify-center py-8">
						<div className="text-center">
							<div className="inline-flex items-center space-x-2 text-gray-600">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
								<span className="text-lg font-medium">Loading course data...</span>
							</div>
							<p className="text-sm text-gray-500 mt-2">Fetching teachers, students, coursework, submissions, and grades</p>
						</div>
					</div>

					<LoadingSkeleton />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-semibold text-gray-900">Course {courseId}</h1>
					<Link href="/dashboard" className="text-sm text-gray-700 hover:underline">Back to Dashboard</Link>
				</div>

				{error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

				{/* Teachers Table */}
				<DataTable
					data={teachersData}
					columns={teacherColumns}
					title="Teachers"
					searchPlaceholder="Search teachers by name, email, or ID..."
					itemsPerPage={5}
				/>

				{/* Students Table */}
				<DataTable
					data={studentsData}
					columns={studentColumns}
					title="Students"
					searchPlaceholder="Search students by name, email, or ID..."
					itemsPerPage={5}
				/>

				{/* Coursework Table */}
				<DataTable
					data={courseworkData}
					columns={courseworkColumns}
					title="Coursework"
					searchPlaceholder="Search coursework by title, state, or ID..."
					itemsPerPage={5}
				/>

				{/* Submissions Table */}
				<DataTable
					data={submissionsData}
					columns={submissionColumns}
					title="Submissions"
					searchPlaceholder="Search submissions by ID, state, or late status..."
					itemsPerPage={5}
				/>

				{/* Grades Table */}
				<DataTable
					data={gradesData}
					columns={gradesColumns}
					title="Grades"
					searchPlaceholder="Search grades by student email, grade, or submission ID..."
					itemsPerPage={5}
				/>
			</div>
		</div>
	);
}
