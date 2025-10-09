"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Course {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  ownerId?: string;
  creationTime?: string;
  updateTime?: string;
  enrollmentCode?: string;
  courseState?: string;
  alternateLink?: string;
}

interface SuperAdminCourseContextType {
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const SuperAdminCourseContext = createContext<SuperAdminCourseContextType | undefined>(undefined);

export function SuperAdminCourseProvider({ children }: { children: ReactNode }) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/courses');
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses || []);
        if (data.courses && data.courses.length > 0) {
          setSelectedCourse(data.courses[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminCourseContext.Provider
      value={{
        selectedCourse,
        setSelectedCourse,
        courses,
        setCourses,
        loading,
        setLoading,
      }}
    >
      {children}
    </SuperAdminCourseContext.Provider>
  );
}

export function useSuperAdminCourse() {
  const context = useContext(SuperAdminCourseContext);
  if (context === undefined) {
    throw new Error("useSuperAdminCourse must be used within a SuperAdminCourseProvider");
  }
  return context;
}

