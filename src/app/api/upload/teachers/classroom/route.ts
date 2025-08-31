import { NextRequest, NextResponse } from 'next/server';
import { getClassroom } from '@/lib/google';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { data, courseId } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
    }

    if (!courseId) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ message: 'No data to upload' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();
    
    // Initialize Google Classroom API
    const classroom = getClassroom();

    const results = {
      total: data.length,
      success: 0,
      errors: [] as string[],
      duplicates: 0,
      skipped: 0
    };

    // Process each teacher
    for (const row of data) {
      try {
        // Check if user already exists in our database
        let user = await UserModel.findOne({ email: row.email });
        
        if (!user) {
          // Create user in our database first
          const userData = {
            email: row.email,
            fullName: row.name,
            role: 'teacher',
            externalId: row.email,
            givenName: row.name.split(' ')[0] || '',
            familyName: row.name.split(' ').slice(1).join(' ') || ''
          };

          user = await UserModel.create(userData);
        }

        // Check if teacher is already in the course
        try {
          const existingTeachers = await classroom.courses.teachers.list({
            courseId,
            pageSize: 1000
          });

          const isAlreadyEnrolled = existingTeachers.data.teachers?.some(
            (teacher: any) => teacher.profile?.emailAddress === row.email
          );

          if (isAlreadyEnrolled) {
            results.duplicates++;
            continue;
          }
        } catch (error) {
          console.error('Error checking existing teachers:', error);
        }

        // Add teacher to Google Classroom course
        try {
          await classroom.courses.teachers.create({
            courseId,
            requestBody: {
              userId: row.email // Use email as userId
            }
          });

          results.success++;
        } catch (googleError: any) {
          console.error(`Error adding teacher ${row.email} to course:`, googleError);
          
          if (googleError.code === 409) {
            // Teacher already exists in course
            results.duplicates++;
          } else if (googleError.code === 403) {
            // Permission denied - user might not exist in Google Workspace or insufficient permissions
            results.errors.push(`Row ${row.rowNumber}: ${row.email} - User not found in Google Workspace or insufficient permissions`);
            results.skipped++;
          } else {
            results.errors.push(`Row ${row.rowNumber}: ${row.email} - ${googleError.message || 'Unknown error'}`);
            results.skipped++;
          }
        }

      } catch (error) {
        console.error(`Error processing row ${row.rowNumber}:`, error);
        results.errors.push(`Row ${row.rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      message: 'Upload to Google Classroom completed',
      results
    });

  } catch (error) {
    console.error('Error in Google Classroom upload:', error);
    return NextResponse.json({ 
      message: 'Failed to process upload to Google Classroom' 
    }, { status: 500 });
  }
}
