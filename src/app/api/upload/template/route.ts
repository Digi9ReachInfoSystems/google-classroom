import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface TemplateData {
	headers: string[];
	sampleData: string[][];
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'students';

    let templateData: TemplateData;

    if (type === 'workspace-accounts') {
      templateData = {
        headers: [
          'firstName', 
          'lastName', 
          'email', 
          'password', 
          'role', 
          'orgUnitPath', 
          'suspended', 
          'changePasswordAtNextLogin', 
          'recoveryEmail', 
          'recoveryPhone'
        ],
        sampleData: [
          [
            'John', 
            'Doe', 
            'john.doe@yourschool.edu', 
            'TempPassword123!', 
            'student', 
            '/Students', 
            'false', 
            'true', 
            'john.doe.recovery@gmail.com', 
            '+1234567890'
          ],
          [
            'Jane', 
            'Smith', 
            'jane.smith@yourschool.edu', 
            'TempPassword456!', 
            'teacher', 
            '/Teachers', 
            'false', 
            'true', 
            'jane.smith.recovery@gmail.com', 
            '+1234567891'
          ],
          [
            'Bob', 
            'Johnson', 
            'bob.johnson@yourschool.edu', 
            'AdminPass789!', 
            'admin', 
            '/Admins', 
            'false', 
            'true', 
            'bob.johnson.recovery@gmail.com', 
            '+1234567892'
          ]
        ]
      };
    } else if (type === 'courses') {
      templateData = {
        headers: [
          'name',
          'section',
          'descriptionHeading',
          'description',
          'room',
          'courseState',
          'ownerId'
        ],
        sampleData: [
          [
            'Mathematics 101',
            'Section A',
            'Course Overview',
            'Introduction to basic mathematics concepts',
            'Room 201',
            'ACTIVE',
            'teacher@yourschool.edu'
          ],
          [
            'English Literature',
            'Section B',
            'Course Description',
            'Study of classic and modern literature',
            'Room 105',
            'ACTIVE',
            'teacher2@yourschool.edu'
          ],
          [
            'Science Lab',
            'Lab Section 1',
            'Laboratory Information',
            'Hands-on science experiments and observations',
            'Lab Room 301',
            'ACTIVE',
            'science.teacher@yourschool.edu'
          ]
        ]
      };
    } else if (type === 'students') {
      templateData = {
        headers: ['Name', 'Email', 'Role', 'State', 'District', 'Gender'],
        sampleData: [
          ['John Doe', 'john.doe@example.com', 'student', 'California', 'Los Angeles', 'Male'],
          ['Jane Smith', 'jane.smith@example.com', 'student', 'California', 'San Francisco', 'Female'],
          ['Bob Johnson', 'bob.johnson@example.com', 'student', 'California', 'Los Angeles', 'Male']
        ]
      };
    } else {
      templateData = {
        headers: ['Name', 'Email', 'Role'],
        sampleData: [
          ['John Doe', 'john.doe@example.com', 'teacher'],
          ['Jane Smith', 'jane.smith@example.com', 'teacher']
        ]
      };
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([templateData.headers, ...templateData.sampleData]);
    
    // Add worksheet to workbook
    const sheetName = type === 'workspace-accounts' ? 'Workspace Accounts' : 
                     type === 'courses' ? 'Courses' :
                     type === 'students' ? 'Students' : 'Teachers';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

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
