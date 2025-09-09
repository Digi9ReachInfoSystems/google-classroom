"use client";

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

interface Course {
  courseId: string;
  name?: string;
  section?: string;
}

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
  descriptionHeading?: string;
  description?: string;
  room?: string;
  courseState?: string;
  ownerId?: string;
}

interface UploadResult {
  results?: {
    success: number;
    errors: string[];
    duplicates: number;
    skipped: number;
  };
}

interface BulkUploadProps {
  type: 'students' | 'teachers' | 'workspace-accounts' | 'courses';
  onUpload: (data: UploadData[], courseId: string) => Promise<UploadResult>;
  onDownloadTemplate: () => void;
  preselectedCourseId?: string;
}

export default function BulkUpload({ type, onUpload, onDownloadTemplate, preselectedCourseId }: BulkUploadProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [uploadedData, setUploadedData] = useState<UploadData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    setError(null);
    try {
      const response = await fetch('/api/classroom/courses');
      if (!response.ok) {
        throw new Error('Failed to load courses');
      }
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload/${type}/parse`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to parse file');
      }

      const result = await response.json();
      setUploadedData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  }, [type]);

  useEffect(() => {
    if (preselectedCourseId) {
      setSelectedCourseId(preselectedCourseId);
    }
  }, [preselectedCourseId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    // Course selection is only required for classroom uploads, not workspace accounts or courses
    if (type !== 'workspace-accounts' && type !== 'courses' && !selectedCourseId) {
      setError('Please select a course');
      return;
    }

    if (uploadedData.length === 0) {
      setError('Please upload a file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(uploadedData, selectedCourseId);
      // Clear the form after successful upload
      setUploadedData([]);
      setSelectedCourseId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    onDownloadTemplate();
  };

  return (
    <div className="space-y-6">
      {/* Course Selection - Only show for classroom uploads */}
      {type !== 'workspace-accounts' && type !== 'courses' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Course</h3>
        
        {!isLoadingCourses && courses.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">No courses available</p>
            <button
              onClick={loadCourses}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Load Courses
            </button>
          </div>
        )}

        {isLoadingCourses && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              <span>Loading courses...</span>
            </div>
          </div>
        )}

        {courses.length > 0 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
                Choose a course to add {type} to:
              </label>
              <select
                id="course-select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.name || 'Untitled course'} {course.section && `(${course.section})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        </div>
      )}

      {/* File Upload */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upload File</h3>
          <button
            onClick={handleDownloadTemplate}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Download Template
          </button>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to select a file
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Supports .xlsx and .xls files up to 10MB
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {uploadedData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Preview ({uploadedData.length} {type})
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {type === 'workspace-accounts' ? (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          First Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Org Unit
                        </th>
                      </>
                    ) : type === 'courses' ? (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Section
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Owner
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        {type === 'students' && (
                          <>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              State
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              District
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Gender
                            </th>
                          </>
                        )}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploadedData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {type === 'workspace-accounts' ? (
                        <>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.firstName || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.lastName || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.email}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.role}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.orgUnitPath || '-'}</td>
                        </>
                      ) : type === 'courses' ? (
                        <>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.section || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.room || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.courseState || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.ownerId || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.email}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.role}</td>
                          {type === 'students' && (
                            <>
                              <td className="px-3 py-2 text-sm text-gray-900">{row.state || '-'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{row.district || '-'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{row.gender || '-'}</td>
                            </>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                  {uploadedData.length > 5 && (
                    <tr>
                      <td colSpan={type === 'workspace-accounts' ? 5 : type === 'courses' ? 5 : type === 'students' ? 6 : 3} className="px-3 py-2 text-sm text-gray-500 text-center">
                        ... and {uploadedData.length - 5} more {type}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {uploadedData.length > 0 && (type === 'workspace-accounts' || type === 'courses' || selectedCourseId) && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Ready to Upload</h3>
              <p className="text-sm text-gray-600 mt-1">
                {type === 'workspace-accounts' 
                  ? `${uploadedData.length} ${type} will be created in Google Workspace`
                  : type === 'courses'
                  ? `${uploadedData.length} ${type} will be created in Google Classroom`
                  : `${uploadedData.length} ${type} will be added to the selected course`
                }
              </p>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : `Upload ${uploadedData.length} ${type}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
