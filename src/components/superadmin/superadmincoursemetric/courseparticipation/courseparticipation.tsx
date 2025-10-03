"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type MetricCardProps = {
  iconSrc: string
  iconAlt: string
  label: string
  value: string
}

function MetricCard({ iconSrc, iconAlt, label, value }: MetricCardProps) {
  return (
    <Card className="rounded-2xl border-0 shadow-none">
      <CardContent className="p-6 h-[140px] flex items-center justify-center">
        <div className="flex items-center gap-3">
          {/* Icon in orange circle */}
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]">
            <Image
              src={iconSrc}
              alt={iconAlt}
              width={28}
              height={28}
              className="h-7 w-7"
              priority
            />
          </span>

          {/* Label + Value stacked vertically */}
          <div className="flex flex-col justify-center">
            <span className="text-[16px] leading-4">{label}</span>
            <span className="text-[20px] font-semibold leading-5 mt-2">{value}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



export default function CoursePartition() {
  return (
    <div className="space-y-6">
      {/* Header with title + dropdown */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold">Course Participation</h2>
          <p className="text-[14px] text-muted-foreground">
            Overview of student progress and survey status
          </p>
        </div>

        {/* Period dropdown */}
        <Select defaultValue="thisMonth">
          <SelectTrigger className="w-[180px] rounded-xl border border-[var(--neutral-300)]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="rounded-xl overflow-hidden">
            <SelectItem
              value="thisMonth"
              className="data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white"
            >
              This Month
            </SelectItem>
            <SelectItem
              value="lastMonth"
              className="data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white"
            >
              Last Month
            </SelectItem>
            <SelectItem
              value="thisYear"
              className="data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white"
            >
              This Year
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Four metric cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-[140px]">
        <MetricCard
          iconSrc="/metrics/teachers.png"   // or /students.png as per your asset
          iconAlt="Course icon"
          label="Course"
          value="45,000"
        />
        <MetricCard
        iconSrc="/metrics/teachers.png" 
          iconAlt="Pre-Survey icon"
          label="Pre-Survey"
          value="38,500"
        />
        <MetricCard
          iconSrc="/metrics/teachers.png" 
          iconAlt="Post-Survey icon"
          label="Post-Survey"
          value="85%"
        />
        <MetricCard
       iconSrc="/metrics/teachers.png" 
          iconAlt="Idea icon"
          label="Idea"
          value="6,500"
        />
      </div>
    </div>
  )
}
