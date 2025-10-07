'use client'

import React, { useState, useEffect } from "react";
import RingProgress from "../progress/progress";

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
      {/* ring at 72x72 */}
      <RingProgress percent={percentArc} text={valueText} size={72} />
      <div className="text-[14px] leading-5 text-[var(--neutral-1000)] whitespace-normal break-words">
        {label}
      </div>
    </div>
  );
}

interface AnalyticsData {
  enrolledStudents: number;
  courseProgress: number;
  pending: number;
  completed: number;
  totalTeachers: number;
  totalCourses: number;
}

const KPIRow: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/districtadmin/analytics');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          throw new Error(data.message || 'Failed to load analytics');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading analytics: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600 text-sm">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      <KPICard 
        valueText={analytics.enrolledStudents.toString()} 
        label="Enrolled Students" 
        percentArc={Math.min(analytics.enrolledStudents / 10, 100)} 
      />
      <KPICard 
        valueText={`${analytics.courseProgress}%`} 
        label="Course Progress (Avg)" 
        percentArc={analytics.courseProgress} 
      />
      <KPICard 
        valueText={`${analytics.pending}%`} 
        label="Pending" 
        percentArc={analytics.pending} 
      />
      <KPICard 
        valueText={`${analytics.completed}%`} 
        label="Completed" 
        percentArc={analytics.completed} 
      />
    </div>
  );
};

export default KPIRow;
