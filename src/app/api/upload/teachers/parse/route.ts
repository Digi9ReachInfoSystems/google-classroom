import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface ProcessedRow {
	name: string;
	email: string;
	role: string;
	rowNumber: number;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' }, { status: 400 });
    }

    // Read the file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 2) {
      return NextResponse.json({ message: 'Excel file must have at least a header row and one data row' }, { status: 400 });
    }

    // Extract headers and data
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1) as unknown[][];

    // Validate required headers
    const requiredHeaders = ['Name', 'Email', 'Role'];
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        message: `Missing required headers: ${missingHeaders.join(', ')}. Please use the template.` 
      }, { status: 400 });
    }

    // Process data rows
    const processedData = dataRows
      .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
      .map((row, index) => {
        const rowData: Partial<ProcessedRow> = {};
        
        headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          const headerLower = header.toLowerCase();
          
          if (headerLower.includes('name')) {
            rowData.name = String(value || '').trim();
          } else if (headerLower.includes('email')) {
            rowData.email = String(value || '').trim().toLowerCase();
          } else if (headerLower.includes('role')) {
            rowData.role = String(value || '').trim().toLowerCase();
          }
        });

        return {
          ...rowData,
          rowNumber: index + 2 // +2 because we start from row 2 (after header)
        } as ProcessedRow;
      })
      .filter(row => row.name && row.email && row.role);

    // Validate data
    const errors: string[] = [];
    const validData = processedData.filter((row) => {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push(`Row ${row.rowNumber}: Invalid email format`);
        return false;
      }

      // Role validation - only accept teachers for this endpoint
      if (row.role !== 'teacher') {
        errors.push(`Row ${row.rowNumber}: Role must be 'teacher' for this upload. Found: '${row.role}'`);
        return false;
      }

      return true;
    });

    if (errors.length > 0) {
      return NextResponse.json({ 
        message: 'Validation errors found', 
        errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'File parsed successfully',
      data: validData,
      totalRows: dataRows.length,
      validRows: validData.length
    });

  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return NextResponse.json({ 
      message: 'Failed to parse Excel file. Please check the file format.' 
    }, { status: 500 });
  }
}
