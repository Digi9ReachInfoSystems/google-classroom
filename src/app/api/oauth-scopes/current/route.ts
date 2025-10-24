import { NextRequest, NextResponse } from 'next/server';
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

    // Current scopes used in the application
    const currentScopes = [
      {
        scope: "https://www.googleapis.com/auth/userinfo.email",
        name: "User Email",
        description: "View user's email address",
        category: "User Info"
      },
      {
        scope: "https://www.googleapis.com/auth/userinfo.profile",
        name: "User Profile",
        description: "View user's basic profile information",
        category: "User Info"
      },
      {
        scope: "https://www.googleapis.com/auth/classroom.courses.readonly",
        name: "Classroom Courses (Read Only)",
        description: "View Google Classroom courses",
        category: "Classroom"
      },
      {
        scope: "https://www.googleapis.com/auth/classroom.rosters.readonly",
        name: "Classroom Rosters (Read Only)",
        description: "View course rosters",
        category: "Classroom"
      },
      {
        scope: "https://www.googleapis.com/auth/classroom.profile.emails",
        name: "Classroom Profile Emails",
        description: "View user profile emails in Classroom",
        category: "Classroom"
      },
      {
        scope: "https://www.googleapis.com/auth/classroom.announcements",
        name: "Classroom Announcements",
        description: "View and manage course announcements",
        category: "Classroom"
      },
      {
        scope: "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
        name: "My Student Submissions (Read Only)",
        description: "View your own student submissions",
        category: "Classroom"
      },
      {
        scope: "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
        name: "All Student Submissions (Read Only)",
        description: "View student submissions for all students",
        category: "Classroom"
      },
      {
        scope: "https://www.googleapis.com/auth/classroom.coursework.me",
        name: "My Coursework",
        description: "View and manage your own coursework",
        category: "Classroom"
      },
      {
        scope: "https://www.googleapis.com/auth/classroom.coursework.students",
        name: "All Student Coursework",
        description: "View and manage coursework for all students",
        category: "Classroom"
      },
      {
        scope: "https://www.googleapis.com/auth/user.addresses.read",
        name: "User Addresses (Read Only)",
        description: "View user's addresses",
        category: "User Info"
      },
      {
        scope: "https://www.googleapis.com/auth/user.phonenumbers.read",
        name: "User Phone Numbers (Read Only)",
        description: "View user's phone numbers",
        category: "User Info"
      },
      {
        scope: "https://www.googleapis.com/auth/user.birthday.read",
        name: "User Birthday (Read Only)",
        description: "View user's birthday",
        category: "User Info"
      },
      {
        scope: "https://www.googleapis.com/auth/user.emails.read",
        name: "User Emails (Read Only)",
        description: "View user's email addresses",
        category: "User Info"
      },
      {
        scope: "https://www.googleapis.com/auth/admin.directory.user.readonly",
        name: "Admin Directory Users (Read Only)",
        description: "View user information in Google Workspace",
        category: "Admin"
      }
    ];

    // Group scopes by category
    const scopesByCategory = currentScopes.reduce((acc, scope) => {
      if (!acc[scope.category]) {
        acc[scope.category] = [];
      }
      acc[scope.category].push(scope);
      return acc;
    }, {} as Record<string, typeof currentScopes>);

    return NextResponse.json({
      success: true,
      data: {
        scopes: currentScopes,
        scopesByCategory,
        summary: {
          totalScopes: currentScopes.length,
          categories: Object.keys(scopesByCategory).length,
          categoriesList: Object.keys(scopesByCategory)
        },
        userInfo: {
          email: payload.email,
          role: payload.role,
          hasAccessToken: !!payload.accessToken,
          hasRefreshToken: !!payload.refreshToken
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching current OAuth scopes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch current OAuth scopes',
      details: error.message
    }, { status: 500 });
  }
}
