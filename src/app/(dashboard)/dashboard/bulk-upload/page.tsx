"use client";

import { useState } from 'react';
import Link from 'next/link';
import BulkUpload from '@/components/BulkUpload';

export default function BulkUploadPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');

  const handleUpload = async (data: any[], courseId: string) => {
    const response = await fetch(`/api/upload/${activeTab}/classroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, courseId }),
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
            <h1 className="text-2xl font-semibold text-gray-900">Bulk Upload to Google Classroom</h1>
            <p className="text-sm text-gray-600 mt-1">
              Upload students and teachers directly to Google Classroom courses
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
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select the course you want to add users to</li>
            <li>• Choose the correct tab (Students or Teachers)</li>
            <li>• Download the template for the selected type</li>
            <li>• Fill in the data following the template format (use correct role)</li>
            <li>• Save as Excel file (.xlsx or .xls)</li>
            <li>• Upload the file using drag & drop or file picker</li>
            <li>• Review the preview and click upload to add to Google Classroom</li>
            <li>• <strong>Important:</strong> Upload students and teachers separately using different templates</li>
          </ul>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">Important Notes:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Users must exist in your Google Workspace domain</li>
            <li>• You must be the course owner to add students or teachers</li>
            <li>• Students will receive email invitations to join the course</li>
            <li>• Duplicate users will be skipped automatically</li>
            <li>• Users not found in Google Workspace will be skipped</li>
            <li>• Make sure you have the required Google Classroom API scopes enabled</li>
          </ul>
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
          </nav>
        </div>

        {/* Upload Component */}
        <BulkUpload
          type={activeTab}
          onUpload={handleUpload}
          onDownloadTemplate={handleDownloadTemplate}
        />

        {/* Template Format Info */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Template Format - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h3>
          
          {activeTab === 'students' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Required Fields:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Name:</strong> Full name of the student</li>
                    <li>• <strong>Email:</strong> Valid email address (must exist in Google Workspace)</li>
                    <li>• <strong>Role:</strong> Must be "student"</li>
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
                  <li>• <strong>Role:</strong> Must be "teacher"</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Important Notes:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• All emails must exist in your Google Workspace domain</li>
              <li>• Duplicate users in the same course will be skipped</li>
              <li>• All emails must be in valid format</li>
              <li>• Role must be exactly "student" or "teacher" (case insensitive)</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Supported formats: .xlsx, .xls</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
