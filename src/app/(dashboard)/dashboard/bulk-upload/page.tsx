"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BulkUpload from '@/components/BulkUpload';

interface UploadData {
  name?: string;
  email?: string;
  role?: string;
  state?: string;
  district?: string;
  gender?: string;
  rowNumber: number;
  // Workspace account fields
  firstName?: string;
  lastName?: string;
  password?: string;
  orgUnitPath?: string;
  suspended?: boolean;
  changePasswordAtNextLogin?: boolean;
  recoveryEmail?: string;
  recoveryPhone?: string;
  // Course fields
  section?: string;
  description?: string;
  descriptionHeading?: string;
  room?: string;
  courseState?: string;
  ownerId?: string;
}

function BulkUploadContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'workspace-accounts' | 'courses'>('students');
  const [preselectedCourseId, setPreselectedCourseId] = useState<string>('');

  useEffect(() => {
    // Check for URL parameters
    const courseId = searchParams.get('courseId');
    const tab = searchParams.get('tab');
    
    if (courseId) {
      setPreselectedCourseId(courseId);
    }
    
    if (tab && ['students', 'teachers', 'workspace-accounts', 'courses'].includes(tab)) {
      setActiveTab(tab as 'students' | 'teachers' | 'workspace-accounts' | 'courses');
    }
  }, [searchParams]);

  const handleUpload = async (data: UploadData[], courseId: string) => {
    // Different endpoints for different types
    let endpoint: string;
    let requestBody: Record<string, unknown>;
    
    if (activeTab === 'workspace-accounts') {
      endpoint = '/api/upload/workspace-accounts';
      requestBody = { data };
    } else if (activeTab === 'courses') {
      endpoint = '/api/upload/courses';
      requestBody = { data };
    } else {
      endpoint = `/api/upload/${activeTab}/classroom`;
      requestBody = { data, courseId };
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    const result = await response.json();
    console.log('Upload result:', result);
    
    // Show detailed results in alert
    if (result.results) {
      const { success, duplicates, errors, skipped } = result.results;
      let message = `Upload completed: ${success} added, ${duplicates} duplicates`;
      if (skipped > 0) message += `, ${skipped} skipped`;
      if (errors.length > 0) message += `, ${errors.length} errors`;
      
      // Add detailed error messages to the alert
      if (errors.length > 0) {
        message += '\n\nErrors:\n' + errors.join('\n');
      }
      
      alert(message);
      if (errors.length > 0) {
        console.log('Upload errors:', errors);
      }
    }

    return result;
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = `/api/upload/template?type=${activeTab}`;
    link.download = `${activeTab}-bulk-upload-template.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {activeTab === 'workspace-accounts' ? 'Bulk Create Google Workspace Accounts' : 'Bulk Upload to Google Classroom'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {activeTab === 'workspace-accounts' 
                ? 'Create new Google Workspace accounts for teachers and students'
                : 'Upload students and teachers directly to Google Classroom courses'
              }
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-700 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h3>
          {activeTab === 'workspace-accounts' ? (
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choose the &quot;Workspace Accounts&quot; tab to create new Google Workspace accounts</li>
              <li>• Download the template for workspace accounts</li>
              <li>• Fill in the required data (First Name, Last Name, Email, Password, Role, Organization Unit)</li>
              <li>• Save as Excel file (.xlsx or .xls)</li>
              <li>• Upload the file using drag &amp; drop or file picker</li>
              <li>• Review the preview and click upload to create accounts in Google Workspace</li>
              <li>• <strong>Important:</strong> Emails must be within your domain and unique</li>
            </ul>
          ) : activeTab === 'courses' ? (
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choose the &quot;Courses&quot; tab to create new Google Classroom courses</li>
              <li>• Download the template for courses</li>
              <li>• Fill in the required data (Name, Section, Description, Room, Course State, Owner ID)</li>
              <li>• Save as Excel file (.xlsx or .xls)</li>
              <li>• Upload the file using drag &amp; drop or file picker</li>
              <li>• Review the preview and click upload to create courses in Google Classroom</li>
              <li>• <strong>Important:</strong> Course names must be unique and ownerId must be a valid teacher email</li>
            </ul>
          ) : (
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Select the course you want to add users to</li>
              <li>• Choose the correct tab (Students or Teachers)</li>
              <li>• Download the template for the selected type</li>
              <li>• Fill in the data following the template format (use correct role)</li>
              <li>• Save as Excel file (.xlsx or .xls)</li>
              <li>• Upload the file using drag &amp; drop or file picker</li>
              <li>• Review the preview and click upload to add to Google Classroom</li>
              <li>• <strong>Important:</strong> Upload students and teachers separately using different templates</li>
            </ul>
          )}
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">Important Notes:</h3>
          {activeTab === 'workspace-accounts' ? (
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• You must be a Google Workspace admin to create accounts</li>
              <li>• Accounts will be created in the specified organizational unit</li>
              <li>• Email addresses must be within your Google Workspace domain</li>
              <li>• Passwords must meet your domain&apos;s security requirements</li>
              <li>• Duplicate emails will be skipped automatically</li>
              <li>• Users will receive email notifications about account creation</li>
              <li>• Make sure you have the required Google Admin Directory API scopes enabled</li>
            </ul>
          ) : activeTab === 'courses' ? (
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• You must have permission to create courses in Google Classroom</li>
              <li>• Course names must be unique within your domain</li>
              <li>• Owner ID must be a valid teacher email address</li>
              <li>• Course state can be ACTIVE, ARCHIVED, PROVISIONED, DECLINED, or SUSPENDED</li>
              <li>• Duplicate course names will be skipped automatically</li>
              <li>• Courses will be created in Google Classroom and synced to your database</li>
              <li>• Make sure you have the required Google Classroom API scopes enabled</li>
            </ul>
          ) : (
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Users must exist in your Google Workspace domain</li>
              <li>• You must be the course owner to add students or teachers</li>
              <li>• Students will receive email invitations to join the course</li>
              <li>• Duplicate users will be skipped automatically</li>
              <li>• Users not found in Google Workspace will be skipped</li>
              <li>• Make sure you have the required Google Classroom API scopes enabled</li>
            </ul>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teachers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teachers
            </button>
            <button
              onClick={() => setActiveTab('workspace-accounts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workspace-accounts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Workspace Accounts
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Courses
            </button>
          </nav>
        </div>

        {/* Upload Component */}
        <BulkUpload
          type={activeTab}
          onUpload={handleUpload}
          onDownloadTemplate={handleDownloadTemplate}
          preselectedCourseId={preselectedCourseId}
        />

        {/* Template Format Info */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Template Format - {activeTab === 'workspace-accounts' ? 'Workspace Accounts' : 
                              activeTab === 'courses' ? 'Courses' : 
                              activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h3>
          
          {activeTab === 'workspace-accounts' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Required Fields:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>firstName:</strong> First name of the user</li>
                    <li>• <strong>lastName:</strong> Last name of the user</li>
                    <li>• <strong>email:</strong> Email address within your domain</li>
                    <li>• <strong>password:</strong> Initial password for the account</li>
                    <li>• <strong>role:</strong> student, teacher, or admin</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Optional Fields:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>orgUnitPath:</strong> Organizational unit path (e.g., /Students)</li>
                    <li>• <strong>suspended:</strong> true/false to suspend account</li>
                    <li>• <strong>changePasswordAtNextLogin:</strong> true/false</li>
                    <li>• <strong>recoveryEmail:</strong> Recovery email address</li>
                    <li>• <strong>recoveryPhone:</strong> Recovery phone number</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : activeTab === 'courses' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Required Fields:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>name:</strong> Course name (must be unique)</li>
                    <li>• <strong>courseState:</strong> ACTIVE, ARCHIVED, PROVISIONED, DECLINED, or SUSPENDED</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Optional Fields:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>section:</strong> Course section identifier</li>
                    <li>• <strong>descriptionHeading:</strong> Heading for course description</li>
                    <li>• <strong>description:</strong> Course description</li>
                    <li>• <strong>room:</strong> Physical or virtual room location</li>
                    <li>• <strong>ownerId:</strong> Teacher email address (must be valid)</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : activeTab === 'students' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Required Fields:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Name:</strong> Full name of the student</li>
                    <li>• <strong>Email:</strong> Valid email address (must exist in Google Workspace)</li>
                    <li>• <strong>Role:</strong> Must be &quot;student&quot;</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Optional Fields:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>State:</strong> State or province</li>
                    <li>• <strong>District:</strong> School district</li>
                    <li>• <strong>Gender:</strong> Male/Female/Other</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Required Fields:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Name:</strong> Full name of the teacher</li>
                  <li>• <strong>Email:</strong> Valid email address (must exist in Google Workspace)</li>
                  <li>• <strong>Role:</strong> Must be &quot;teacher&quot;</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Important Notes:</h4>
            {activeTab === 'workspace-accounts' ? (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Email addresses must be within your Google Workspace domain</li>
                <li>• Passwords must meet your domain&apos;s security requirements</li>
                <li>• Duplicate emails will be skipped automatically</li>
                <li>• Role must be exactly &quot;student&quot;, &quot;teacher&quot;, or &quot;admin&quot; (case insensitive)</li>
                <li>• orgUnitPath must exist in your Google Workspace (optional field)</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Supported formats: .xlsx, .xls</li>
              </ul>
            ) : activeTab === 'courses' ? (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Course names must be unique within your Google Classroom domain</li>
                <li>• Course state must be one of: ACTIVE, ARCHIVED, PROVISIONED, DECLINED, SUSPENDED</li>
                <li>• Owner ID must be a valid teacher email address in your domain</li>
                <li>• Duplicate course names will be skipped automatically</li>
                <li>• All fields except name and courseState are optional</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Supported formats: .xlsx, .xls</li>
              </ul>
            ) : (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All emails must exist in your Google Workspace domain</li>
                <li>• Duplicate users in the same course will be skipped</li>
                <li>• All emails must be in valid format</li>
                <li>• Role must be exactly &quot;student&quot; or &quot;teacher&quot; (case insensitive)</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Supported formats: .xlsx, .xls</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BulkUploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BulkUploadContent />
    </Suspense>
  );
}
