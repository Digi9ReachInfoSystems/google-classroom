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

    // Check if we have permission to add students to this course
    try {
      const courseInfo = await classroom.courses.get({ id: courseId });
      console.log('Course info:', courseInfo.data);
    } catch (error) {
      console.error('Error accessing course:', error);
      return NextResponse.json({ 
        message: 'Cannot access this course. Please check your permissions.' 
      }, { status: 403 });
    }

    const results = {
      total: data.length,
      success: 0,
      errors: [] as string[],
      duplicates: 0,
      skipped: 0
    };

    // Process each student
    for (const row of data) {
      try {
        // Check if user already exists in our database
        let user = await UserModel.findOne({ email: row.email });
        
        if (!user) {
          // Create user in our database first
          const userData = {
            email: row.email,
            fullName: row.name,
            role: 'student',
            state: row.state || '',
            district: row.district || '',
            gender: row.gender || '',
            externalId: row.email,
            givenName: row.name.split(' ')[0] || '',
            familyName: row.name.split(' ').slice(1).join(' ') || ''
          };

          user = await UserModel.create(userData);
        }

        // Check if student is already in the course
        try {
          const existingStudents = await classroom.courses.students.list({
            courseId,
            pageSize: 1000
          });

          const isAlreadyEnrolled = existingStudents.data.students?.some(
            (student: any) => student.profile?.emailAddress === row.email
          );

          if (isAlreadyEnrolled) {
            results.duplicates++;
            continue;
          }
        } catch (error) {
          console.error('Error checking existing students:', error);
        }

        // Add student to Google Classroom course
        try {
          await classroom.courses.students.create({
            courseId,
            requestBody: {
              userId: row.email // Use email as userId
            }
          });

          results.success++;
                  } catch (googleError: any) {
            console.error(`Error adding student ${row.email} to course:`, googleError);
            
            if (googleError.code === 409) {
              // Student already exists in course
              results.duplicates++;
            } else if (googleError.code === 403) {
              // Permission denied - check specific error
              if (googleError.message?.includes('does not have permission')) {
                results.errors.push(`Row ${row.rowNumber}: ${row.email} - Insufficient permissions to add students to this course. Only course owners can add students.`);
              } else {
                results.errors.push(`Row ${row.rowNumber}: ${row.email} - User not found in Google Workspace or insufficient permissions`);
              }
              results.skipped++;
            } else if (googleError.code === 400) {
              // Bad request - might be invalid email format
              results.errors.push(`Row ${row.rowNumber}: ${row.email} - Invalid email format or user not found`);
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
