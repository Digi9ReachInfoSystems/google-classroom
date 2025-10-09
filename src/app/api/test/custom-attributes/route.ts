import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { createUserOAuthClient } from '@/lib/user-oauth';
import { google } from 'googleapis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test API to fetch custom attributes from Google Workspace Admin Directory
 * Uses the logged-in admin's OAuth credentials (not service account)
 * 
 * Usage: 
 * GET /api/test/custom-attributes?email=student@digi9.co.in
 * GET /api/test/custom-attributes (fetches for current logged-in user)
 */
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

    // Check if we have OAuth tokens
    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'No OAuth tokens found. Please log in again via Google OAuth.' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const testEmail = searchParams.get('email') || payload.email;

    console.log('=== Testing Custom Attributes Fetch (OAuth) ===');
    console.log('Admin user:', payload.email);
    console.log('Target email:', testEmail);
    console.log('Using OAuth credentials');

    // Create OAuth client with admin's credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });

    // Get Admin Directory service with OAuth
    const admin = google.admin({ version: 'directory_v1', auth: oauth2Client });

    // Fetch user with full projection to get custom schemas
    console.log('Fetching user data with full projection...');
    const userResponse = await admin.users.get({
      userKey: testEmail,
      projection: 'full'
    });

    const userData = userResponse.data;
    console.log('User data received:', userData);

    // Extract custom schemas
    const customSchemas = userData.customSchemas || {};
    console.log('Custom schemas found:', Object.keys(customSchemas));

    // Extract specific profiles
    const studentProfile = customSchemas['StudentProfile'] || null;
    const teacherProfile = customSchemas['TeacherProfile'] || null;

    console.log('StudentProfile:', studentProfile);
    console.log('TeacherProfile:', teacherProfile);

    // Prepare response
    const result = {
      success: true,
      email: testEmail,
      timestamp: new Date().toISOString(),
      
      basicInfo: {
        primaryEmail: userData.primaryEmail,
        name: userData.name,
        isAdmin: userData.isAdmin,
        isDelegatedAdmin: userData.isDelegatedAdmin,
        orgUnitPath: userData.orgUnitPath,
      },

      customSchemas: {
        available: Object.keys(customSchemas),
        raw: customSchemas
      },

      studentProfile: studentProfile ? {
        raw: studentProfile,
        extracted: {
          Gender: studentProfile.Gender || studentProfile.gender || null,
          District: studentProfile.District || studentProfile.district || null,
          Grade: studentProfile.Grade || studentProfile.grade || null,
          SchoolName: studentProfile.SchoolName || studentProfile.schoolName || studentProfile.schoolname || null,
          Age: studentProfile.Age || studentProfile.age || null,
        }
      } : null,

      teacherProfile: teacherProfile ? {
        raw: teacherProfile,
        extracted: {
          SchoolName: teacherProfile.SchoolName || teacherProfile.schoolName || teacherProfile.schoolname || null,
          District: teacherProfile.District || teacherProfile.district || null,
          Gender: teacherProfile.Gender || teacherProfile.gender || null,
        }
      } : null,

      whatWillBeStoredInMongoDB: studentProfile ? {
        role: 'student',
        gender: studentProfile.Gender || studentProfile.gender,
        district: studentProfile.District || studentProfile.district,
        grade: studentProfile.Grade || studentProfile.grade,
        schoolName: studentProfile.SchoolName || studentProfile.schoolName || studentProfile.schoolname,
        age: studentProfile.Age || studentProfile.age,
      } : teacherProfile ? {
        role: 'teacher',
        schoolName: teacherProfile.SchoolName || teacherProfile.schoolName || teacherProfile.schoolname,
        district: teacherProfile.District || teacherProfile.district,
        gender: teacherProfile.Gender || teacherProfile.gender,
      } : {
        message: 'No custom profile found for this user'
      },

      recommendations: []
    };

    // Add recommendations based on what we found
    if (!studentProfile && !teacherProfile) {
      result.recommendations.push('⚠️ No custom schemas found. Please configure StudentProfile or TeacherProfile in Google Workspace Admin Console.');
    }

    if (studentProfile) {
      if (!studentProfile.Gender && !studentProfile.gender) {
        result.recommendations.push('⚠️ StudentProfile.Gender is missing');
      }
      if (!studentProfile.District && !studentProfile.district) {
        result.recommendations.push('⚠️ StudentProfile.District is missing');
      }
      if (!studentProfile.Grade && !studentProfile.grade) {
        result.recommendations.push('⚠️ StudentProfile.Grade is missing');
      }
      if (!studentProfile.SchoolName && !studentProfile.schoolName && !studentProfile.schoolname) {
        result.recommendations.push('⚠️ StudentProfile.SchoolName is missing');
      }
      if (!studentProfile.Age && !studentProfile.age) {
        result.recommendations.push('⚠️ StudentProfile.Age is missing');
      }
    }

    if (teacherProfile) {
      if (!teacherProfile.SchoolName && !teacherProfile.schoolName && !teacherProfile.schoolname) {
        result.recommendations.push('⚠️ TeacherProfile.SchoolName is missing');
      }
      if (!teacherProfile.District && !teacherProfile.district) {
        result.recommendations.push('⚠️ TeacherProfile.District is missing');
      }
      if (!teacherProfile.Gender && !teacherProfile.gender) {
        result.recommendations.push('⚠️ TeacherProfile.Gender is missing');
      }
    }

    if (result.recommendations.length === 0) {
      result.recommendations.push('✅ All custom attributes configured correctly!');
    }

    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching custom attributes:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch custom attributes',
      error: error.message || 'Unknown error',
      errorCode: error.code,
      errorDetails: error.errors,
      timestamp: new Date().toISOString(),
      troubleshooting: [
        'Verify service account has Admin SDK API enabled',
        'Check if domain-wide delegation includes admin.directory.user.readonly scope',
        'Ensure custom schemas (StudentProfile, TeacherProfile) exist in Google Workspace',
        'Verify the user email exists in Google Workspace',
        'Check if custom attributes are populated for this user'
      ]
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

