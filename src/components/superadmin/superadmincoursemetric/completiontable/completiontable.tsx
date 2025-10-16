"use client"

import { useEffect, useState } from "react"
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
import { useSuperAdminCourse } from "@/components/superadmin/context/SuperAdminCourseContext"

// labels + color tokens (uses your CSS variables)
const chartConfig = {
  s1: { label: "Pre survey", color: "#8979FF" },
  s2: { label: "Course progress", color: "#FF928A" },
  s3: { label: "Idea", color: "#3cc3Df" },
  s4: { label: "Post survey", color: "#FF9A02" },
} satisfies ChartConfig

type DistrictData = {
  district: string;
  preSurvey: number;
  course: number;
  idea: number;
  postSurvey: number;
  totalStudents: number;
};

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
  const { selectedCourse } = useSuperAdminCourse();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCourse?.id) {
        setChartData([]);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/superadmin/course-metrics?courseId=${selectedCourse.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success && data.metrics.districtBreakdown) {
          // Transform district breakdown to chart format
          const transformed = data.metrics.districtBreakdown.map((d: DistrictData) => ({
            month: d.district,
            s1: d.preSurvey,
            s2: d.course,
            s3: d.idea,
            s4: d.postSurvey
          }));
          setChartData(transformed);
        }
      } catch (error) {
        console.error('Error fetching district breakdown:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCourse]);

  return (
    <Card className="rounded-2xl border-0 shadow-none mt-[40px]">
      <CardHeader>
        <CardTitle className="font-normal">Drilldown Completion by District</CardTitle>
        <CardDescription>
          {loading ? "Loading..." : chartData.length === 0 ? "No data available" : "Completion percentages by district"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
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
                axisLine={{ stroke: "#00001A4D", strokeWidth: 2 }}
                tickLine={false}
                tickMargin={8}
              />

              <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />

              {/* 4 bars per group, each 12px wide */}
              <Bar dataKey="s1" fill="#8979FF" barSize={12} radius={3} />
              <Bar dataKey="s2" fill="#FF928A" barSize={12} radius={3} />
              <Bar dataKey="s3" fill="#3cc3Df" barSize={12} radius={3} />
              <Bar dataKey="s4" fill="#FF9A02" barSize={12} radius={3} />

              {/* centered, black legend below */}
              <Legend content={<LegendCenteredBlack />} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {loading ? "Loading chart data..." : "Select a course to view district breakdown"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
