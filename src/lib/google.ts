import { google } from 'googleapis';

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL as string;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY as string)?.replace(/\\n/g, '\n');
const GOOGLE_DELEGATED_ADMIN = process.env.GOOGLE_DELEGATED_ADMIN as string | undefined;

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
	throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in environment');
}

export function getAuth(scopes: string[]) {
	const jwt = new google.auth.JWT({
		email: GOOGLE_CLIENT_EMAIL,
		key: GOOGLE_PRIVATE_KEY,
		scopes,
		subject: GOOGLE_DELEGATED_ADMIN,
	});
	return jwt;
}

export function getAdminDirectory() {
	const auth = getAuth([
		'https://www.googleapis.com/auth/admin.directory.user',
		'https://www.googleapis.com/auth/admin.directory.userschema',
		'https://www.googleapis.com/auth/admin.directory.orgunit', // For organizational units
		'https://www.googleapis.com/auth/admin.directory.user.readonly', // For checking existing users
		'https://www.googleapis.com/auth/admin.directory.domain', // For domain operations
		'https://www.googleapis.com/auth/admin.directory.customer', // For customer information
	]);
	return google.admin({ version: 'directory_v1', auth });
}

/**
 * Gets the customer ID for the Google Workspace domain
 * This function dynamically retrieves the customer ID instead of using hardcoded 'my_customer'
 */
export async function getCustomerId(): Promise<string> {
	try {
		const admin = getAdminDirectory();
		const customerResponse = await admin.customers.get({
			customerKey: 'my_customer'
		});
		
		const customerId = customerResponse.data.id;
		console.log('Retrieved customer ID:', customerId);
		return customerId || 'my_customer';
	} catch (error) {
		console.error('Error getting customer ID:', error);
		// Fallback to 'my_customer' if the API call fails
		console.log('Falling back to my_customer');
		return 'my_customer';
	}
}

export function getClassroom() {
	const auth = getAuth([
		'https://www.googleapis.com/auth/classroom.courses.readonly',
		'https://www.googleapis.com/auth/classroom.rosters.readonly',
		'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
		'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
		'https://www.googleapis.com/auth/classroom.profile.emails',
		// 'https://www.googleapis.com/auth/classroom.grades', // Temporarily disabled - causing sync issues
		'https://www.googleapis.com/auth/classroom.courses', // Full access to courses (needed for adding students/teachers and creating courses)
		'https://www.googleapis.com/auth/classroom.rosters', // Full access to rosters (needed for adding students/teachers)
		'https://www.googleapis.com/auth/classroom.coursework.students', // Full access to coursework (now configured in service account)
		'https://www.googleapis.com/auth/classroom.courseworkmaterials', // Full access to course materials
	]);
	return google.classroom({ version: 'v1', auth });
}

/**
 * Detects user role from Google Classroom API using user's OAuth credentials
 * Checks if user is a teacher or student in any Google Classroom course
 */
export async function detectGoogleClassroomRole(email: string, oauth2Client: any): Promise<'student' | 'teacher'> {
	try {
		// Use user's OAuth credentials to access Google Classroom
		const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
		
		// Get all courses the user has access to
		const coursesResponse = await classroom.courses.list({ pageSize: 100 });
		const courses = coursesResponse.data.courses || [];
		
		console.log(`Checking role for ${email} across ${courses.length} courses`);
		console.log('Available courses:', courses.map(c => ({ id: c.id, name: c.name })));
		
		// First, check if user is a teacher in any course
		for (const course of courses) {
			if (!course.id) continue;
			
			try {
				const teachersResponse = await classroom.courses.teachers.list({
					courseId: course.id
				});
				
				const teachers = teachersResponse.data.teachers || [];
				console.log(`Course ${course.id} teachers:`, teachers.map(t => t.profile?.emailAddress));
				
				const isTeacher = teachers.some(
					teacher => teacher.profile?.emailAddress?.toLowerCase() === email.toLowerCase()
				);
				
				if (isTeacher) {
					console.log(`User ${email} found as teacher in course ${course.id}`);
					return 'teacher';
				}
			} catch (error) {
				console.warn(`Error checking teachers for course ${course.id}:`, error);
				// Continue to next course
			}
		}
		
		// If not a teacher, check if they're a student
		for (const course of courses) {
			if (!course.id) continue;
			
			try {
				const studentsResponse = await classroom.courses.students.list({
					courseId: course.id
				});
				
				const students = studentsResponse.data.students || [];
				console.log(`Course ${course.id} students:`, students.map(s => s.profile?.emailAddress));
				
				const isStudent = students.some(
					student => student.profile?.emailAddress?.toLowerCase() === email.toLowerCase()
				);
				
				if (isStudent) {
					console.log(`User ${email} found as student in course ${course.id}`);
					return 'student';
				}
			} catch (error) {
				console.warn(`Error checking students for course ${course.id}:`, error);
				// Continue to next course
			}
		}
		
		// If no role found in any course, default to student
		console.log(`User ${email} not found in any courses, defaulting to student role`);
		return 'student';
		
	} catch (error) {
		console.error('Error detecting Google Classroom role:', error);
		// Default to student on error
		return 'student';
	}
}
