"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceArea,
  Rectangle,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/* data */
const data = [
  { stage: "Pre Survey", y2025: 16 },
  { stage: "Course completed", y2025: 80 },
  { stage: "idea submission", y2025: 92 },
  { stage: "Post Survey", y2025: 18 },
  { stage: "certificate", y2025: 88 },
];

const chartConfig = {
  y2025: { label: "2025", color: "var(--blue-400)" },
} satisfies ChartConfig;

// keep this in sync with <Bar barSize={...} />
const BAR_SIZE = 152;

// Custom cursor that matches the bar width and centers in the category band
function BarWidthCursor(props: any) {
  const { x = 0, y = 0, width = 0, height = 0 } = props || {};
  const cursorWidth = BAR_SIZE;
  const cursorX = x + (width - cursorWidth) / 2;
  return (
    <Rectangle
      x={cursorX}
      y={y}
      width={cursorWidth}
      height={height}
      fill="rgba(214, 219, 237, 0.4)" // #d6dbed @ 40%
      // optional: slight rounding to match bars
    />
  );
}

export default function ClassProgressCard() {
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
            barCategoryGap={40}
            barGap={8}
          >
            <CartesianGrid
              strokeDasharray="2 6"
              vertical
              horizontal
              stroke="var(--neutral-200)"
            />

            {/* light vertical bands */}
            <ReferenceArea
              x1="Pre Survey"
              x2="Course completed"
              fill="var(--neutral-100)"
            />
            <ReferenceArea
              x1="Post Survey"
              x2="certificate"
              fill="var(--neutral-100)"
            />

            <XAxis
              dataKey="stage"
              tickLine={false}
              axisLine={{ stroke: "var(--neutral-1000)", strokeWidth: 2 }} // dark & thick
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
            />

            <ChartTooltip
              cursor={<BarWidthCursor />} // <-- exact-width hover
              content={<ChartTooltipContent className="text-[12px]" />}
            />

            {/* Bars: width = 152px, color = --purple-100 (as in your code) */}
            <Bar
              dataKey="y2025"
              fill="var(--purple-100)"
              radius={[70, 70, 70, 70]}
              barSize={BAR_SIZE}
            />
          </BarChart>
        </ChartContainer>

        {/* legend */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-[var(--neutral-900)]">
          <span
            className="h-2.5 w-2.5"
            style={{ background: "var(--purple-100)" }}
          />
          2025
        </div>
      </CardContent>
    </Card>
  );
}
