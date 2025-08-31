"use client";

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

interface Course {
  courseId: string;
  name?: string;
  section?: string;
}

interface BulkUploadProps {
  type: 'students' | 'teachers';
  onUpload: (data: any[], courseId: string) => Promise<{ results?: any }>;
  onDownloadTemplate: () => void;
}

export default function BulkUpload({ type, onUpload, onDownloadTemplate }: BulkUploadProps) {
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Load available courses
  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const response = await fetch('/api/db/courses?pageSize=1000');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setSuccess(null);
    
    if (acceptedFiles.length === 0) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    const file = acceptedFiles[0];
    
    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    try {
      // Read the Excel file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`/api/upload/${type}/parse`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to parse Excel file');
      }

      const data = await response.json();
      setUploadedData(data.data || []);
      
      if (data.data && data.data.length > 0) {
        setSuccess(`Successfully parsed ${data.data.length} ${type}`);
      } else {
        setError('No valid data found in the Excel file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    }
  }, [type]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const handleUpload = async () => {
    if (uploadedData.length === 0) {
      setError('No data to upload');
      return;
    }

    if (!selectedCourseId) {
      setError('Please select a course');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      const result = await onUpload(uploadedData, selectedCourseId);
      if (result.results) {
        setSuccess(`Successfully uploaded ${uploadedData.length} ${type} to Google Classroom. ${result.results.successCount} items succeeded, ${result.results.failedCount} items failed.`);
        setUploadedData([]);
        setUploadProgress(100);
      } else {
        setError('Upload failed or no results returned.');
      }
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 capitalize">
          Bulk Upload {type} to Google Classroom
        </h3>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Download Template
        </button>
      </div>

      {/* Course Selection */}
      <div className="mb-6">
        <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Course *
        </label>
        <select
          id="course-select"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          disabled={loadingCourses}
        >
          <option value="">Select a course...</option>
          {courses.map((course) => (
            <option key={course.courseId} value={course.courseId}>
              {course.name || 'Untitled'} {course.section ? `(${course.section})` : ''}
            </option>
          ))}
        </select>
        {loadingCourses && (
          <p className="text-sm text-gray-500 mt-1">Loading courses...</p>
        )}
      </div>

      {/* Upload Area */}
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
              {isDragActive ? 'Drop the Excel file here' : 'Drag & drop an Excel file here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse files (.xlsx, .xls)
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Uploading to Google Classroom...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {uploadedData.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Preview ({uploadedData.length} {type})
            </h4>
            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedCourseId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : `Upload ${uploadedData.length} ${type} to Google Classroom`}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(uploadedData[0] || {}).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value: any, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {uploadedData.length > 5 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Showing first 5 of {uploadedData.length} records
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
