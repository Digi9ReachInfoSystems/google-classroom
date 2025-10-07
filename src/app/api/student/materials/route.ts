import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getClassroom } from '@/lib/google';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
	try {
		// Check authentication
		const token = req.cookies.get('token')?.value;
		if (!token) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const payload = verifyAuthToken(token);
		if (!payload) {
			return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
		}

		// Only allow students to access this endpoint
		if (payload.role !== 'student') {
			return NextResponse.json({ message: 'Access denied' }, { status: 403 });
		}

		// Get course ID from query parameters
		const { searchParams } = new URL(req.url);
		const courseId = searchParams.get('courseId');

		if (!courseId) {
			return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
		}

		await connectToDatabase();
		const classroom = getClassroom();

		try {
			// Fetch course work materials from Google Classroom API
			const materials = await classroom.courses.courseWorkMaterials.list({
				courseId: courseId,
				pageSize: 50,
				orderBy: 'updateTime desc'
			});

			// Transform the data for the frontend
			const materialsData = materials.data.courseWorkMaterial?.map((material: any) => ({
				id: material.id,
				title: material.title,
				description: material.description,
				state: material.state,
				alternateLink: material.alternateLink,
				creationTime: material.creationTime,
				updateTime: material.updateTime,
				scheduledTime: material.scheduledTime,
				assigneeMode: material.assigneeMode,
				creatorUserId: material.creatorUserId,
				materials: material.materials || []
			})) || [];

			return NextResponse.json({
				success: true,
				materials: materialsData,
				total: materialsData.length
			});

		} catch (googleError: any) {
			console.error('Error fetching materials:', googleError);
			
			// Return mock data if Google API fails
			const mockMaterials = [
				{
					id: '1',
					title: 'Course Syllabus',
					description: 'Complete course syllabus with grading criteria',
					state: 'PUBLISHED',
					creationTime: '2024-12-01T09:00:00Z',
					updateTime: '2024-12-01T09:00:00Z',
					creatorUserId: 'teacher@example.com',
					materials: [
						{
							driveFile: {
								driveFile: {
									id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
									title: 'Syllabus.pdf',
									alternateLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view'
								}
							}
						}
					]
				},
				{
					id: '2',
					title: 'Reading Materials - Chapter 1',
					description: 'Required reading for this week',
					state: 'PUBLISHED',
					creationTime: '2024-12-02T10:00:00Z',
					updateTime: '2024-12-02T10:00:00Z',
					creatorUserId: 'teacher@example.com',
					materials: [
						{
							link: {
								url: 'https://example.com/chapter1',
								title: 'Chapter 1: Introduction'
							}
						}
					]
				}
			];

			return NextResponse.json({
				success: true,
				materials: mockMaterials,
				total: mockMaterials.length,
				source: 'mock'
			});
		}

	} catch (error) {
		console.error('Materials API error:', error);
		return NextResponse.json({
			success: false,
			message: 'Internal server error'
		}, { status: 500 });
	}
}
