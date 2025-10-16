"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Course {
  id: string;
  name: string;
  section?: string;
  description?: string;
  room?: string;
  enrollmentCode?: string;
  courseState?: string;
  alternateLink?: string;
  teacherGroupEmail?: string;
  courseGroupEmail?: string;
  guardiansEnabled?: boolean;
  calendarId?: string;
  updateTime?: string;
  creationTime?: string;
}

interface CourseContextType {
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  loadingCourses: boolean;
  setLoadingCourses: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  refreshCourses: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      setError(null);
      
      console.log('Fetching student courses...');
      const res = await fetch('/api/student/courses');
      const data = await res.json();
      
      console.log('Student courses API response:', data);
      
      if (data.success && data.courses) {
        setCourses(data.courses);
        console.log(`Loaded ${data.courses.length} courses:`, data.courses.map((c: Course) => c.name));
        
        // Set first course as selected by default
        if (data.courses.length > 0 && !selectedCourse) {
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
      setLoadingCourses(false);
    }
  };

  const refreshCourses = async () => {
    await fetchCourses();
  };

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <CourseContext.Provider value={{
      selectedCourse,
      setSelectedCourse,
      courses,
      setCourses,
      loadingCourses,
      setLoadingCourses,
      error,
      setError,
      refreshCourses
    }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}
