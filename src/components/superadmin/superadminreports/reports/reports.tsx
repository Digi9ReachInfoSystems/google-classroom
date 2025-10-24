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
import { useSuperAdminCourse } from "@/components/superadmin/context/SuperAdminCourseContext";

/* -------------------- filter option values (will be fetched from API) -------------------- */
const DEFAULT_AGES = ["All", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25"];
const DEFAULT_GRADES = ["All", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const DEFAULT_GENDERS = ["All", "Male", "Female", "Other"];
const DEFAULT_DISABILITY = ["All", "None", "Mild", "Moderate", "Severe"];
const CORAL = "#FF928A"; // Coral color for main segments
const PURPLE = "#8979FF"; // Purple color for secondary segments  
const CYAN = "#3CC3DF"; // Cyan color for tertiary segments

const baseConfig: ChartConfig = {
  submit:   { label: "Submit",   color: CORAL },
  pending:  { label: "Pending",  color: PURPLE },
};

type Slice = { key: keyof typeof baseConfig; value: number; fill?: string };
type ChartSet = { pre: Slice[]; course: Slice[]; idea: Slice[]; post: Slice[] };

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function makeCharts(filters: {
  age?: string;
  grade?: string;
  gender?: string;
  disability?: string;
}): ChartSet {
  // Return exact values from the image
  return {
    /* Pre survey status */
    pre: [
      { key: "submit",   value: 58.62, fill: CORAL },
      { key: "pending",  value: 24.61, fill: PURPLE },
    ],
    /* Student course status */
    course: [
      { key: "pending",  value: 20, fill: PURPLE },   // In progress
      { key: "submit",   value: 40, fill: CYAN },    // Completed
    ],
    /* Idea submission status */
    idea: [
      { key: "submit",   value: 80, fill: CORAL },     // Submitted ideas
      { key: "pending",  value: 2.75, fill: PURPLE },    // In draft ideas
    ],
    /* Post survey status */
    post: [
      { key: "submit",   value: 97.69, fill: CORAL },
      { key: "pending",  value: 13.64, fill: PURPLE },
    ],
  };
}

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

export default function Reports() {
  const { selectedCourse } = useSuperAdminCourse();
  const [age, setAge] = React.useState<string>('All');
  const [grade, setGrade] = React.useState<string>('All');
  const [gender, setGender] = React.useState<string>('All');
  const [disability, setDisability] = React.useState<string>('All');
  const [loading, setLoading] = React.useState(false);

  const [charts, setCharts] = React.useState<ChartSet>({
    pre: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: CORAL }],
    course: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: CORAL }],
    idea: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: CORAL }],
    post: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: CORAL }],
  });

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

  // Fetch analytics data (unfiltered for charts)
  React.useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedCourse?.id) {
        setCharts({
          pre: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: CORAL }],
          course: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: CORAL }],
          idea: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: CORAL }],
          post: [{ key: "submit", value: 0, fill: PURPLE }, { key: "pending", value: 0, fill: CORAL }],
        });
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ courseId: selectedCourse.id });
        const response = await fetch(`/api/superadmin/reports/analytics?${params}`, {
          credentials: 'include'
        });

        const data = await response.json();
        if (data.success && data.analytics) {
          const analytics = data.analytics;
          setCharts({
            pre: [
              { key: "submit", value: analytics.preSurvey.completed, fill: PURPLE },
              { key: "pending", value: analytics.preSurvey.pending + analytics.preSurvey.notStarted, fill: CORAL },
            ],
            course: [
              { key: "submit", value: analytics.course.completed, fill: PURPLE },
              { key: "pending", value: analytics.course.inProgress + analytics.course.notStarted, fill: CORAL },
            ],
            idea: [
              { key: "submit", value: analytics.ideas.submitted, fill: PURPLE },
              { key: "pending", value: analytics.ideas.pending + analytics.ideas.notStarted, fill: CORAL },
            ],
            post: [
              { key: "submit", value: analytics.postSurvey.completed, fill: PURPLE },
              { key: "pending", value: analytics.postSurvey.pending + analytics.postSurvey.notStarted, fill: CORAL },
            ],
          });
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedCourse]); // Charts only depend on selectedCourse

  const isLg = useMedia("(min-width: 1024px)");

  const onGenerate = async () => {
    if (!selectedCourse?.id) {
      alert('Please select a course first');
      return;
    }

    // Build filter params
    const params: any = { courseId: selectedCourse.id };
    if (age && age !== 'All') params.age = age;
    if (grade && grade !== 'All') params.grade = grade;
    if (gender && gender !== 'All') params.gender = gender;
    if (disability && disability !== 'All') params.disability = disability;

    try {
      const response = await fetch('/api/superadmin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          courseId: selectedCourse.id, 
          filters: { 
            age: age !== 'All' ? age : undefined,
            grade: grade !== 'All' ? grade : undefined,
            gender: gender !== 'All' ? gender : undefined,
            disability: disability !== 'All' ? disability : undefined
          } 
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${selectedCourse.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        console.error('Failed to generate report:', error);
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    }
  };

  return (
    <section className="w-full px-4 py-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-semibold">
            Reports & Exports
          </h1>
          <p className="text-[14px] text-[var(--neutral-700)]">
            Let’s see the current statistics performance
          </p>
        </div>

        <Card className="bg-white">
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[16px] font-medium text-[var(--neutral-900)]">Data Analytics</div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={age} onValueChange={setAge}>
                  <SelectTrigger className="h-9 px-4 rounded-full w-[140px] text-[14px]">
                    <SelectValue placeholder="Select Age" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-center">
                    {filterOptions.ages.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-[14px] rounded-md data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white text-center flex justify-center"
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-9 px-4 rounded-full w-[160px] text-[14px]">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-center">
                    {filterOptions.grades.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-[14px] rounded-md data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white text-center flex justify-center"
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="h-9 px-4 rounded-full w-[160px] text-[14px]">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-center">
                    {filterOptions.genders.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-[14px] rounded-md data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white text-center flex justify-center"
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={disability} onValueChange={setDisability}>
                  <SelectTrigger className="h-9 px-4 rounded-full w-[170px] text-[14px]">
                    <SelectValue placeholder="Select Disability" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-center">
                    {filterOptions.disabilities.map((r) => (
                      <SelectItem
                        key={r}
                        value={r}
                        className="text-[14px] rounded-md data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white text-center flex justify-center"
                      >
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  onClick={onGenerate}
                  className="h-9 rounded-full px-5 bg-[var(--primary)] hover:bg-[var(--primary)] text-white text-[14px]"
                >
                  Report
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {charts.pre.every(chart => chart.value === 0) && 
             charts.course.every(chart => chart.value === 0) && 
             charts.idea.every(chart => chart.value === 0) && 
             charts.post.every(chart => chart.value === 0) ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No Data Available</div>
                <div className="text-gray-400 text-sm">
                  No student submissions found for this course. Charts will appear once students start submitting assignments.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-10">
                <PieBlock
                  title="Pre survey status"
                  data={charts.pre}
                  legendLabels={["Completed", "Pending"]}
                />
                <PieBlock
                  title="Student course status"
                  data={charts.course}
                  legendLabels={["Completed", "Pending"]}
                />
                <PieBlock
                  title="Idea Submission status"
                  data={charts.idea}
                  legendLabels={["Completed", "Pending"]}
                />
                <PieBlock
                  title="Post survey status"
                  data={charts.post}
                  legendLabels={["Completed", "Pending"]}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}