import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      'check-coursework-ownership': 'GET /api/student/check-coursework-ownership?courseId=123&courseWorkId=456',
      'manual-turnin': 'POST /api/student/manual-turnin',
      'mark-as-done': 'POST /api/student/mark-as-done',
      'oauth-scopes-current': 'GET /api/oauth-scopes/current'
    },
    note: 'All endpoints require authentication except this one'
  });
}
