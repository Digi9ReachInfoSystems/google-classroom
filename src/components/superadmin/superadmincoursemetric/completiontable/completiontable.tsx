"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// 4 bars per month
const chartData = [
  { month: "District 1", s1: 78, s2: 92, s3: 96, s4: 70 },
  { month: "District 2", s1: 32, s2: 68, s3: 54, s4: 78 },
  { month: "District 3", s1: 60, s2: 18, s3: 26, s4: 85 },
  { month: "District 4", s1: 88, s2: 96, s3: 48, s4: 18 },
  { month: "District 5", s1: 96, s2: 42, s3: 80, s4: 86 },
  { month: "District 6", s1: 92, s2: 34, s3: 66, s4: 78 },
]

// labels + color tokens (uses your CSS variables)
const chartConfig = {
  s1: { label: "Pre survey", color: "#8979FF" },
  s2: { label: "Course progress", color: "#FF928A" },
  s3: { label: "Idea", color: "#3cc3Df" },
  s4: { label: "Post survey", color: "#FF9A02" },
} satisfies ChartConfig

// custom legend so text is centered and black like the mock
function LegendCenteredBlack() {
  const items = [
    { label: chartConfig.s1.label, color: chartConfig.s1.color },
    { label: chartConfig.s2.label, color: chartConfig.s2.color },
    { label: chartConfig.s3.label, color: chartConfig.s3.color },
    { label: chartConfig.s4.label, color: chartConfig.s4.color },
  ]
  return (
    <div
      style={{
        display: "flex",
        gap: 28,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        color: "#000",
        fontWeight: 400,
        fontSize: 12,
      }}
    >
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 12,
              height: 12,
              background: it.color as string,
              display: "inline-block",
              borderRadius: 3,
            }}
          />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function CompletionTable() {
  return (
    <Card className="rounded-2xl border-0 shadow-none mt-[40px]">
      <CardHeader>
        <CardTitle className="font-normal">Drilldown Completion</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={chartData}
            // tune spacing so 4 bars of 12px fit nicely per month group
            barCategoryGap="35%"
            barGap={10}
            margin={{ top: 10, right: 10, bottom: 50, left: 30 }}
          >
            {/* light grid like the screenshot */}
            <CartesianGrid vertical strokeDasharray="3 3" />

            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />

            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />

            {/* 4 bars per group, each 12px wide */}
            <Bar dataKey="s1" fill="#8979FF" barSize={12} radius={3} />
            <Bar dataKey="s2" fill="#FF928A" barSize={12} radius={3} />
            <Bar dataKey="s3" fill="#3cc3Df" barSize={12} radius={3} />
            <Bar dataKey="s4" fill="#FF9A02" barSize={12}radius={3} />

            {/* centered, black legend below */}
            <Legend content={<LegendCenteredBlack />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
