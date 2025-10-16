import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CertificateModel } from '@/models/Certificate';
import { createCanvas, loadImage } from 'canvas';
import { jsPDF } from 'jspdf';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const studentEmail = payload.email;

    // Get certificate
    const certificate = await CertificateModel.findOne({
      studentEmail,
      courseId
    });

    if (!certificate) {
      return NextResponse.json({
        success: false,
        message: 'Certificate not found'
      }, { status: 404 });
    }


    // Load certificate images
    const frontImagePath = path.join(process.cwd(), 'public', 'student', 'Certificate_Front.jpg');
    const rearImagePath = path.join(process.cwd(), 'public', 'student', 'Certificate_Rear.jpg');
    
    const frontImage = await loadImage(frontImagePath);
    const rearImage = await loadImage(rearImagePath);

    // Create canvas to add student name to front image
    const canvas = createCanvas(frontImage.width, frontImage.height);
    const ctx = canvas.getContext('2d');

    // Draw the front certificate image
    ctx.drawImage(frontImage, 0, 0);

    // Set font properties for the name
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillStyle = '#1a365d'; // Dark blue color
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate position for the name (adjust these coordinates based on your certificate design)
    const nameX = frontImage.width / 2;
    const nameY = frontImage.height * 0.45; // Adjust this value to position the name correctly

    // Draw the student name
    ctx.fillText(certificate.studentName, nameX, nameY);

    // Convert canvas to base64
    const frontImageWithName = canvas.toDataURL('image/jpeg', 0.9);
    const rearImageBase64 = rearImage.toDataURL('image/jpeg', 0.9);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Get PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Add front page
    pdf.addImage(frontImageWithName, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // Add new page for rear
    pdf.addPage();
    pdf.addImage(rearImageBase64, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return the PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Certificate download API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

