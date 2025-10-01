"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Rectangle } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"



// --- data ---
const chartData = [
  { name: "Course completion", value: 40 },
  { name: "Idea submission", value: 80 },
]

// --- chart config (kept for ChartContainer) ---
const chartConfig = {
  value: {
    label: "Course completion vs Idea submission",
    color: "var(--purple-100)",
  },
} satisfies ChartConfig
const BAR_SIZE = 150;
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

// --- custom legend to force black text ---
function LegendBlack() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginTop: 20,
        color: "#000000",
        fontWeight: 400,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          background: "var(--purple-100)",
          display: "inline-block",
          borderRadius: 2,
        }}
      />
      <span>Course completion vs Idea submission</span>
    </div>
  )
}

export default function ProgressTrends() {
  return (
    <Card className="rounded-2xl border-0 shadow-none mt-[40px]">
      <CardHeader>
        <CardTitle className="font-normal">Progress Trends</CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={chartData}
            barCategoryGap="20%"
            margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            {/* Y-axis: fixed ticks + domain to 100 */}
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
            />

            {/* X-axis */}
            <XAxis dataKey="name" axisLine={false} tickLine={false} />

            <ChartTooltip  cursor={<BarWidthCursor />} content={<ChartTooltipContent />} />

            {/* Custom legend with black label */}
            <Legend content={<LegendBlack />} />

            {/* Bars */}
            <Bar
              dataKey="value"
              fill="var(--purple-100)"
              barSize={135}
              radius={[67.5, 67.5, 67.5, 67.5]}
              name="Course completion vs Idea submission"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
