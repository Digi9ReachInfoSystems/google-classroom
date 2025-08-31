import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ message: 'No data to upload' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Process upload in batches
    const batchSize = 100;
    const results = {
      total: data.length,
      success: 0,
      errors: [] as string[],
      duplicates: 0
    };

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          // Check for existing user
          const existingUser = await UserModel.findOne({ email: row.email });
          
          if (existingUser) {
            results.duplicates++;
            continue;
          }

          // Create new user
          const userData = {
            email: row.email,
            fullName: row.name,
            role: row.role,
            externalId: row.email, // Use email as external ID for now
            givenName: row.name.split(' ')[0] || '',
            familyName: row.name.split(' ').slice(1).join(' ') || ''
          };

          await UserModel.create(userData);
          results.success++;

        } catch (error) {
          console.error(`Error processing row ${row.rowNumber}:`, error);
          results.errors.push(`Row ${row.rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      message: 'Upload completed',
      results
    });

  } catch (error) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json({ 
      message: 'Failed to process upload' 
    }, { status: 500 });
  }
}
