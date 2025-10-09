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

const AGES = ["10–12", "13–15", "16–18"] as const;
const GRADES = ["6", "7", "8", "9", "10", "11", "12"] as const;
const GENDERS = ["Male", "Female", "Other"] as const;
const DISABILITY = ["None", "Hearing", "Vision", "Learning", "Mobility"] as const;
const BLUE_100 = "var(--blue-800)";
const ERROR_200 = "var(--pink-100)";
const BLUE_700 = "var(--purple-100)";

const baseConfig: ChartConfig = {
  submit:   { label: "Submit",   color: BLUE_100 },
  pending:  { label: "Pending",  color: ERROR_200 },
  reviewed: { label: "Reviewed", color: BLUE_700 },
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
    (filters.disability ?? "-") +

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
      { key: "reviewed", value: p3, fill: BLUE_700 },
    ],
    /* Student course: Completed / In progress / Not started */
    course: [
      { key: "submit",   value: q1, fill: BLUE_700 },  // Completed
      { key: "pending",  value: q2, fill: ERROR_200 }, // In progress
      { key: "reviewed", value: q3, fill: BLUE_100 },  // Not started
    ],
    /* Idea submission */
    idea: [
      { key: "submit",   value: r1, fill: BLUE_100 },  // Submitted ideas
      { key: "pending",  value: r2, fill: ERROR_200 }, // In draft ideas
      { key: "reviewed", value: r3, fill: BLUE_700 },  // Not started ideas
    ],
    /* Post survey */
    post: [
      { key: "submit",   value: s1, fill: BLUE_100 },
      { key: "pending",  value: s2, fill: ERROR_200 },
      { key: "reviewed", value: s3, fill: BLUE_700 },
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
  const [age, setAge] = React.useState<string | undefined>();
  const [grade, setGrade] = React.useState<string | undefined>();
  const [gender, setGender] = React.useState<string | undefined>();
  const [disability, setDisability] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [charts, setCharts] = React.useState<ChartSet>({
    pre: [{ key: "submit", value: 0, fill: BLUE_100 }, { key: "pending", value: 0, fill: ERROR_200 }],
    course: [{ key: "submit", value: 0, fill: BLUE_100 }, { key: "pending", value: 0, fill: ERROR_200 }, { key: "reviewed", value: 0, fill: BLUE_700 }],
    idea: [{ key: "submit", value: 0, fill: BLUE_100 }, { key: "pending", value: 0, fill: ERROR_200 }, { key: "reviewed", value: 0, fill: BLUE_700 }],
    post: [{ key: "submit", value: 0, fill: BLUE_100 }, { key: "pending", value: 0, fill: ERROR_200 }],
  });

  const [reportData, setReportData] = React.useState<any[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

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

  const onGenerate = () => {
    // Re-fetch with filters applied
    const fetchFiltered = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCourse) params.set('courseId', selectedCourse.id);
        if (age) params.set('age', age);
        if (grade) params.set('grade', grade);
        if (gender) params.set('gender', gender);
        if (disability) params.set('disability', disability);

        const response = await fetch(`/api/districtadmin/report-analytics?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setCharts(data.charts);
          setReportData(data.reportData || []);
        }
      } catch (err) {
        console.error('Error generating filtered report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiltered();
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
                    {AGES.map((r) => (
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
                    {GRADES.map((r) => (
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
                    {GENDERS.map((r) => (
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
                    {DISABILITY.map((r) => (
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
                  Generate
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-10">
              <PieBlock
                title="Pre survey status"
                data={charts.pre}
                legendLabels={["Submit", "Pending", "Reviewed"]}
              />
              <PieBlock
                title="Student course status"
                data={charts.course}
                legendLabels={["Completed", "In progress", "Not started"]}
              />
              <PieBlock
                title="Idea Submission status"
                data={charts.idea}
                legendLabels={["Submitted ideas", "In draft ideas", "Not started idea submission"]}
              />
              <PieBlock
                title="Post survey status"
                data={charts.post}
                legendLabels={["Submit", "Pending", "Reviewed"]}
              />
            </div>

            {/* Data table (student) */}
            <StudentDataTable
              filters={{ age, grade, gender, disability }}
              reportData={reportData}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* ----------------------- Student Data Table ----------------------- */
type TableRow = {
  no: number;
  district: string;
  school: string;
  file: string;
  focal: string[];
  course: string;
  range: string;
  age?: string;
  grade?: string;
  gender?: string;
  disability?: string;
};

function makeRows(): TableRow[] {
  return Array.from({ length: 87 }).map((_, i) => ({
    no: i + 1,
    district: ["Gasa", "Punakha", "Haa"][i % 3],
    school: "School Name",
    file: [
      "Report Name",
      "Report Name",
      "Report Name",
      "Report Name",
      "Report Name",
      "Report Name",
      "Report Name",
      "Report Name",
      "Report Name",
      "Report Name",
    ][i % 10],
    focal:
      i % 4 === 1
        ? ["Age"]
        : i % 4 === 2
        ? ["Gender", "Disability", "Grade"]
        : i % 4 === 3
        ? ["Gender", "Grade"]
        : ["Age", "Gender", "Disability", "Grade"],
    course: ["Biology", "Maths", "Physics"][i % 3],
    range: "10 Jun – 12 Sep",
    age: ["10–12", "13–15", "16–18"][i % 3],
    grade: ["6", "7", "8", "9", "10", "11", "12"][i % 7],
    gender: ["Male", "Female", "Other"][i % 3],
    disability: ["None", "Hearing", "Vision", "Learning", "Mobility"][i % 5],
  }));
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--primary)] text-white text-[11px] px-2.5 py-[5px] leading-none">
      {children}
    </span>
  );
}

function StudentDataTable({
  filters,
  reportData,
}: {
  filters: {
    age?: string;
    grade?: string;
    gender?: string;
    disability?: string;
  };
  reportData: any[];
}) {
  const filteredRows = React.useMemo(() => {
    return reportData.filter((row) => {
      if (filters.age && row.age !== filters.age) return false;
      if (filters.grade && row.grade !== filters.grade) return false;
      if (filters.gender && row.gender !== filters.gender) return false;
      if (filters.disability && row.disability !== filters.disability) return false;
      return true;
    });
  }, [reportData, filters]);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const rows = filteredRows.slice(start, start + itemsPerPage);

  return (
    <div className="mt-10">
      <div className="bg-white rounded-lg border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed rounded-t-lg overflow-hidden border-collapse border-b border-neutral-200">
            <colgroup>
              <col className="w-[56px]" />
              <col className="w-[120px]" />
              <col className="w-[200px]" />
              <col className="w-[180px]" />
              <col className="w-[220px]" />
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[90px]" />
            </colgroup>
            <thead className="bg-[#F1F5F6]">
              <tr className="text-[12px] text-[var(--neutral-900)]">
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[56px]">No</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[120px]">District</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[200px]">School</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[180px]">File name</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[220px]">Focal points</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[160px]">Course name</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[170px]">Date Range</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[90px]">Action</th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="max-h-[520px] overflow-y-auto rounded-b-lg custom-scrollbar">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[56px]" />
              <col className="w-[120px]" />
              <col className="w-[200px]" />
              <col className="w-[180px]" />
              <col className="w-[220px]" />
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[90px]" />
            </colgroup>
            <tbody>
              {rows.map((r) => (
                <tr key={r.no} className="text-[12px]">
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)] text-[var(--neutral-1000)]">{r.no}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.district}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.school}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.file}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    <div className="flex flex-wrap gap-2">
                      {r.focal.map((t: string) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.course}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.range}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--neutral-300)] hover:bg-[var(--neutral-100)]"
                      aria-label={`Download row ${r.no}`}
                    >
                      <Download className="h-4 w-4 text-[var(--neutral-800)]" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-[var(--neutral-700)] border-t border-[var(--neutral-200)]">No data.</td>
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