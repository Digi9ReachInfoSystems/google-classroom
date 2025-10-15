"use client";

import React from "react";
import { PieChart, Pie, LabelList } from "recharts";
import { Download } from "lucide-react";

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
import Pagination from "@/components/ui/pagination";
import { useDistrictCourse } from "../../districtadmin/context/DistrictCourseContext";

/* -------------------- filter option values (will be fetched from API) -------------------- */
const DEFAULT_AGES = ["All", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"];
const DEFAULT_GRADES = ["All", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const DEFAULT_GENDERS = ["All", "Male", "Female"];
const DEFAULT_DISABILITY = ["All", "None", "Mild", "Moderate", "Severe"];
const BLUE_100 = "var(--blue-800)";
const ERROR_200 = "var(--pink-100)";
const BLUE_700 = "var(--purple-100)";

const baseConfig: ChartConfig = {
  submit:   { label: "Submit",   color: BLUE_100 },
  pending:  { label: "Pending",  color: ERROR_200 },
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
  const key =
    (filters.age ?? "-") +
    (filters.grade ?? "-") +
    (filters.gender ?? "-") +
    (filters.disability ?? "-");

  const base = hashStr(key || "default");
  const mk3 = (s: number) => {
    const a = 35 + ((base >> (s + 1)) % 45);
    const b = 10 + ((base >> (s + 7)) % 35);
    let c = 100 - (a + b);
    c = clamp(c, 2, 80);
    return [clamp(a, 20, 90), clamp(b, 5, 60), clamp(c, 2, 80)] as const;
  };
  const [p1, p2, p3] = mk3(0);
  const [q1, q2, q3] = mk3(4);
  const [r1, r2, r3] = mk3(8);
  const [s1, s2, s3] = mk3(12);

  return {
    /* Pre survey */
    pre: [
      { key: "submit",   value: p1, fill: BLUE_100 },
      { key: "pending",  value: p2, fill: ERROR_200 },
    ],
    /* Student course: Completed / In progress / Not started */
    course: [
      { key: "submit",   value: q1, fill: BLUE_700 },  // Completed
      { key: "pending",  value: q2, fill: ERROR_200 }, // In progress
    ],
    /* Idea submission */
    idea: [
      { key: "submit",   value: r1, fill: BLUE_100 },  // Submitted ideas
      { key: "pending",  value: r2, fill: ERROR_200 }, // In draft ideas
    ],
    /* Post survey */
    post: [
      { key: "submit",   value: s1, fill: BLUE_100 },
      { key: "pending",  value: s2, fill: ERROR_200 },
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
  // Filter out zero values
  const nonZeroData = data.filter(d => d.value > 0);
  
  // Create legend only for non-zero items
  const legend = nonZeroData.map((d, i) => {
    const baseColor =
      (baseConfig as Record<string, { color: string }>)[d.key]?.color;
    const originalIndex = data.findIndex(item => item.key === d.key);
    return {
      color: d.fill ?? baseColor ?? "var(--neutral-300)",
      label: legendLabels[originalIndex] || legendLabels[i],
    };
  });

  // If no data, show empty state
  if (nonZeroData.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(260px,380px)_auto] items-center gap-5">
        <div className="flex flex-col items-center">
          <div className="mx-auto aspect-square max-h-[260px] w-full flex items-center justify-center">
            <p className="text-sm text-gray-400">No data available</p>
          </div>
          <p className="mt-2 text-[11px] text-[var(--neutral-700)] text-center">{title}</p>
        </div>
        <div className="justify-self-start sm:justify-self-auto">
          <p className="text-sm text-gray-400">No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(260px,380px)_auto] items-center gap-5">
      <div className="flex flex-col items-center">
        <ChartContainer
          config={baseConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[260px] w-full"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={nonZeroData} dataKey="value" nameKey="key" stroke="transparent">
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

export default function PiCharts() {
  const { selectedCourse } = useDistrictCourse();
  const [age, setAge] = React.useState<string>('All');
  const [grade, setGrade] = React.useState<string>('All');
  const [gender, setGender] = React.useState<string>('All');
  const [disability, setDisability] = React.useState<string>('All');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [charts, setCharts] = React.useState<ChartSet>({
    pre: [{ key: "submit", value: 0, fill: BLUE_100 }, { key: "pending", value: 0, fill: ERROR_200 }],
    course: [{ key: "submit", value: 0, fill: BLUE_100 }, { key: "pending", value: 0, fill: ERROR_200 }],
    idea: [{ key: "submit", value: 0, fill: BLUE_100 }, { key: "pending", value: 0, fill: ERROR_200 }],
    post: [{ key: "submit", value: 0, fill: BLUE_100 }, { key: "pending", value: 0, fill: ERROR_200 }],
  });

  const [reportData, setReportData] = React.useState<any[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
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

  const isLg = useMedia("(min-width: 1024px)");

  // Fetch report data when course changes
  React.useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = selectedCourse
          ? `/api/districtadmin/report-analytics?courseId=${selectedCourse.id}`
          : '/api/districtadmin/report-analytics';

        console.log('Fetching report analytics:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch report data: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setCharts(data.charts);
          setReportData(data.reportData || []);
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

  const onGenerate = async () => {
    console.log('District admin generate button clicked');
    console.log('Selected course:', selectedCourse);
    console.log('Current filters:', { age, grade, gender, disability });
    
    // Re-fetch with filters applied to display in table
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('courseId', selectedCourse.id);
      if (age && age !== 'All') params.set('age', age);
      if (grade && grade !== 'All') params.set('grade', grade);
      if (gender && gender !== 'All') params.set('gender', gender);
      if (disability && disability !== 'All') params.set('disability', disability);

      console.log('Fetching analytics with params:', params.toString());
      const response = await fetch(`/api/districtadmin/reports/analytics?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      console.log('Analytics response:', data);

      if (data.success) {
        // Update charts (unaffected by filters - shows overall stats)
        if (data.analytics) {
          const analytics = data.analytics;
          setCharts({
            pre: [
              { key: "submit", value: analytics.preSurvey?.completed || 0, fill: BLUE_100 },
              { key: "pending", value: analytics.preSurvey?.pending || 0, fill: ERROR_200 },
            ],
            course: [
              { key: "submit", value: analytics.course?.completed || 0, fill: BLUE_700 },
              { key: "pending", value: analytics.course?.inProgress || 0, fill: ERROR_200 },
            ],
            idea: [
              { key: "submit", value: analytics.ideas?.submitted || 0, fill: BLUE_100 },
              { key: "pending", value: analytics.ideas?.pending || 0, fill: ERROR_200 },
            ],
            post: [
              { key: "submit", value: analytics.postSurvey?.completed || 0, fill: BLUE_100 },
              { key: "pending", value: analytics.postSurvey?.pending || 0, fill: ERROR_200 },
            ],
          });
        }
        
        // Update report data (filtered by demographics)
        setReportData(data.reportData || []);
        console.log('Report data updated:', data.reportData?.length || 0, 'students');
      } else {
        throw new Error(data.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error generating filtered report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      alert(`Failed to generate report: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
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
                  disabled={loading || !selectedCourse}
                  className="h-9 rounded-full px-5 bg-[var(--primary)] hover:bg-[var(--primary)] text-white text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
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

            {/* Data table (student report data) */}
            {reportData.length > 0 && (
              <StudentDataTable
                reportData={reportData}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* ----------------------- Student Data Table ----------------------- */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--primary)] text-white text-[11px] px-2.5 py-[5px] leading-none">
      {children}
    </span>
  );
}

function StudentDataTable({
  reportData,
}: {
  reportData: any[];
}) {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [reportData]);

  const totalItems = reportData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const rows = reportData.slice(start, start + itemsPerPage);
  
  // Function to export to Excel
  const handleExportExcel = () => {
    // Create CSV content
    const headers = ['No', 'Student Name', 'Email', 'Age', 'Grade', 'Gender', 'Disability', 'School', 'Pre-Survey', 'Ideas', 'Post-Survey', 'Course Status'];
    const csvRows = [headers.join(',')];
    
    reportData.forEach((row, index) => {
      const csvRow = [
        index + 1,
        `"${row.studentName}"`,
        row.email,
        row.age,
        row.grade,
        row.gender,
        row.disability,
        `"${row.schoolName}"`,
        row.preSurveyStatus,
        row.ideaStatus,
        row.postSurveyStatus,
        row.courseStatus
      ];
      csvRows.push(csvRow.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Student Report Data</h3>
        {reportData.length > 0 && (
          <Button
            onClick={handleExportExcel}
            className="h-9 rounded-full px-5 bg-[var(--success-500)] hover:bg-[var(--success-600)] text-white text-[14px]"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        )}
      </div>
      
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full rounded-t-lg overflow-hidden border-collapse">
            <thead className="bg-[#F1F5F6]">
              <tr className="text-[12px] text-[var(--neutral-900)]">
                <th className="px-4 py-4 text-left font-normal">No</th>
                <th className="px-4 py-4 text-left font-normal">Student Name</th>
                <th className="px-4 py-4 text-left font-normal">Email</th>
                <th className="px-4 py-4 text-left font-normal">Age</th>
                <th className="px-4 py-4 text-left font-normal">Grade</th>
                <th className="px-4 py-4 text-left font-normal">Gender</th>
                <th className="px-4 py-4 text-left font-normal">Disability</th>
                <th className="px-4 py-4 text-left font-normal">School</th>
                <th className="px-4 py-4 text-left font-normal">Pre-Survey</th>
                <th className="px-4 py-4 text-left font-normal">Ideas</th>
                <th className="px-4 py-4 text-left font-normal">Post-Survey</th>
                <th className="px-4 py-4 text-left font-normal">Course Status</th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="max-h-[520px] overflow-y-auto rounded-b-lg custom-scrollbar">
          <table className="w-full">
            <tbody>
              {rows.map((row, index) => (
                <tr key={start + index} className="text-[12px] hover:bg-gray-50">
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)] text-[var(--neutral-1000)]">{start + index + 1}</td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">{row.studentName}</td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">{row.email}</td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">{row.age}</td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">{row.grade}</td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">{row.gender}</td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">{row.disability}</td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">{row.schoolName}</td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">
                    <Chip>{row.preSurveyStatus}</Chip>
                  </td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">
                    <Chip>{row.ideaStatus}</Chip>
                  </td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">
                    <Chip>{row.postSurveyStatus}</Chip>
                  </td>
                  <td className="px-4 py-4 border-t border-[var(--neutral-200)]">
                    <Chip>{row.courseStatus}</Chip>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-10 text-center text-[var(--neutral-700)] border-t border-[var(--neutral-200)]">
                    No data. Click "Generate" to load report data with selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 md:px-5 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}