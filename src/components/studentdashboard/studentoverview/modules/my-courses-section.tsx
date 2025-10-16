"use client";
import { useCourse } from "@/components/studentdashboard/context/CourseContext";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Course {
  id: string;
  name: string;
  section?: string;
  room?: string;
  courseState?: string;
  description?: string;
  updateTime?: string;
  creationTime?: string;
}

export function MyCoursesSection() {
  const { courses, loadingCourses } = useCourse();
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (courses && courses.length > 0) {
      // Sort by update time and take the 6 most recent courses
      const sorted = [...courses].sort((a, b) => {
        const aTime = new Date(a.updateTime || a.creationTime || 0).getTime();
        const bTime = new Date(b.updateTime || b.creationTime || 0).getTime();
        return bTime - aTime;
      });
      setRecentCourses(sorted.slice(0, 6));
    }
  }, [courses]);

  if (loadingCourses) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">My Courses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg p-4 h-32">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">My Courses</h2>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No courses found</div>
          <p className="text-sm text-gray-400">You haven't been enrolled in any courses yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">My Courses</h2>
        <Link 
          href="/student/dashboard/mycourses" 
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentCourses.map((course) => (
          <Link
            key={course.id}
            href={`/student/dashboard/mycourses?courseId=${course.id}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {course.name || 'Untitled Course'}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                course.courseState === 'ACTIVE' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {course.courseState || 'UNKNOWN'}
              </span>
            </div>
            
            {course.section && (
              <p className="text-sm text-gray-600 mb-1">{course.section}</p>
            )}
            
            {course.room && (
              <p className="text-xs text-gray-500 mb-2">Room: {course.room}</p>
            )}
            
            {course.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{course.description}</p>
            )}
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {course.updateTime 
                  ? new Date(course.updateTime).toLocaleDateString()
                  : course.creationTime 
                    ? new Date(course.creationTime).toLocaleDateString()
                    : 'Recently updated'
                }
              </span>
              <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>
            </div>
          </Link>
        ))}
      </div>
      
      {courses.length > 6 && (
        <div className="mt-4 text-center">
          <Link 
            href="/student/dashboard/mycourses"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View {courses.length - 6} more courses
          </Link>
        </div>
      )}
    </div>
  );
}
