"use client";

import React from "react";
import { PieChart, Pie, LabelList } from "recharts";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

/* -------------------- filter option values -------------------- */
const AGES = ["10–12", "13–15", "16–18"] as const;
const GRADES = ["6", "7", "8", "9", "10", "11", "12"] as const;
const GENDERS = ["Male", "Female", "Other"] as const;
const DISABILITY = ["None", "Hearing", "Vision", "Learning", "Mobility"] as const;

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

/* --- deterministic “fake” data generator so selections change the pies --- */
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function makeCharts(filters: {
  dateRange?: DateRange;
  age?: string;
  grade?: string;
  gender?: string;
  disability?: string;
}): ChartSet {
  // Return the exact data from the image
  return {
    /* Pre survey - Submit: 58.62, Pending: 24.61 */
    pre: [
      { key: "submit",   value: 58.62, fill: PURPLE },
      { key: "pending",  value: 24.61, fill: SALMON },
    ],
    /* Student course - Not started: 40, In progress: 20, Completed: 40 */
    course: [
      { key: "submit",   value: 40, fill: PURPLE },   // Not started
      { key: "pending",  value: 20, fill: SALMON },   // In progress
      { key: "reviewed", value: 40, fill: LIGHT_BLUE }, // Completed
    ],
    /* Idea submission - Submitted: 80, In draft: 2.75, Not started: 18.15 */
    idea: [
      { key: "submit",   value: 80, fill: PURPLE },     // Submitted ideas
      { key: "pending",  value: 2.75, fill: SALMON },  // In draft ideas
      { key: "reviewed", value: 18.15, fill: LIGHT_BLUE }, // Not started ideas
    ],
    /* Post survey - Submit: 97.69, Pending: 13.64 */
    post: [
      { key: "submit",   value: 97.69, fill: PURPLE },
      { key: "pending",  value: 13.64, fill: SALMON },
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

/* --------------------------------- Page --------------------------------- */
export default function TeacherPiCharts() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [age, setAge] = React.useState<string | undefined>();
  const [grade, setGrade] = React.useState<string | undefined>();
  const [gender, setGender] = React.useState<string | undefined>();
  const [disability, setDisability] = React.useState<string | undefined>();

  const [charts, setCharts] = React.useState<ChartSet>(() =>
    makeCharts({ dateRange, age, grade, gender, disability })
  );

  const isLg = useMedia("(min-width: 1024px)");
  const dateLabel =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "dd MMM")} – ${format(dateRange.to, "dd MMM yyyy")}`
      : "Select date range";

  const onGenerate = () => {
    setCharts(makeCharts({ dateRange, age, grade, gender, disability }));
  };

  return (
    <section className="w-full px-4 py-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-[22px] md:text-[36px] font-normal text-[var(--neutral-1000)]">
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 rounded-full px-3 text-[12px] w-[210px] justify-start">
                      {dateLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    side="bottom"
                    sideOffset={8}
                    collisionPadding={12}
                    className="p-2 w-auto rounded-xl border bg-white shadow-xl"
                  >
                    <Calendar
                      mode="range"
                      numberOfMonths={isLg ? 2 : 1}
                      selected={dateRange}
                      onSelect={setDateRange}
                      initialFocus
                      className="w-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Select value={age} onValueChange={setAge}>
                  <SelectTrigger className="h-8 px-3 rounded-full w-[120px] text-[12px]">
                    <SelectValue placeholder="Select Age" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {AGES.map((r) => (
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

                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-8 px-3 rounded-full w-[130px] text-[12px]">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {GRADES.map((r) => (
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

                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="h-8 px-3 rounded-full w-[140px] text-[12px]">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {GENDERS.map((r) => (
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

                <Select value={disability} onValueChange={setDisability}>
                  <SelectTrigger className="h-8 px-3 rounded-full w-[150px] text-[12px]">
                    <SelectValue placeholder="Select Disability" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {DISABILITY.map((r) => (
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
                  className="h-8 rounded-full px-4 bg-[var(--warning-400)] hover:bg-[var(--warning-500)] text-white text-[12px]"
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
