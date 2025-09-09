import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/google';

export async function GET(request: NextRequest) {
  const results = [];

  // Test different scope combinations
  const scopeTests = [
    {
      name: 'Minimal - courses readonly only',
      scopes: ['https://www.googleapis.com/auth/classroom.courses.readonly']
    },
    {
      name: 'Basic - courses and rosters readonly',
      scopes: [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly'
      ]
    },
    {
      name: 'Full - courses and rosters full access',
      scopes: [
        'https://www.googleapis.com/auth/classroom.courses',
        'https://www.googleapis.com/auth/classroom.rosters'
      ]
    },
    {
      name: 'Coursework - just coursework scopes',
      scopes: [
        'https://www.googleapis.com/auth/classroom.coursework.me',
        'https://www.googleapis.com/auth/classroom.coursework'
      ]
    },
    {
      name: 'All working scopes from other project',
      scopes: [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
        'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
        'https://www.googleapis.com/auth/classroom.profile.emails',
        'https://www.googleapis.com/auth/classroom.courses',
        'https://www.googleapis.com/auth/classroom.rosters'
      ]
    }
  ];

  for (const test of scopeTests) {
    try {
      console.log(`Testing: ${test.name}`);
      const auth = getAuth(test.scopes);
      const authResult = await auth.authorize();
      
      results.push({
        name: test.name,
        scopes: test.scopes,
        success: true,
        hasAccessToken: !!authResult.access_token
      });
    } catch (error: unknown) {
      results.push({
        name: test.name,
        scopes: test.scopes,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        code: (error as { code?: number }).code,
        status: (error as { status?: number }).status
      });
    }
  }

  return NextResponse.json({
    success: true,
    results: results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  });
}
