"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CourseworkModal from '@/components/CourseworkModal';

interface Course {
  id: string;
  name: string;
  section?: string;
  description?: string;
}

interface CourseworkItem {
  id: string;
  title: string;
  description?: string;
  state: string;
  creationTime: string;
  updateTime: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
  maxPoints?: number;
  workType?: string;
  materials?: Record<string, unknown>[];
}

interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  state: string;
  creationTime: string;
  updateTime: string;
  materials?: Record<string, unknown>[];
}

export default function CourseworkPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [coursework, setCoursework] = useState<CourseworkItem[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [activeTab, setActiveTab] = useState<'assignments' | 'materials'>('assignments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CourseworkItem | CourseMaterial | null>(null);
  const [modalType, setModalType] = useState<'assignment' | 'material'>('assignment');

  const loadCourseworkData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading coursework data for courseId:', courseId);
      
      // Load course details
      const courseRes = await fetch(`/api/classroom/courses/${courseId}`);
      if (!courseRes.ok) {
        throw new Error('Failed to load course details');
      }
      const courseData = await courseRes.json();
      setCourse(courseData.data);

      // Load coursework
      const courseworkRes = await fetch(`/api/classroom/courses/${courseId}/coursework`);
      if (!courseworkRes.ok) {
        throw new Error('Failed to load coursework');
      }
      const courseworkData = await courseworkRes.json();
      
      setCoursework(courseworkData.data.coursework || []);
      setMaterials(courseworkData.data.materials || []);
      
    } catch (err) {
      console.error('Error loading coursework data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load coursework data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      loadCourseworkData();
    }
  }, [courseId, loadCourseworkData]);

  async function handleDelete(itemId: string, type: 'assignment' | 'material') {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/classroom/courses/${courseId}/coursework/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Reload data
      await loadCourseworkData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  }

  function formatDate(dateObj: { year: number; month: number; day: number }, timeObj?: { hours: number; minutes: number }) {
    if (!dateObj) return 'No due date';
    
    const date = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
    let formatted = date.toLocaleDateString();
    
    if (timeObj) {
      const time = new Date();
      time.setHours(timeObj.hours, timeObj.minutes);
      formatted += ` at ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return formatted;
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="text-lg font-medium">Loading coursework...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={loadCourseworkData}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {course?.name || 'Course'} - Coursework
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {course?.section && `Section: ${course.section}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/courses/${courseId}/roster`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Roster
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Assignments ({coursework.length})
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'materials'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Materials ({materials.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setModalType(activeTab === 'assignments' ? 'assignment' : 'material');
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add {activeTab === 'assignments' ? 'Assignment' : 'Material'}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'assignments' ? (
            <>
              {coursework.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new assignment.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {coursework.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                          {item.description && (
                            <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                          )}
                          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Due: {item.dueDate ? formatDate(item.dueDate, item.dueTime) : 'No due date'}</span>
                            {item.maxPoints && <span>Points: {item.maxPoints}</span>}
                            <span>State: {item.state}</span>
                            <span>Created: {formatDateTime(item.creationTime)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setModalType('assignment');
                              setShowAddModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, 'assignment')}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {materials.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No materials</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new material.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {materials.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                          {item.description && (
                            <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                          )}
                          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                            <span>State: {item.state}</span>
                            <span>Created: {formatDateTime(item.creationTime)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setModalType('material');
                              setShowAddModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, 'material')}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Coursework Modal */}
        <CourseworkModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSubmit={() => {
            loadCourseworkData();
            setShowAddModal(false);
            setEditingItem(null);
          }}
          type={modalType}
          editingItem={editingItem}
          courseId={courseId}
        />
      </div>
    </div>
  );
}
