"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  y2025: { label: "2025", color: "#8979FF" },
} satisfies ChartConfig;

// keep this in sync with <Bar barSize={...} />
const BAR_SIZE = 120;

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
            barCategoryGap={24}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="2 6" vertical horizontal stroke="var(--neutral-200)" />

            <XAxis
              dataKey="stage"
              tickLine={false}
                            axisLine={{ stroke: "#00001A4D", strokeWidth: 2 }} // dark & thick
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

            <ChartTooltip cursor={{ fill: "transparent" }} content={<ChartTooltipContent className="text-[12px]" />} />

            {/* Bars: width = 120px, color = #8979FF (to match teacher card) */}
            <Bar dataKey="y2025" fill="#8979FF" radius={[70, 70, 70, 70]} barSize={BAR_SIZE} />
          </BarChart>
        </ChartContainer>

        {/* legend */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-[var(--neutral-900)]">
          <span className="h-2.5 w-2.5" style={{ background: "#8979FF" }} />
          2025
        </div>
      </CardContent>
    </Card>
  );
}
