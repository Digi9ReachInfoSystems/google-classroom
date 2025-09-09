import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { getAdminDirectory } from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WorkspaceAccountData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  orgUnitPath?: string;
  suspended?: boolean;
  changePasswordAtNextLogin?: boolean;
  recoveryEmail?: string;
  recoveryPhone?: string;
  rowNumber: number;
}

interface GoogleError {
  code?: number;
  message?: string;
  status?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value;
    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ message: 'No data to upload' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Initialize Google Admin Directory API
    const adminDirectory = getAdminDirectory();

    const results = {
      total: data.length,
      success: 0,
      errors: [] as string[],
      duplicates: 0,
      skipped: 0
    };

    // Process each workspace account
    for (const row of data as WorkspaceAccountData[]) {
      try {
        // Validate required fields
        if (!row.firstName || !row.lastName || !row.email || !row.password) {
          results.errors.push(`Row ${row.rowNumber}: Missing required fields (firstName, lastName, email, password)`);
          results.skipped++;
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          results.errors.push(`Row ${row.rowNumber}: Invalid email format: ${row.email}`);
          results.skipped++;
          continue;
        }

        // Validate role
        const validRoles = ['student', 'teacher', 'admin'];
        if (!validRoles.includes(row.role.toLowerCase())) {
          results.errors.push(`Row ${row.rowNumber}: Invalid role: ${row.role}. Must be student, teacher, or admin`);
          results.skipped++;
          continue;
        }

        // Check if user already exists in Google Workspace
        try {
          await adminDirectory.users.get({ userKey: row.email });
          results.duplicates++;
          continue;
        } catch (error) {
          const googleError = error as GoogleError;
          if (googleError.code !== 404) {
            // If it's not a "not found" error, something else went wrong
            results.errors.push(`Row ${row.rowNumber}: Error checking existing user: ${googleError.message}`);
            results.skipped++;
            continue;
          }
          // User doesn't exist, which is what we want
        }

        // Prepare user data for Google Workspace
        const userData: Record<string, unknown> = {
          primaryEmail: row.email,
          name: {
            givenName: row.firstName,
            familyName: row.lastName,
            fullName: `${row.firstName} ${row.lastName}`
          },
          password: row.password,
          suspended: row.suspended || false,
          changePasswordAtNextLogin: row.changePasswordAtNextLogin !== undefined ? row.changePasswordAtNextLogin : true
        };

        // Add optional fields
        if (row.orgUnitPath) {
          userData.orgUnitPath = row.orgUnitPath;
        }

        if (row.recoveryEmail) {
          userData.recoveryEmail = row.recoveryEmail;
        }

        if (row.recoveryPhone) {
          userData.recoveryPhone = row.recoveryPhone;
        }

        // Create user in Google Workspace
        try {
          const createdUser = await adminDirectory.users.insert({
            requestBody: userData
          });

          // Save user to our database
          const dbUserData = {
            email: row.email,
            fullName: `${row.firstName} ${row.lastName}`,
            givenName: row.firstName,
            familyName: row.lastName,
            role: row.role.toLowerCase() as 'student' | 'teacher' | 'admin',
            externalId: createdUser.data.id || row.email
          };

          await UserModel.findOneAndUpdate(
            { email: row.email },
            { $set: dbUserData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          results.success++;

        } catch (googleError: unknown) {
          console.error(`Error creating user ${row.email}:`, googleError);
          
          if ((googleError as { code?: number }).code === 409) {
            // User already exists
            results.duplicates++;
          } else if ((googleError as { code?: number }).code === 400) {
            // Bad request - invalid data
            results.errors.push(`Row ${row.rowNumber}: ${row.email} - Invalid user data: ${googleError instanceof Error ? googleError.message : String(googleError)}`);
            results.skipped++;
          } else if ((googleError as { code?: number }).code === 403) {
            // Permission denied
            results.errors.push(`Row ${row.rowNumber}: ${row.email} - Permission denied. Make sure you have admin privileges`);
            results.skipped++;
          } else {
            results.errors.push(`Row ${row.rowNumber}: ${row.email} - ${googleError instanceof Error ? googleError.message : 'Unknown error creating user'}`);
            results.skipped++;
          }
        }

      } catch (error) {
        console.error(`Error processing row ${row.rowNumber}:`, error);
        results.errors.push(`Row ${row.rowNumber}: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      message: 'Workspace account creation completed',
      results
    });

  } catch (error) {
    console.error('Error in workspace account creation:', error);
    return NextResponse.json({ 
      message: 'Failed to create workspace accounts',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
    }, { status: 500 });
  }
}
