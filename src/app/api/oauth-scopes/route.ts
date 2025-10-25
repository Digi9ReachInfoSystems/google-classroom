import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Comprehensive list of Google OAuth scopes organized by service
    const scopes = {
      // Google Classroom API scopes
      classroom: {
        name: "Google Classroom API",
        description: "Scopes for accessing Google Classroom data and managing courses",
        scopes: [
          {
            scope: "https://www.googleapis.com/auth/classroom.courses",
            name: "Courses (Full Access)",
            description: "View and manage Google Classroom courses",
            permissions: ["read", "write", "delete"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.courses.readonly",
            name: "Courses (Read Only)",
            description: "View Google Classroom courses",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.rosters",
            name: "Rosters (Full Access)",
            description: "View and manage course rosters",
            permissions: ["read", "write", "delete"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.rosters.readonly",
            name: "Rosters (Read Only)",
            description: "View course rosters",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.coursework.me",
            name: "Coursework (My Assignments)",
            description: "View and manage your own coursework",
            permissions: ["read", "write"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.coursework.students",
            name: "Coursework (All Students)",
            description: "View and manage coursework for all students",
            permissions: ["read", "write", "delete"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
            name: "Coursework (Students Read Only)",
            description: "View coursework for all students",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.student-submissions.me",
            name: "Student Submissions (My Submissions)",
            description: "View and manage your own student submissions",
            permissions: ["read", "write"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
            name: "Student Submissions (My Read Only)",
            description: "View your own student submissions",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.student-submissions.students",
            name: "Student Submissions (All Students)",
            description: "View and manage student submissions for all students",
            permissions: ["read", "write", "delete"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
            name: "Student Submissions (Students Read Only)",
            description: "View student submissions for all students",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.profile.emails",
            name: "Profile Emails",
            description: "View user profile emails",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.announcements",
            name: "Announcements",
            description: "View and manage course announcements",
            permissions: ["read", "write", "delete"]
          },
          {
            scope: "https://www.googleapis.com/auth/classroom.announcements.readonly",
            name: "Announcements (Read Only)",
            description: "View course announcements",
            permissions: ["read"]
          }
        ]
      },

      // Google People API scopes
      people: {
        name: "Google People API",
        description: "Scopes for accessing user profile information",
        scopes: [
          {
            scope: "https://www.googleapis.com/auth/userinfo.email",
            name: "User Email",
            description: "View user's email address",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/userinfo.profile",
            name: "User Profile",
            description: "View user's basic profile information",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/user.addresses.read",
            name: "User Addresses (Read Only)",
            description: "View user's addresses",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/user.phonenumbers.read",
            name: "User Phone Numbers (Read Only)",
            description: "View user's phone numbers",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/user.birthday.read",
            name: "User Birthday (Read Only)",
            description: "View user's birthday",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/user.emails.read",
            name: "User Emails (Read Only)",
            description: "View user's email addresses",
            permissions: ["read"]
          }
        ]
      },

      // Google Admin SDK scopes
      admin: {
        name: "Google Admin SDK",
        description: "Scopes for accessing Google Workspace admin functions",
        scopes: [
          {
            scope: "https://www.googleapis.com/auth/admin.directory.user.readonly",
            name: "Admin Directory Users (Read Only)",
            description: "View user information in Google Workspace",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/admin.directory.user",
            name: "Admin Directory Users (Full Access)",
            description: "View and manage user information in Google Workspace",
            permissions: ["read", "write", "delete"]
          },
          {
            scope: "https://www.googleapis.com/auth/admin.directory.group.readonly",
            name: "Admin Directory Groups (Read Only)",
            description: "View group information in Google Workspace",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/admin.directory.group",
            name: "Admin Directory Groups (Full Access)",
            description: "View and manage group information in Google Workspace",
            permissions: ["read", "write", "delete"]
          }
        ]
      },

      // Google Drive API scopes
      drive: {
        name: "Google Drive API",
        description: "Scopes for accessing Google Drive files",
        scopes: [
          {
            scope: "https://www.googleapis.com/auth/drive.readonly",
            name: "Drive (Read Only)",
            description: "View Google Drive files",
            permissions: ["read"]
          },
          {
            scope: "https://www.googleapis.com/auth/drive.file",
            name: "Drive Files (App Created)",
            description: "View and manage files created by this app",
            permissions: ["read", "write", "delete"]
          },
          {
            scope: "https://www.googleapis.com/auth/drive",
            name: "Drive (Full Access)",
            description: "View and manage all Google Drive files",
            permissions: ["read", "write", "delete"]
          }
        ]
      }
    };

    // Current scopes used in the application
    const currentScopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/classroom.courses.readonly",
      "https://www.googleapis.com/auth/classroom.rosters.readonly",
      "https://www.googleapis.com/auth/classroom.profile.emails",
      "https://www.googleapis.com/auth/classroom.announcements",
      "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
      "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
      "https://www.googleapis.com/auth/classroom.coursework.me",
      "https://www.googleapis.com/auth/classroom.coursework.students",
      "https://www.googleapis.com/auth/user.addresses.read",
      "https://www.googleapis.com/auth/user.phonenumbers.read",
      "https://www.googleapis.com/auth/user.birthday.read",
      "https://www.googleapis.com/auth/user.emails.read",
      "https://www.googleapis.com/auth/admin.directory.user.readonly"
    ];

    // Recommended scopes for different use cases
    const recommendedScopes = {
      student: {
        name: "Student Access",
        description: "Scopes needed for student functionality",
        scopes: [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/classroom.courses.readonly",
          "https://www.googleapis.com/auth/classroom.coursework.me",
          "https://www.googleapis.com/auth/classroom.student-submissions.me"
        ]
      },
      teacher: {
        name: "Teacher Access",
        description: "Scopes needed for teacher functionality",
        scopes: [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/classroom.courses",
          "https://www.googleapis.com/auth/classroom.rosters",
          "https://www.googleapis.com/auth/classroom.coursework.students",
          "https://www.googleapis.com/auth/classroom.student-submissions.students",
          "https://www.googleapis.com/auth/classroom.announcements"
        ]
      },
      admin: {
        name: "Admin Access",
        description: "Scopes needed for admin functionality",
        scopes: [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/classroom.courses",
          "https://www.googleapis.com/auth/classroom.rosters",
          "https://www.googleapis.com/auth/classroom.coursework.students",
          "https://www.googleapis.com/auth/classroom.student-submissions.students",
          "https://www.googleapis.com/auth/classroom.announcements",
          "https://www.googleapis.com/auth/admin.directory.user.readonly"
        ]
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        scopes,
        currentScopes,
        recommendedScopes,
        summary: {
          totalScopes: Object.values(scopes).reduce((total, service) => total + service.scopes.length, 0),
          services: Object.keys(scopes).length,
          currentScopesCount: currentScopes.length
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching OAuth scopes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch OAuth scopes',
      details: error.message
    }, { status: 500 });
  }
}