/**
 * Test multiple users at once
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { emails } = await req.json();
    
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please provide an array of emails' 
      }, { status: 400 });
    }

    console.log(`Testing custom attributes for ${emails.length} users`);

    // Create OAuth client with admin's credentials
    const oauth2Client = createUserOAuthClient({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });

    const admin = google.admin({ version: 'directory_v1', auth: oauth2Client });
    const results = [];

    for (const email of emails) {
      try {
        const userResponse = await admin.users.get({
          userKey: email,
          projection: 'full'
        });

        const customSchemas = userResponse.data.customSchemas || {};
        const studentProfile = customSchemas['StudentProfile'] || null;
        const teacherProfile = customSchemas['TeacherProfile'] || null;

        results.push({
          email,
          success: true,
          hasStudentProfile: !!studentProfile,
          hasTeacherProfile: !!teacherProfile,
          studentProfile: studentProfile ? {
            Gender: studentProfile.Gender || studentProfile.gender,
            District: studentProfile.District || studentProfile.district,
            Grade: studentProfile.Grade || studentProfile.grade,
            SchoolName: studentProfile.SchoolName || studentProfile.schoolName || studentProfile.schoolname,
            Age: studentProfile.Age || studentProfile.age,
          } : null,
          teacherProfile: teacherProfile ? {
            SchoolName: teacherProfile.SchoolName || teacherProfile.schoolName || teacherProfile.schoolname,
            District: teacherProfile.District || teacherProfile.district,
            Gender: teacherProfile.Gender || teacherProfile.gender,
          } : null
        });
      } catch (error: any) {
        results.push({
          email,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalUsers: emails.length,
      results,
      summary: {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        withStudentProfile: results.filter(r => r.hasStudentProfile).length,
        withTeacherProfile: results.filter(r => r.hasTeacherProfile).length,
      }
    });

  } catch (error: any) {
    console.error('Error in bulk custom attributes test:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to test custom attributes',
      error: error.message
    }, { status: 500 });
  }
}