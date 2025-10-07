"use client";

import React, { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTeacherCourse } from "../../context/TeacherCourseContext";

interface ProgressData {
  stage: string;
  y2025: number;
}

const chartConfig = {
  y2025: { label: "2025", color: "#8979FF" },
} satisfies ChartConfig;

export default function TeacherclassProgressCard() {
  const { selectedCourse } = useTeacherCourse();
  const [data, setData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!selectedCourse) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/teacher/students?courseId=${selectedCourse.id}`);
        const response = await res.json();

        if (response.success && response.students) {
          const students = response.students;
          
          // Calculate progress percentages
          const totalStudents = students.length;
          const preSurveyCount = students.filter(s => s.progress?.preSurveyCompleted).length;
          const courseCompletedCount = students.filter(s => s.progress?.lessonProgress >= 80).length;
          const ideaSubmissionCount = students.filter(s => s.progress?.ideaSubmissionCompleted).length;
          const postSurveyCount = students.filter(s => s.progress?.postSurveyCompleted).length;
          const certificateCount = students.filter(s => s.progress?.certificateEarned).length;

          const progressData: ProgressData[] = [
            { stage: "Pre Survey", y2025: totalStudents > 0 ? Math.round((preSurveyCount / totalStudents) * 100) : 0 },
            { stage: "Course completed", y2025: totalStudents > 0 ? Math.round((courseCompletedCount / totalStudents) * 100) : 0 },
            { stage: "idea submission", y2025: totalStudents > 0 ? Math.round((ideaSubmissionCount / totalStudents) * 100) : 0 },
            { stage: "Post Survey", y2025: totalStudents > 0 ? Math.round((postSurveyCount / totalStudents) * 100) : 0 },
            { stage: "certificate", y2025: totalStudents > 0 ? Math.round((certificateCount / totalStudents) * 100) : 0 },
          ];

          setData(progressData);
        } else {
          setError(response.error || 'Failed to fetch progress data');
        }
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [selectedCourse]);

  if (loading) {
    return (
      <Card className="bg-white">
        <div className="px-5 pt-4 text-[14px] font-medium text-[var(--neutral-1000)]">
          Class Progress
        </div>
        <CardContent className="px-5 pb-5">
          <div className="h-[240px] w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white">
        <div className="px-5 pt-4 text-[14px] font-medium text-[var(--neutral-1000)]">
          Class Progress
        </div>
        <CardContent className="px-5 pb-5">
          <div className="h-[240px] w-full flex items-center justify-center">
            <p className="text-red-600 text-sm">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <div className="px-5 pt-4 text-[14px] font-medium text-[var(--neutral-1000)]">
        Class Progress
      </div>

      <CardContent className="px-5 pb-5">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <BarChart
            data={data}
            margin={{ top: 12, right: 8, bottom: 8, left: 24 }}
            barCategoryGap={24}
            barGap={6}
            
          >
            <CartesianGrid strokeDasharray="2 6" vertical horizontal stroke="var(--neutral-200)" />

            <XAxis
              dataKey="stage"
              tickLine={false}
              axisLine={{ stroke: "#00001A4D", strokeWidth: 2 }}
              tickMargin={8}
              tick={{ fill: "var(--neutral-800)", fontSize: 12 }}
            />
            <YAxis
              width={28}
              domain={[0, 100]}
              tickCount={6}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--neutral-700)", fontSize: 11 }}
              tickFormatter={(value) => `${value}%`}
            />

            <ChartTooltip
              cursor={{ fill: "transparent" }}
              content={<ChartTooltipContent className="text-[12px]" formatter={(value) => `${value}%`} />}
            />

            <Bar
              dataKey="y2025"
              fill="#8979FF"
              radius={[70, 70, 70, 70]}
              barSize={120}
            />
            
          </BarChart>
          
        </ChartContainer>

        <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-[var(--neutral-900)]">
          <span className="h-2.5 w-2.5 " style={{ background: "#8979FF" }} />
          2025
        </div>
      </CardContent>
    </Card>
  );
}
