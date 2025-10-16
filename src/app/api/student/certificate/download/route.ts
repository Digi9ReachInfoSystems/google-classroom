import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CertificateModel } from '@/models/Certificate';

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

    // Generate simple HTML certificate (will be converted to PDF by browser)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Georgia', serif;
    }
    .certificate {
      width: 297mm;
      height: 210mm;
      padding: 40px 60px;
      box-sizing: border-box;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .certificate-border {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      pointer-events: none;
    }
    .certificate-content {
      background: white;
      padding: 60px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 800px;
      position: relative;
      z-index: 1;
    }
    h1 {
      font-size: 48px;
      color: #667eea;
      margin: 0 0 10px 0;
      font-weight: 700;
      letter-spacing: 2px;
    }
    .subtitle {
      font-size: 20px;
      color: #666;
      margin: 0 0 40px 0;
      font-style: italic;
    }
    .recipient {
      font-size: 36px;
      color: #333;
      margin: 20px 0;
      font-weight: 600;
      border-bottom: 2px solid #667eea;
      display: inline-block;
      padding-bottom: 10px;
    }
    .course-name {
      font-size: 24px;
      color: #555;
      margin: 20px 0;
      font-weight: 500;
    }
    .description {
      font-size: 16px;
      color: #777;
      margin: 30px 0;
      line-height: 1.6;
    }
    .details {
      display: flex;
      justify-content: space-around;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #eee;
    }
    .detail-item {
      text-align: center;
    }
    .detail-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    .detail-value {
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }
    .seal {
      position: absolute;
      bottom: 30px;
      right: 60px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: radial-gradient(circle, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
      border: 4px solid #d4af37;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #8b6914;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="certificate-border"></div>
    <div class="certificate-content">
      <h1>CERTIFICATE</h1>
      <p class="subtitle">of Completion</p>
      
      <p style="font-size: 18px; color: #666; margin: 20px 0;">This is to certify that</p>
      
      <div class="recipient">${certificate.studentName}</div>
      
      <p style="font-size: 18px; color: #666; margin: 20px 0;">has successfully completed</p>
      
      <div class="course-name">${certificate.courseName}</div>
      
      <p class="description">
        This certificate is awarded in recognition of completing all course requirements including
        pre-survey, learning modules, idea submission, and post-survey with 100% completion.
      </p>
      
      <div class="details">
        <div class="detail-item">
          <div class="detail-label">Certificate No.</div>
          <div class="detail-value">${certificate.certificateNumber}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Date Issued</div>
          <div class="detail-value">${new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Modules Completed</div>
          <div class="detail-value">${certificate.completionData.completedModules}/${certificate.completionData.totalModules}</div>
        </div>
      </div>
      
      <div class="seal">
        VERIFIED<br/>AUTHENTIC
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="certificate-${certificate.certificateNumber}.html"`
      }
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

