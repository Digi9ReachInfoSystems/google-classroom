import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== 'super-admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    if (!payload.accessToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No OAuth credentials found' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseIdParam = searchParams.get('courseId');
    const schoolName = searchParams.get('schoolName');
    const district = searchParams.get('district');

    if (!courseIdParam) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course ID is required' 
      }, { status: 400 });
    }

    // TypeScript type assertion after null check
    const courseId = courseIdParam as string;

    await connectToDatabase();

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });

    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    const forms = google.forms({ version: 'v1', auth: oauth2Client });

    // Fetch coursework to find "Idea Submission" assignment
    const courseworkResponse = await classroom.courses.courseWork.list({
      courseId: courseId,
      pageSize: 100
    });

    const allCoursework = courseworkResponse.data.courseWork || [];
    const ideaCoursework = allCoursework.find((cw: any) => 
      cw.title && cw.title.toLowerCase().includes('idea')
    );

    if (!ideaCoursework) {
      return NextResponse.json({
        success: true,
        totalStudents: 0,
        totalIdeasSubmitted: 0,
        submittedPercentage: 0,
        ideas: []
      });
    }

    // Get the idea submission form URL and extract form ID
    let ideaFormUrl = '';
    let formId = '';
    if (ideaCoursework.materials) {
      for (const material of ideaCoursework.materials) {
        if (material.form && material.form.formUrl) {
          ideaFormUrl = material.form.formUrl;
          // Extract form ID from URL
          const formIdMatch = ideaFormUrl.match(/\/forms\/d\/e\/([^\/]+)/);
          if (formIdMatch) {
            formId = formIdMatch[1];
          }
          break;
        }
      }
    }

    // Fetch form responses if form ID is available
    let formResponsesMap = new Map<string, any>();
    if (formId) {
      try {
        console.log('Fetching form responses for form ID:', formId);
        const formResponse = await forms.forms.responses.list({
          formId: formId
        });

        const responses = formResponse.data.responses || [];
        console.log(`Found ${responses.length} form responses`);

        // Map responses by respondent email
        for (const response of responses) {
          const email = response.respondentEmail;
          if (email) {
            const answers = response.answers || {};
            const answerValues: any = {};
            
            for (const [questionId, answer] of Object.entries(answers)) {
              const textAnswers = (answer as any).textAnswers?.answers || [];
              if (textAnswers.length > 0) {
                answerValues[questionId] = textAnswers[0].value;
              }
            }
            
            formResponsesMap.set(email, {
              responseId: response.responseId,
              createTime: response.createTime,
              lastSubmittedTime: response.lastSubmittedTime,
              answers: answerValues
            });
          }
        }

        // Fetch form structure to get question titles
        const formStructure = await forms.forms.get({
          formId: formId
        });

        const formItems = formStructure.data.items || [];
        const questionTitles = new Map<string, string>();
        
        for (const item of formItems) {
          if (item.questionItem && item.questionItem.question) {
            const questionId = item.questionItem.question.questionId;
            const title = item.title || '';
            if (questionId) {
              questionTitles.set(questionId, title);
            }
          }
        }

        // Update responses map with question titles
        formResponsesMap.forEach((responseData, email) => {
          const answersWithTitles: any = {};
          for (const [questionId, value] of Object.entries(responseData.answers)) {
            const questionTitle = questionTitles.get(questionId) || questionId;
            answersWithTitles[questionTitle] = value;
          }
          responseData.answersWithTitles = answersWithTitles;
        });

        console.log('Form responses mapped:', formResponsesMap.size);
      } catch (formError) {
        console.error('Error fetching form responses:', formError);
      }
    }

    // Fetch all students in the course
    const studentsResponse = await classroom.courses.students.list({
      courseId: courseId,
      pageSize: 100
    });

    const allStudents = studentsResponse.data.students || [];

    // Build query for filtering students by district/school
    const studentQuery: any = { role: 'student' };
    if (schoolName && schoolName !== 'All') studentQuery.schoolName = schoolName;
    if (district && district !== 'All') studentQuery.district = district;

    // Get filtered student emails from database
    const dbStudents = await UserModel.find(studentQuery).select('email fullName givenName familyName schoolName district');
    const filteredStudentEmails = new Set(dbStudents.map(s => s.email));

    // Filter Google Classroom students by our database filter
    const students = allStudents.filter((student: any) => 
      filteredStudentEmails.has(student.profile?.emailAddress)
    );

    // Fetch submissions for the idea assignment
    const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
      courseId: courseId!,
      courseWorkId: ideaCoursework.id!,
      pageSize: 100
    });

    const submissions = submissionsResponse.data.studentSubmissions || [];

    // Build ideas data
    const ideas = students.map((student: any) => {
      const studentEmail = student.profile?.emailAddress || '';
      const studentName = student.profile?.name?.fullName || 'Unknown';
      
      // Get school name and district from database
      const dbStudent = dbStudents.find(s => s.email === studentEmail);
      const schoolNameValue = dbStudent?.schoolName || '-';
      const districtValue = dbStudent?.district || '-';
      
      const submission = submissions.find((sub: any) => sub.userId === studentEmail);
      const isSubmitted = submission?.state === 'TURNED_IN' || submission?.state === 'RETURNED';
      
      // Get form response data for this student
      const formResponse = formResponsesMap.get(studentEmail);
      let ideaTitle = '-';
      let category = '-';
      
      if (formResponse && formResponse.answersWithTitles) {
        const answers = formResponse.answersWithTitles;
        
        // Try to find idea title and category
        for (const [question, answer] of Object.entries(answers)) {
          const q = question.toLowerCase();
          if ((q.includes('title') || q.includes('idea name') || q.includes('project name')) && ideaTitle === '-') {
            ideaTitle = answer as string || '-';
          }
          if ((q.includes('category') || q.includes('type')) && category === '-') {
            category = answer as string || '-';
          }
        }
        
        // Fallback to first two answers
        if (ideaTitle === '-' && Object.keys(answers).length > 0) {
          const firstAnswer = Object.values(answers)[0];
          if (firstAnswer) ideaTitle = firstAnswer as string;
        }
        if (category === '-' && Object.keys(answers).length > 1) {
          const secondAnswer = Object.values(answers)[1];
          if (secondAnswer) category = secondAnswer as string;
        }
      }
      
      return {
        studentName,
        studentEmail,
        schoolName: schoolNameValue,
        district: districtValue,
        ideaTitle,
        category,
        dateSubmitted: isSubmitted && submission.updateTime 
          ? new Date(submission.updateTime).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          : (formResponse?.lastSubmittedTime 
              ? new Date(formResponse.lastSubmittedTime).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })
              : '-'),
        status: isSubmitted ? 'completed' : 'pending',
        fileUrl: ideaFormUrl || undefined // Show form link for all students if available
      };
    });

    const totalIdeasSubmitted = ideas.filter(i => i.status === 'completed').length;

    return NextResponse.json({
      success: true,
      totalStudents: students.length,
      totalIdeasSubmitted,
      submittedPercentage: students.length > 0 ? Math.round((totalIdeasSubmitted / students.length) * 100) : 0,
      ideas
    });

  } catch (error) {
    console.error('Super admin ideas API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

