"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useSuperAdminCourse } from "@/components/superadmin/context/SuperAdminCourseContext"

type MetricCardProps = {
  iconSrc: string
  iconAlt: string
  label: string
  value: string
  loading?: boolean
}

function MetricCard({ iconSrc, iconAlt, label, value, loading }: MetricCardProps) {
  return (
    <Card className="rounded-2xl border-0 shadow-none">
      <CardContent className="p-6 h-[140px] flex items-center justify-center">
        <div className="flex items-center gap-3">
          {/* Icon in orange circle */}
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]">
            <Image
              src={iconSrc}
              alt={iconAlt}
              width={28}
              height={28}
              className="h-7 w-7"
              priority
            />
          </span>

          {/* Label + Value stacked vertically */}
          <div className="flex flex-col justify-center">
            <span className="text-[16px] leading-4">{label}</span>
            <span className="text-[20px] font-semibold leading-5 mt-2">
              {loading ? "..." : value}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type CourseMetrics = {
  totalStudents: number;
  participation: {
    course: { completed: number; percentage: number };
    preSurvey: { completed: number; percentage: number };
    postSurvey: { completed: number; percentage: number };
    idea: { completed: number; percentage: number };
  };
};

export default function CoursePartition() {
  const { selectedCourse } = useSuperAdminCourse();
  const [metrics, setMetrics] = useState<CourseMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedCourse?.id) {
        setMetrics(null);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/superadmin/course-metrics?courseId=${selectedCourse.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setMetrics(data.metrics);
        } else {
          console.error('Failed to fetch metrics:', data.message);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedCourse]);

  return (
    <div className="space-y-6">
      {/* Header with title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold">Course Participation</h2>
          <p className="text-[14px] text-muted-foreground">
            Overview of student progress and survey status
          </p>
        </div>
      </div>

      {/* Four metric cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-[140px]">
        <MetricCard
          iconSrc="/metrics/students.png"
          iconAlt="Course icon"
          label="Course"
          value={metrics ? `${metrics.participation.course.percentage}%` : "-"}
          loading={loading}
        />
        <MetricCard
          iconSrc="/metrics/teachers.png" 
          iconAlt="Pre-Survey icon"
          label="Pre-Survey"
          value={metrics ? `${metrics.participation.preSurvey.percentage}%` : "-"}
          loading={loading}
        />
        <MetricCard
          iconSrc="/metrics/teachers.png" 
          iconAlt="Post-Survey icon"
          label="Post-Survey"
          value={metrics ? `${metrics.participation.postSurvey.percentage}%` : "-"}
          loading={loading}
        />
        <MetricCard
          iconSrc="/metrics/ideas.png" 
          iconAlt="Idea icon"
          label="Idea"
          value={metrics ? `${metrics.participation.idea.percentage}%` : "-"}
          loading={loading}
        />
      </div>
    </div>
  )
}
