"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Users, BookOpen, GraduationCap, TrendingUp, AlertCircle } from "lucide-react"

interface DistrictOverview {
  district: string
  summary: {
    totalStudents: number
    totalTeachers: number
    totalCourses: number
    activeCourses: number
    schools: number
    completionRate: number
    engagementRate: number
  }
  schools: Array<{
    name: string
    enrollmentCount: number
    teacherCount: number
    activeCourses: number
  }>
  recentActivity: {
    totalSubmissions: number
    completedSubmissions: number
    lastSyncTime: string | null
  }
}

export default function DistrictAdmin() {
  const [overview, setOverview] = useState<DistrictOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/district/overview')
      const data = await response.json()

      if (data.success) {
        setOverview(data.data)
      } else {
        setError(data.message || 'Failed to fetch overview')
      }
    } catch (err) {
      setError('Failed to fetch overview data')
      console.error('Error fetching overview:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      // Use OAuth-based sync for district admin
      const response = await fetch('/api/admin/sync-with-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ syncType: 'full' })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh overview after successful sync
        await fetchOverview()
      } else {
        setError(data.message || 'Sync failed')
      }
    } catch (err) {
      setError('Sync failed')
      console.error('Error syncing:', err)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading district overview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchOverview}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              District Overview
            </h1>
            <p className="text-muted-foreground">
              {overview.district} - Real-time analytics and insights
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button variant="outline" onClick={fetchOverview}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.summary.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {overview.summary.engagementRate.toFixed(1)}% engagement rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.summary.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">
                Active in {overview.summary.activeCourses} courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.summary.activeCourses}</div>
              <p className="text-xs text-muted-foreground">
                of {overview.summary.totalCourses} total courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.summary.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {overview.recentActivity.completedSubmissions} of {overview.recentActivity.totalSubmissions} submissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Schools Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Schools in District</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.schools.map((school, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{school.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {school.enrollmentCount} students, {school.teacherCount} teachers
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {school.activeCourses} courses
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Submissions</span>
                  <span className="text-sm text-muted-foreground">
                    {overview.recentActivity.totalSubmissions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-sm text-muted-foreground">
                    {overview.recentActivity.completedSubmissions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Sync</span>
                  <span className="text-sm text-muted-foreground">
                    {overview.recentActivity.lastSyncTime 
                      ? new Date(overview.recentActivity.lastSyncTime).toLocaleString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Status */}
        {overview.recentActivity.lastSyncTime && (
          <Card>
            <CardHeader>
              <CardTitle>Data Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">
                  Data last synced: {new Date(overview.recentActivity.lastSyncTime).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}






 
// // import React from "react";

// // /* ---------- little SVG ring ---------- */
// // function RingProgress({
// //   size = 56,
// //   stroke = 6,
// //   percent = 0, // 0–100
// //   text,
// // }: {
// //   size?: number;
// //   stroke?: number;
// //   percent: number;
// //   text: string; // what to show in the center (e.g. "200" or "50%")
// // }) {
// //   const r = (size - stroke) / 2;
// //   const c = 2 * Math.PI * r;
// //   const dash = (percent / 100) * c;

// //   return (
// //     <svg
// //       width={size}
// //       height={size}
// //       className="shrink-0"
// //       viewBox={`0 0 ${size} ${size}`}
// //       aria-hidden="true"
// //     >
// //       {/* track */}
// //       <circle
// //         cx={size / 2}
// //         cy={size / 2}
// //         r={r}
// //         fill="none"
// //         stroke="var(--neutral-300)"
// //         strokeWidth={stroke}
// //         strokeLinecap="round"
// //       />
// //       {/* arc */}
// //       <circle
// //         cx={size / 2}
// //         cy={size / 2}
// //         r={r}
// //         fill="none"
// //         stroke="var(--warning-400)"
// //         strokeWidth={stroke}
// //         strokeLinecap="round"
// //         strokeDasharray={`${dash} ${c - dash}`}
// //         transform={`rotate(-90 ${size / 2} ${size / 2})`}
// //       />
// //       {/* center text */}
// //       <text
// //         x="50%"
// //         y="50%"
// //         dominantBaseline="middle"
// //         textAnchor="middle"
// //         fontSize="14"
// //         fill="var(--neutral-1000)"
// //         style={{ fontWeight: 400 }}
// //       >
// //         {text}
// //       </text>
// //     </svg>
// //   );
// // }

// // /* ---------- one KPI row item ---------- */
// // function KPIItem({
// //   valueText,
// //   label,
// //   percentArc,
// // }: {
// //   valueText: string; // "200" or "50%"
// //   label: string;     // right-side text
// //   percentArc: number; // how much of the ring to color (0–100)
// // }) {
// //   return (
// //     <div className="flex items-center gap-3">
// //       <RingProgress percent={percentArc} text={valueText} />
// //       <div className="text-[14px] leading-5 text-[var(--neutral-1000)]">
// //         {label}
// //       </div>
// //     </div>
// //   );
// // }

// // /* ---------- wrapper with the four stats ---------- */
// // const OverviewKPIs: React.FC = () => {
// //   return (
// //     <div className="flex items-center gap-12">
// //       <KPIItem valueText="200" label="Enrolled Students" percentArc={62} />
// //       <KPIItem valueText="50%" label={"Course Progress\n(Avg)"} percentArc={50} />
// //       <KPIItem valueText="15%" label="Pending" percentArc={15} />
// //       <KPIItem valueText="15%" label={"course\ncompleted"} percentArc={15} />
// //     </div>
// //   );
// // };

// // export default OverviewKPIs;
