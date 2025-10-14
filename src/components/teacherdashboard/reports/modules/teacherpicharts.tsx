"use client";

import React from "react";
import { PieChart, Pie, LabelList } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useFilters } from "./FilterContext";

/* -------------------- filter option values (will be fetched from API) -------------------- */
const DEFAULT_AGES = ["All", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"];
const DEFAULT_GRADES = ["All", "Grade I", "Grade II", "Grade III", "Grade IV", "Grade V", "Grade VI", "Grade VII", "Grade VIII", "Grade IX", "Grade X"];
const DEFAULT_GENDERS = ["All", "Male", "Female", "Other"];
const DEFAULT_DISABILITY = ["All", "None", "Visual Impairment", "Hearing Impairment", "Physical Disability", "Learning Disability", "Other"];

/* ---------------------------- Color rules ---------------------------- */
/** Purple for Submit/Submitted ideas/Not started */
const PURPLE = "#8B5CF6";
/** Salmon/Red for Pending/In progress/In draft */
const SALMON = "#F87171";
/** Light blue for Completed/Not started idea submission */
const LIGHT_BLUE = "#60A5FA";

/* keys are buckets; we override `fill` per slice as needed */
const baseConfig: ChartConfig = {
  submit:   { label: "Submit",   color: PURPLE },
  pending:  { label: "Pending",  color: SALMON },
  reviewed: { label: "Reviewed", color: LIGHT_BLUE },
};

type Slice = { key: keyof typeof baseConfig; value: number; fill?: string };
type ChartSet = { pre: Slice[]; course: Slice[]; idea: Slice[]; post: Slice[] };

import { useTeacherCourse } from "../../context/TeacherCourseContext";

/* ----------------------------- Legend ----------------------------- */
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

function useMedia(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/* --------------------------- Pie Block --------------------------- */
function PieBlock({
  title,
  data,
  legendLabels,
}: {
  title: string;
  data: Slice[];
  legendLabels: string[];
}) {
  const legend = data.map((d, i) => {
    const baseColor =
      (baseConfig as Record<string, { color: string }>)[d.key]?.color;
    return {
      color: d.fill ?? baseColor ?? "var(--neutral-300)", // ← safe fallback, no non-null assertion
      label: legendLabels[i],
    };
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(260px,380px)_auto] items-center gap-5">
      <div className="flex flex-col items-center">
        <ChartContainer
          config={baseConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[260px] w-full"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="key" stroke="transparent">
              <LabelList dataKey="value" className="fill-background" stroke="none" fontSize={12} />
            </Pie>
          </PieChart>
        </ChartContainer>
        <p className="mt-2 text-[11px] text-[var(--neutral-700)] text-center">{title}</p>
      </div>

      <div className="justify-self-start sm:justify-self-auto">
        <Legend items={legend} />
      </div>
    </div>
  );
}

/* --------------------------------- Page --------------------------------- */
export default function TeacherPiCharts() {
  const { filters, setAge, setGrade, setGender, setDisability, triggerRefresh } = useFilters();
  const { selectedCourse } = useTeacherCourse();
  
  const [charts, setCharts] = React.useState<ChartSet>({
    pre: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: SALMON }],
    course: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: SALMON }],
    idea: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: SALMON }],
    post: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: SALMON }],
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Dynamic filter options from API
  const [filterOptions, setFilterOptions] = React.useState({
    ages: DEFAULT_AGES,
    grades: DEFAULT_GRADES,
    genders: DEFAULT_GENDERS,
    disabilities: DEFAULT_DISABILITY
  });

  // Fetch filter options on mount
  React.useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/filter-options');
        const data = await response.json();
        
        if (data.success && data.filters) {
          setFilterOptions({
            ages: ['All', ...(data.filters.age || [])],
            grades: ['All', ...(data.filters.grade || [])],
            genders: ['All', ...(data.filters.gender || [])],
            disabilities: ['All', ...(data.filters.disability || [])]
          });
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    
    fetchFilterOptions();
  }, []);

  // Fetch real analytics data
  React.useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedCourse) {
        console.log('No course selected, setting empty charts');
        setCharts({
          pre: [],
          course: [],
          idea: [],
          post: [],
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch analytics without filters for pie charts (show all students)
        const params = new URLSearchParams({
          courseId: selectedCourse.id,
        });

        const response = await fetch(`/api/teacher/reports/analytics?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success && data.analytics) {
          const analytics = data.analytics;
          
          setCharts({
            pre: [
              { key: "submit", value: analytics.preSurvey.completed, fill: PURPLE },
              { key: "pending", value: analytics.preSurvey.pending + analytics.preSurvey.notStarted, fill: SALMON },
            ],
            course: [
              { key: "submit", value: analytics.course.completed, fill: PURPLE },
              { key: "pending", value: analytics.course.inProgress + analytics.course.notStarted, fill: SALMON },
            ],
            idea: [
              { key: "submit", value: analytics.ideas.submitted, fill: PURPLE },
              { key: "pending", value: analytics.ideas.pending + analytics.ideas.notStarted, fill: SALMON },
            ],
            post: [
              { key: "submit", value: analytics.postSurvey.completed, fill: PURPLE },
              { key: "pending", value: analytics.postSurvey.pending + analytics.postSurvey.notStarted, fill: SALMON },
            ],
          });
        } else {
          console.error('Analytics API error:', data);
          setError(data.error || 'Failed to fetch analytics data');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedCourse]); // Removed filters from dependency - charts don't change with filters

  const isLg = useMedia("(min-width: 1024px)");

  const onGenerate = async () => {
    console.log('Generate button clicked');
    console.log('Selected course:', selectedCourse);
    console.log('Current filters:', filters);
    
    // Generate and download filtered report
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending request to generate report...');
      const response = await fetch('/api/teacher/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          filters: {
            age: filters.age !== 'All' ? filters.age : undefined,
            grade: filters.grade !== 'All' ? filters.grade : undefined,
            gender: filters.gender !== 'All' ? filters.gender : undefined,
            disability: filters.disability !== 'All' ? filters.disability : undefined,
          }
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate report');
      }

      // Create blob and download
      const blob = await response.blob();
      console.log('Blob size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create filename based on filters
      const filterParts = [];
      if (filters.age && filters.age !== 'All') filterParts.push(`Age-${filters.age}`);
      if (filters.grade && filters.grade !== 'All') filterParts.push(`Grade-${filters.grade}`);
      if (filters.gender && filters.gender !== 'All') filterParts.push(filters.gender);
      if (filters.disability && filters.disability !== 'All') filterParts.push(filters.disability);
      
      const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : '';
      a.download = `Report_${selectedCourse.name.replace(/[^a-zA-Z0-9]/g, '-')}${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      console.log('Downloading file:', a.download);
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Trigger refresh of reports table after a small delay to ensure DB save completes
      setTimeout(() => {
        console.log('Triggering table refresh');
        triggerRefresh();
      }, 500);
      
      alert('Report generated successfully!');
    } catch (err) {
      console.error('Error generating report:', err);
      alert(`Failed to generate report: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCourse) {
    return (
      <section className="w-full px-4 py-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-semibold">
              Reports & Exports
            </h1>
            <p className="text-[12px] text-[var(--neutral-700)]">
              Let's see the current statistics performance
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-600 text-sm">Please select a course to view analytics.</p>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="w-full px-4 py-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-semibold">
              Reports & Exports
            </h1>
            <p className="text-[12px] text-[var(--neutral-700)]">
              Let's see the current statistics performance
            </p>
          </div>
          <div className="bg-white border-none shadow-none rounded-lg p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-600">Loading analytics...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full px-4 py-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-semibold">
              Reports & Exports
            </h1>
            <p className="text-[12px] text-[var(--neutral-700)]">
              Let's see the current statistics performance
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">Error loading analytics: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-semibold">
            Reports & Exports
          </h1>
          <p className="text-[12px] text-[var(--neutral-700)]">
            Let’s see the current statistics performance
          </p>
        </div>

        <Card className="bg-white border-none shadow-none rounded-lg">
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[16px] font-medium text-[var(--neutral-900)]">Data Analytics</div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={filters.age} onValueChange={setAge}>
                  <SelectTrigger className="h-8 px-3 rounded-full w-[140px] text-[12px]">
                    <SelectValue placeholder="Select Age" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {filterOptions.ages.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-[12px] rounded-md data-[highlighted]:bg-[var(--warning-400)] data-[highlighted]:text-white"
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-8 px-3 rounded-full w-[150px] text-[12px]">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {filterOptions.grades.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-[12px] rounded-md data-[highlighted]:bg-[var(--warning-400)] data-[highlighted]:text-white"
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.gender} onValueChange={setGender}>
                  <SelectTrigger className="h-8 px-3 rounded-full w-[160px] text-[12px]">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {filterOptions.genders.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-[12px] rounded-md data-[highlighted]:bg-[var(--warning-400)] data-[highlighted]:text-white"
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.disability} onValueChange={setDisability}>
                  <SelectTrigger className="h-8 px-3 rounded-full w-[170px] text-[12px]">
                    <SelectValue placeholder="Select Disability" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {filterOptions.disabilities.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-[12px] rounded-md data-[highlighted]:bg-[var(--warning-400)] data-[highlighted]:text-white"
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  onClick={onGenerate}
                  disabled={loading || !selectedCourse}
                  className="h-8 rounded-full px-4 bg-[var(--warning-400)] hover:bg-[var(--warning-500)] text-white text-[12px] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-10">
              <PieBlock
                title="Pre survey status"
                data={charts.pre}
                legendLabels={["Submit", "Pending"]}
              />
              <PieBlock
                title="Student course status"
                data={charts.course}
                legendLabels={["Not started", "In progress", "Completed"]}
              />
              <PieBlock
                title="Idea Submission status"
                data={charts.idea}
                legendLabels={["Submitted ideas", "In draft ideas", "Not started idea submission"]}
              />
              <PieBlock
                title="Post survey status"
                data={charts.post}
                legendLabels={["Submit", "pending"]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
