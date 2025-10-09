"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, LabelList, Cell } from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDistrictCourse } from "../../districtadmin/context/DistrictCourseContext";

const PURPLE = "#8B5CF6";
const SALMON = "#F87171";
const LIGHT_BLUE = "#60A5FA";
const GREEN = "#10B981";

const chartConfig: ChartConfig = {
  completed: { label: "Completed", color: GREEN },
  inProgress: { label: "In Progress", color: LIGHT_BLUE },
  pending: { label: "Pending", color: SALMON },
  notStarted: { label: "Not Started", color: PURPLE },
};

interface ReportData {
  preSurvey: { completed: number; pending: number };
  courseProgress: { completed: number; inProgress: number; notStarted: number };
  ideaSubmission: { submitted: number; draft: number; notStarted: number };
  postSurvey: { completed: number; pending: number };
  students: Array<{
    name: string;
    email: string;
    preSurvey: string;
    courseProgress: number;
    ideaSubmission: string;
    postSurvey: string;
  }>;
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-[12px] text-[var(--neutral-900)]">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

function PieBlock({
  title,
  data,
  colors,
}: {
  title: string;
  data: Array<{ name: string; value: number }>;
  colors: string[];
}) {
  const legend = data.map((d, i) => ({
    color: colors[i] || "#ccc",
    label: d.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(200px,300px)_auto] items-center gap-5">
          <div className="flex flex-col items-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[200px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={data} dataKey="value" nameKey="name" stroke="transparent">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                  <LabelList dataKey="value" className="fill-background" stroke="none" fontSize={12} />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
          <div className="justify-self-start sm:justify-self-auto">
            <Legend items={legend} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DistrictPiCharts() {
  const { selectedCourse } = useDistrictCourse();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<string>("performance");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = selectedCourse
          ? `/api/districtadmin/report-data?courseId=${selectedCourse.id}`
          : '/api/districtadmin/report-data';

        console.log('Fetching report data:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch report data: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setReportData(data.data);
        } else {
          throw new Error(data.message || 'Failed to load report data');
        }
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedCourse]);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      const url = selectedCourse
        ? `/api/district/reports?type=${reportType}&format=excel&courseId=${selectedCourse.id}`
        : `/api/district/reports?type=${reportType}&format=excel`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        alert(`Report generated successfully! Filename: ${data.filename}`);
        // In a real implementation, you would download the Excel file here
      } else {
        throw new Error(data.message || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading report data...</p>
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
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No report data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const preSurveyData = [
    { name: "Completed", value: reportData.preSurvey.completed },
    { name: "Pending", value: reportData.preSurvey.pending },
  ].filter(d => d.value > 0);

  const courseProgressData = [
    { name: "Completed", value: reportData.courseProgress.completed },
    { name: "In Progress", value: reportData.courseProgress.inProgress },
    { name: "Not Started", value: reportData.courseProgress.notStarted },
  ].filter(d => d.value > 0);

  const ideaSubmissionData = [
    { name: "Submitted", value: reportData.ideaSubmission.submitted },
    { name: "Draft", value: reportData.ideaSubmission.draft },
    { name: "Not Started", value: reportData.ideaSubmission.notStarted },
  ].filter(d => d.value > 0);

  const postSurveyData = [
    { name: "Completed", value: reportData.postSurvey.completed },
    { name: "Pending", value: reportData.postSurvey.pending },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header with filters and export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedCourse ? `Viewing: ${selectedCourse.name}` : 'All Courses'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
              <SelectItem value="completion">Completion</SelectItem>
              <SelectItem value="schools">Schools</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {generating ? 'Generating...' : 'Export Excel'}
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieBlock
          title="Pre Survey Status"
          data={preSurveyData}
          colors={[GREEN, SALMON]}
        />
        <PieBlock
          title="Course Progress"
          data={courseProgressData}
          colors={[GREEN, LIGHT_BLUE, PURPLE]}
        />
        <PieBlock
          title="Idea Submission"
          data={ideaSubmissionData}
          colors={[GREEN, SALMON, PURPLE]}
        />
        <PieBlock
          title="Post Survey Status"
          data={postSurveyData}
          colors={[GREEN, SALMON]}
        />
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Progress Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-sm text-left">
                  <th className="px-4 py-3 font-medium">Student Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Pre Survey</th>
                  <th className="px-4 py-3 font-medium">Course Progress</th>
                  <th className="px-4 py-3 font-medium">Idea Submission</th>
                  <th className="px-4 py-3 font-medium">Post Survey</th>
                </tr>
              </thead>
              <tbody>
                {reportData.students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No student data available
                    </td>
                  </tr>
                ) : (
                  reportData.students.map((student, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{student.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          student.preSurvey === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.preSurvey}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${student.courseProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">{student.courseProgress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          student.ideaSubmission === 'Submitted' ? 'bg-green-100 text-green-800' : 
                          student.ideaSubmission === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {student.ideaSubmission}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          student.postSurvey === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.postSurvey}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
