"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Course {
  id: string;
  name: string;
  section?: string;
  description?: string;
  room?: string;
  courseState?: string;
  studentCount: number;
  teacherCount: number;
}

interface TeacherCourseContextType {
  courses: Course[];
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  loading: boolean;
  error: string | null;
  refreshCourses: () => Promise<void>;
}

const TeacherCourseContext = createContext<TeacherCourseContextType | undefined>(undefined);

export function TeacherCourseProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching teacher courses...');
      const response = await fetch('/api/teacher/courses');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Courses API response:', data);
      
      if (data.success) {
        setCourses(data.courses);
        console.log(`Loaded ${data.courses.length} courses:`, data.courses.map((c: Course) => c.name));
        
        // Auto-select first course if none selected
        if (!selectedCourse && data.courses.length > 0) {
          console.log('Auto-selecting first course:', data.courses[0].name);
          setSelectedCourse(data.courses[0]);
        }
        
        // Update selected course if it no longer exists
        if (selectedCourse && !data.courses.find((c: Course) => c.id === selectedCourse.id)) {
          console.log('Selected course no longer exists, updating selection');
          setSelectedCourse(data.courses.length > 0 ? data.courses[0] : null);
        }
      } else {
        throw new Error(data.error || 'Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      setCourses([]);
      setSelectedCourse(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshCourses = async () => {
    await fetchCourses();
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <TeacherCourseContext.Provider value={{
      courses,
      selectedCourse,
      setSelectedCourse,
      loading,
      error,
      refreshCourses
    }}>
      {children}
    </TeacherCourseContext.Provider>
  );
}

export function useTeacherCourse() {
  const context = useContext(TeacherCourseContext);
  if (context === undefined) {
    throw new Error('useTeacherCourse must be used within a TeacherCourseProvider');
  }
  return context;
}
