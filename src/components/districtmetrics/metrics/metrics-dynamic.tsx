"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDistrictCourse } from "../../districtadmin/context/DistrictCourseContext";

type Stat = { label: string; value: string | number; icon: string };

type StatCardProps = Stat & {
  widthClass?: string;
};

function StatCard({
  label,
  value,
  icon,
  widthClass = "w-full",
}: StatCardProps) {
  return (
    <div className={`h-[112px] ${widthClass} rounded-xl bg-white border border-gray-200`}>
      <div className="h-full w-full flex items-center justify-start px-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]">
            <Image
              src={icon}
              alt={label}
              width={24}
              height={24}
              className="object-contain"
            />
          </span>
          <div className="min-w-0 text-left">
            <div className="text-[12px] font-normal leading-5 text-black truncate">
              {label}
            </div>
            <div className="text-[16px] font-normal leading-6 text-black">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricsData {
  schools: number;
  teachers: number;
  students: number;
  maleTeachers: number;
  femaleTeachers: number;
  otherTeachers: number;
  maleStudents: number;
  femaleStudents: number;
  otherStudents: number;
  studentsEnrolled: number;
  ideasSubmitted: number;
  courseCompletion: number;
  preSurvey: number;
  postSurvey: number;
}

export default function DistrictMetricsDynamic() {
  const { selectedCourse } = useDistrictCourse();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = selectedCourse
          ? `/api/districtadmin/metrics-data?courseId=${selectedCourse.id}`
          : '/api/districtadmin/metrics-data';

        console.log('Fetching metrics data:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setMetrics(data.data);
        } else {
          throw new Error(data.message || 'Failed to load metrics');
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedCourse]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No metrics data available</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full px-5 sm:px-6 md:px-8 lg:px-10 xl:px-[20px]">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold">
          District Metrics
        </h2>
      </div>

      {/* Row 1: Schools, Teachers, Students */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard label="Schools" value={metrics.schools} icon="/metrics/school.png" />
        <StatCard label="Teachers" value={metrics.teachers} icon="/metrics/teachers.png" />
        <StatCard label="Students" value={metrics.students} icon="/metrics/students.png" />
      </div>

      {/* Row 2: Teacher Demographics */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard label="Male Teachers" value={metrics.maleTeachers} icon="/metrics/maleteachers.png" />
        <StatCard label="Female Teachers" value={metrics.femaleTeachers} icon="/metrics/femaleteachers.png" />
        <StatCard label="Other Teachers" value={metrics.otherTeachers} icon="/metrics/otherteacher.png" />
      </div>

      {/* Row 3: Student Demographics */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard label="Male Students" value={metrics.maleStudents} icon="/metrics/malestudents.png" />
        <StatCard label="Female Students" value={metrics.femaleStudents} icon="/metrics/femalestudents.png" />
        <StatCard label="Other Students" value={metrics.otherStudents} icon="/metrics/otherstudent.png" />
      </div>

      {/* Row 4: Enrollment & Progress */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Students Enrolled" value={metrics.studentsEnrolled} icon="/metrics/enrolled.png" />
        <StatCard label="Ideas Submitted" value={metrics.ideasSubmitted} icon="/metrics/ideas.png" />
        <StatCard label="Course Completion" value={metrics.courseCompletion} icon="/metrics/ideas.png" />
        <StatCard label="Pre Survey" value={metrics.preSurvey} icon="/metrics/ideas.png" />
      </div>

      {/* Row 5: Post Survey */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard label="Post Survey" value={metrics.postSurvey} icon="/metrics/ideas.png" />
      </div>
    </section>
  );
}
