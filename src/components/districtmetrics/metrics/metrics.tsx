"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useDistrictCourse } from "../../districtadmin/context/DistrictCourseContext";

type Stat = { label: string; value: string | number; icon: string };

type StatCardProps = Stat & {
  /** Tailwind width class; defaults to w-full */
  widthClass?: string;
};

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

function StatCard({
  label,
  value,
  icon,
  widthClass = "w-full",
}: StatCardProps) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  
  return (
    <div className={`h-[112px] ${widthClass} rounded-xl bg-white`}>
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
              {displayValue}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DistrictOverview: React.FC = () => {
  const { selectedCourse } = useDistrictCourse();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [districtName, setDistrictName] = useState<string>('GASA');

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
          // Set district name from metrics data
          if (data.districtName) {
            setDistrictName(data.districtName);
          }
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
      <section className="w-full px-5 sm:px-6 md:px-8 lg:px-10 xl:px-[20px]">
        <h2 className="text-3xl font-semibold">District Overview</h2>
        <div className="flex items-center justify-center h-64 mt-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading metrics...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !metrics) {
    return (
      <section className="w-full px-5 sm:px-6 md:px-8 lg:px-10 xl:px-[20px]">
        <h2 className="text-3xl font-semibold">District Overview</h2>
        <div className="flex items-center justify-center h-64 mt-8">
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">{error || 'No data available'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Create stat arrays from dynamic data
  const ROW1: Stat[] = [
    { label: "schools", value: metrics.schools, icon: "/metrics/school.png" },
    { label: "Teachers", value: metrics.teachers, icon: "/metrics/teachers.png" },
    { label: "Students", value: metrics.students, icon: "/metrics/students.png" },
  ];

  const ROW2: Stat[] = [
    { label: "Male Teachers", value: metrics.maleTeachers, icon: "/metrics/maleteachers.png" },
    { label: "Female Teachers", value: metrics.femaleTeachers, icon: "/metrics/femaleteachers.png" },
    { label: "Other Teachers", value: metrics.otherTeachers, icon: "/metrics/otherteacher.png" },
  ];

  const ROW3: Stat[] = [
    { label: "Male Students", value: metrics.maleStudents, icon: "/metrics/malestudents.png" },
    { label: "Female Students", value: metrics.femaleStudents, icon: "/metrics/femalestudents.png" },
    { label: "Other Students", value: metrics.otherStudents, icon: "/metrics/otherstudent.png" },
  ];

  const ROW4_RIGHT: Stat[] = [
    { label: "Pre survey", value: metrics.preSurvey, icon: "/metrics/ideas.png" },
    { label: "Course completion", value: metrics.courseCompletion, icon: "/metrics/ideas.png" },
    { label: "Post survey", value: metrics.postSurvey, icon: "/metrics/ideas.png" },
  ];

  const IDEA_SUBMITTED: Stat = {
    label: "Idea Submitted",
    value: metrics.ideasSubmitted,
    icon: "/metrics/ideas.png",
  };

  return (
    <section className="w-full px-5 sm:px-6 md:px-8 lg:px-10 xl:px-[20px]">
      <div className="mb-4">
        <h2 className="text-3xl font-semibold">
          District Overview
        </h2>
      </div>

      <div className="grid grid-cols-12 auto-rows-[112px] gap-4 items-start mt-8">
        {/* Map card */}
        <div className="col-span-12 lg:col-span-3 row-span-3 flex justify-center">
          <div className="relative w-[269px] h-[362px] rounded-3xl bg-white flex flex-col items-center justify-center pb-14">
            <div className="relative w-[85%] h-[85%]">
              <Image
                src="/gasa.png"
                alt="Gasa district map"
                fill
                className="object-contain"
                draggable={false}
              />
            </div>
            <button
              type="button"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 h-10 w-[200px] rounded-lg
                 bg-[var(--neutral-300)] text-[16px] font-medium text-[var(--neutral-1000)] uppercase"
            >
              {districtName}
            </button>
          </div>
        </div>

        {/* Row 1 */}
        {ROW1.map((s, i) => (
          <div
            key={s.label}
            className={`col-span-12 lg:col-span-3 ${
              i === 0 ? "lg:col-start-4" : ""
            }`}
          >
            <StatCard {...s} />
          </div>
        ))}

        {/* Row 2 */}
        {ROW2.map((s, i) => (
          <div
            key={s.label}
            className={`col-span-12 lg:col-span-3 ${
              i === 0 ? "lg:col-start-4" : ""
            }`}
          >
            <StatCard {...s} />
          </div>
        ))}

        {/* Row 3 */}
        {ROW3.map((s, i) => (
          <div
            key={s.label}
            className={`col-span-12 lg:col-span-3 ${
              i === 0 ? "lg:col-start-4" : ""
            }`}
          >
            <StatCard {...s} />
          </div>
        ))}

        {/* Row 4: Idea Submitted (269px wide) */}
        <div className="col-span-12 lg:col-span-3 flex justify-center">
          <StatCard {...IDEA_SUBMITTED} widthClass="w-[269px]" />
        </div>

        {/* Row 4 (right) */}
        {ROW4_RIGHT.map((s, i) => (
          <div
            key={s.label}
            className={`col-span-12 lg:col-span-3 ${
              i === 0 ? "lg:col-start-4" : ""
            }`}
          >
            <StatCard {...s} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default DistrictOverview;
