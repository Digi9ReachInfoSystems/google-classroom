import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CourseRow {
  name?: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  courseState?: string;
  ownerId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Read the Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<CourseRow>(sheet, { defval: '' });

    const data = rows.map((row, index) => {
      const name = String(row.name || '').trim();
      const section = String(row.section || '').trim();
      const descriptionHeading = String(row.descriptionHeading || '').trim();
      const description = String(row.description || '').trim();
      const room = String(row.room || '').trim();
      const courseState = String(row.courseState || 'ACTIVE').trim().toUpperCase();
      const ownerId = String(row.ownerId || '').trim();

      // Validate course state
      const validStates = ['ACTIVE', 'ARCHIVED', 'PROVISIONED', 'DECLINED', 'SUSPENDED'];
      const finalCourseState = validStates.includes(courseState) ? courseState : 'ACTIVE';

      return {
        name,
        section: section || undefined,
        descriptionHeading: descriptionHeading || undefined,
        description: description || undefined,
        room: room || undefined,
        courseState: finalCourseState as 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED',
        ownerId: ownerId || undefined,
        rowNumber: index + 2 // Excel row number (header is row 1)
      };
    }).filter(row => row.name); // Only include rows with course name

    return NextResponse.json({
      message: 'File parsed successfully',
      data,
      count: data.length
    });

  } catch (error) {
    console.error('Error parsing courses file:', error);
    return NextResponse.json({ 
      message: 'Failed to parse file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
