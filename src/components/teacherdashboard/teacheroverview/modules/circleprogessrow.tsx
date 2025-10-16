"use client";
import React, { useEffect, useState } from "react";
import TeacherRingProgress from "./ringprogesscards/circleproges";
import { useTeacherCourse } from "../../context/TeacherCourseContext";

function KPICard({
  valueText,
  label,
  percentArc,
}: {
  valueText: string;
  label: React.ReactNode;
  percentArc: number;
}) {
  return (
    <div
      className="
        bg-white border-0 shadow-none rounded-none
        h-[112px] w-full sm:w-[260px] md:w-full
        px-5 py-4
        flex items-center gap-4
      "
    >
      <TeacherRingProgress percent={percentArc} text={valueText} size={72} color="var(--primary)" />
      <div className="text-[14px] leading-5 text-[var(--neutral-1000)] whitespace-normal break-words">
        {label}
      </div>
    </div>
  );
}

interface AnalyticsData {
  totalStudents: number;
  totalCourses: number;
  avgProgress: number;
  pendingAssignments: number;
  completedAssignments: number;
}

export default function CircleProgressRow() {
  const { selectedCourse } = useTeacherCourse();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Don't fetch if no course is selected
      if (!selectedCourse) {
        setAnalytics(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const url = `/api/teacher/analytics?courseId=${selectedCourse.id}`;
        console.log('Fetching analytics for course:', selectedCourse.id);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          throw new Error(data.error || 'Failed to load analytics');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedCourse]);

  if (!selectedCourse) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600 text-sm">Please select a course to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border-0 shadow-none rounded-none h-[112px] w-full sm:w-[260px] md:w-full px-5 py-4 flex items-center gap-4 animate-pulse">
            <div className="h-14 w-14 rounded-full bg-gray-200"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">Error loading analytics: {error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="col-span-full bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-700 text-sm">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      <KPICard 
        valueText={analytics.totalStudents.toString()} 
        label="Enrolled Students" 
        percentArc={Math.min(100, Math.max(10, analytics.totalStudents / 5))} 
      />
      <KPICard
        valueText={`${analytics.avgProgress}%`}
        label="Course Progress (Avg)"
        percentArc={analytics.avgProgress}
      />
      <KPICard 
        valueText={`${analytics.pendingAssignments}`} 
        label="Pending Submissions" 
        percentArc={Math.min(100, Math.max(10, analytics.pendingAssignments * 10))} 
      />
    </div>
  );
}


