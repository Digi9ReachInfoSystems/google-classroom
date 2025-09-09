'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  section?: string;
  description?: string;
  room?: string;
  courseState?: string;
}

interface Teacher {
  userId: string;
  profile: {
    id: string;
    name: {
      givenName?: string;
      familyName?: string;
      fullName?: string;
    };
    emailAddress?: string;
    photoUrl?: string;
  };
  courseId: string;
}

interface Student {
  userId: string;
  profile: {
    id: string;
    name: {
      givenName?: string;
      familyName?: string;
      fullName?: string;
    };
    emailAddress?: string;
    photoUrl?: string;
  };
  courseId: string;
}

export default function CourseRosterPage({ params }: { params: Promise<{ courseId: string }> }) {
  const [courseId, setCourseId] = useState<string>('');
  const [course, setCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers');
  
  // Add user states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.courseId);
    };
    loadParams();
  }, [params]);

  const loadCourseData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    console.log('Loading course data for courseId:', courseId);
    
    try {
      // Load course details
      const courseRes = await fetch(`/api/classroom/courses/${courseId}`);
      if (!courseRes.ok) {
        const errorData = await courseRes.json();
        throw new Error(errorData.message || 'Failed to load course');
      }
      const courseData = await courseRes.json();
      if (!courseData.success) {
        throw new Error(courseData.message || 'Failed to load course');
      }
      setCourse(courseData.course);

      // Load teachers
      const teachersRes = await fetch(`/api/classroom/courses/${courseId}/teachers`);
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        if (teachersData.success) {
          setTeachers(teachersData.teachers || []);
        }
      }

      // Load students
      const studentsRes = await fetch(`/api/classroom/courses/${courseId}/students`);
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        if (studentsData.success) {
          setStudents(studentsData.students || []);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      console.log('Course ID from params:', courseId);
      loadCourseData();
    }
  }, [courseId, loadCourseData]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    setAddUserError(null);
    setAddUserSuccess(null);

    try {
      const endpoint = activeTab === 'teachers' 
        ? `/api/classroom/courses/${courseId}/teachers`
        : `/api/classroom/courses/${courseId}/students`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: newUserEmail.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add user');
      }

      setAddUserSuccess(`${activeTab === 'teachers' ? 'Teacher' : 'Student'} added successfully!`);
      setNewUserEmail('');
      setShowAddForm(false);
      
      // Reload the data
      await loadCourseData();

    } catch (err) {
      setAddUserError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to remove this ${activeTab === 'teachers' ? 'teacher' : 'student'}?`)) {
      return;
    }

    try {
      const endpoint = activeTab === 'teachers' 
        ? `/api/classroom/courses/${courseId}/teachers?userId=${encodeURIComponent(userId)}`
        : `/api/classroom/courses/${courseId}/students?userId=${encodeURIComponent(userId)}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to remove user');
      }

      // Reload the data
      await loadCourseData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course roster...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested course could not be found.'}</p>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentUsers = activeTab === 'teachers' ? teachers : students;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{course.name}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {course.section && `Section: ${course.section}`}
            {course.room && ` • Room: ${course.room}`}
            {course.courseState && ` • Status: ${course.courseState}`}
          </p>
        </div>

        {/* Success/Error Messages */}
        {addUserSuccess && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">{addUserSuccess}</p>
          </div>
        )}

        {addUserError && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{addUserError}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('teachers')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'teachers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Teachers ({teachers.length})
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Students ({students.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Add User Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {activeTab === 'teachers' ? 'Teachers' : 'Students'}
                </h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Add {activeTab === 'teachers' ? 'Teacher' : 'Student'}
                </button>
              </div>

              {/* Add User Form */}
              {showAddForm && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <form onSubmit={handleAddUser} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        {activeTab === 'teachers' ? 'Teacher' : 'Student'} Email
                      </label>
                      <input
                        type="email"
                        id="userEmail"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={`${activeTab === 'teachers' ? 'teacher' : 'student'}@yourschool.edu`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewUserEmail('');
                          setAddUserError(null);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingUser || !newUserEmail.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingUser ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {currentUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No {activeTab} found in this course.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentUsers.map((user) => (
                    <div key={user.userId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {user.profile.name?.fullName || 
                             `${user.profile.name?.givenName || ''} ${user.profile.name?.familyName || ''}`.trim() ||
                             'Unknown Name'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{user.userId}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(user.userId)}
                          className="ml-2 text-red-600 hover:text-red-800"
                          title={`Remove ${activeTab === 'teachers' ? 'teacher' : 'student'}`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
