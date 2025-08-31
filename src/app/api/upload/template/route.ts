import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'students';

    let headers: string[];
    let sampleData: any[][];

    if (type === 'students') {
      headers = ['Name', 'Email', 'Role', 'State', 'District', 'Gender'];
      sampleData = [
        ['John Doe', 'john.doe@example.com', 'student', 'California', 'Los Angeles', 'Male'],
        ['Jane Smith', 'jane.smith@example.com', 'student', 'California', 'San Francisco', 'Female'],
        ['Bob Johnson', 'bob.johnson@example.com', 'student', 'California', 'Los Angeles', 'Male']
      ];
    } else {
      headers = ['Name', 'Email', 'Role'];
      sampleData = [
        ['John Doe', 'john.doe@example.com', 'teacher'],
        ['Jane Smith', 'jane.smith@example.com', 'teacher']
      ];
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, type === 'students' ? 'Students' : 'Teachers');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}-bulk-upload-template.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ 
      message: 'Failed to generate template' 
    }, { status: 500 });
  }
}
