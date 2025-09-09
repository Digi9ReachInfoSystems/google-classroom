import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WorkspaceAccountRow {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  orgUnitPath?: string;
  suspended?: string | boolean;
  changePasswordAtNextLogin?: string | boolean;
  recoveryEmail?: string;
  recoveryPhone?: string;
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
    const rows = XLSX.utils.sheet_to_json<WorkspaceAccountRow>(sheet, { defval: '' });

    const data = rows.map((row, index) => {
      const email = String(row.email || '').trim().toLowerCase();
      const firstName = String(row.firstName || '').trim();
      const lastName = String(row.lastName || '').trim();
      const password = String(row.password || '').trim();
      const role = String(row.role || 'student').trim().toLowerCase();
      const orgUnitPath = String(row.orgUnitPath || '').trim();
      const recoveryEmail = String(row.recoveryEmail || '').trim();
      const recoveryPhone = String(row.recoveryPhone || '').trim();

      // Convert string booleans to actual booleans
      let suspended = false;
      if (typeof row.suspended === 'boolean') {
        suspended = row.suspended;
      } else if (typeof row.suspended === 'string') {
        const suspendedStr = row.suspended.toLowerCase();
        suspended = suspendedStr === 'true' || suspendedStr === '1' || suspendedStr === 'yes';
      }

      let changePasswordAtNextLogin = true; // Default to true for security
      if (typeof row.changePasswordAtNextLogin === 'boolean') {
        changePasswordAtNextLogin = row.changePasswordAtNextLogin;
      } else if (typeof row.changePasswordAtNextLogin === 'string') {
        const changePasswordStr = row.changePasswordAtNextLogin.toLowerCase();
        changePasswordAtNextLogin = changePasswordStr === 'true' || changePasswordStr === '1' || changePasswordStr === 'yes';
      }

      return {
        firstName,
        lastName,
        email,
        password,
        role,
        orgUnitPath: orgUnitPath || undefined,
        suspended,
        changePasswordAtNextLogin,
        recoveryEmail: recoveryEmail || undefined,
        recoveryPhone: recoveryPhone || undefined,
        rowNumber: index + 2 // Excel row number (header is row 1)
      };
    }).filter(row => row.email && row.firstName && row.lastName && row.password); // Only include rows with required fields

    return NextResponse.json({
      message: 'File parsed successfully',
      data,
      count: data.length
    });

  } catch (error) {
    console.error('Error parsing workspace accounts file:', error);
    return NextResponse.json({ 
      message: 'Failed to parse file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
