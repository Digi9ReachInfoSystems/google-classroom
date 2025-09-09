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
	]);
	return google.admin({ version: 'directory_v1', auth });
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
