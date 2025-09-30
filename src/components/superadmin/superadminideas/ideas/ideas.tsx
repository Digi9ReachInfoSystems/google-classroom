"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  school: string
  district: string
  status: string
  onSchoolChange: (v: string) => void
  onDistrictChange: (v: string) => void
  onStatusChange: (v: string) => void
  totalStudents: number
  totalIdeas: number
}

// --- circular progress ring (SVG) ---
function ProgressRing({
  size = 56,
  stroke = 6,
  value = 0, // 0..1
  label = "",
}: { size?: number; stroke?: number; value?: number; label?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(1, value)) * c
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--neutral-300)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--primary)" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[14px] font-medium">{label}</span>
      </div>
    </div>
  )
}

function StatCard({ valueText, caption, progress }: { valueText: string; caption: string; progress: number }) {
  return (
    <Card className="rounded-2xl border-0 shadow-none bg-white h-[112px] m-[20px]">
      <CardContent className="px-6 h-[112px] flex items-center">
        <div className="flex items-center gap-4">
          <ProgressRing size={56} stroke={6} value={progress} label={valueText} />
          <div className="text-[14px] text-foreground">{caption}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Superadminideas({
  school, district, status,
  onSchoolChange, onDistrictChange, onStatusChange,
  totalStudents, totalIdeas,
}: Props) {
  // map counts to ring progress (cap at 100%)
  const studentProgress = Math.min(1, totalStudents / 150) // target 150 demo
  const ideasProgress   = Math.min(1, totalIdeas / 50)    // target 50 demo

  const pillBase =
    "h-9 px-5 rounded-full border text-[12px] font-normal bg-transparent data-[state=open]:ring-2 data-[state=open]:ring-[var(--warning-400)]"
  const pillWhenSelected =
    "ring-2 ring-[var(--warning-400)] border-[var(--neutral-300)]"
  const itemHover =
    "data-[highlighted]:bg-[var(--warning-400)] data-[highlighted]:text-white focus:bg-[var(--warning-400)] focus:text-white"

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-6 px-5">
        {/* Left: Title + two cards */}
        <div className="flex-1">
          <h2 className="text-[32px] font-normal leading-tight mb-2">Ideas</h2>
          <h3 className="text-[14px] font-normal text-foreground mb-4">
            Let’s see the current statistics performance
          </h3>

          <div className="flex flex-wrap gap-6">
            <div className="w-[360px]">
              <StatCard valueText={String(totalStudents)} caption="Total no of students" progress={studentProgress} />
            </div>
            <div className="w-[360px]">
              <StatCard valueText={String(totalIdeas)} caption="Total no of idea submitted" progress={ideasProgress} />
            </div>
          </div>
        </div>

        {/* Right: 3 pill selects */}
        <div className="flex items-center gap-4">
          <Select value={school} onValueChange={onSchoolChange}>
            <SelectTrigger className={`${pillBase} ${school ? pillWhenSelected : "border-[var(--neutral-300)]"}`}>
              <SelectValue placeholder="Select School" />
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden">
              <SelectItem value="School A" className={itemHover}>School A</SelectItem>
              <SelectItem value="School B" className={itemHover}>School B</SelectItem>
              <SelectItem value="School C" className={itemHover}>School C</SelectItem>
            </SelectContent>
          </Select>

          <Select value={district} onValueChange={onDistrictChange}>
            <SelectTrigger className={`${pillBase} ${district ? pillWhenSelected : "border-[var(--neutral-300)]"}`}>
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden">
              <SelectItem value="District 1" className={itemHover}>District 1</SelectItem>
              <SelectItem value="District 2" className={itemHover}>District 2</SelectItem>
              <SelectItem value="District 3" className={itemHover}>District 3</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className={`${pillBase} ${status ? pillWhenSelected : "border-[var(--neutral-300)]"}`}>
              <SelectValue placeholder="Select Idea status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden">
              <SelectItem value="Approved" className={itemHover}>Approved</SelectItem>
              <SelectItem value="Pending"  className={itemHover}>Pending</SelectItem>
              <SelectItem value="Rejected" className={itemHover}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
