"use client"

import * as React from "react"
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

// --- circular progress ring (SVG) - using teacher's approach ---
function RingIdeas({
  size = 56,
  stroke = 6,
  percent = 0,
  text,
  color = "var(--primary)",
}: {
  size?: number
  stroke?: number
  percent: number // 0–100
  text: string
  color?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (percent / 100) * c

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--neutral-300)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="14"
        fill="var(--neutral-1000)"
        style={{ fontWeight: 400 }}
      >
        {text}
      </text>
    </svg>
  )
}

function KPICard({
  valueText,
  label,
  percentArc,
}: {
  valueText: string
  label: React.ReactNode
  percentArc: number
}) {
  return (
    <div
      className="
        bg-white border-0 shadow-none rounded-none
        h-[112px] w-[280px]
        px-5 py-4
        flex items-center gap-4
      "
    >
      <RingIdeas percent={percentArc} text={valueText} size={72} />
      <div className="text-[14px] leading-5 text-[var(--neutral-1000)] whitespace-nowrap">{label}</div>
    </div>
  )
}

export default function Superadminideas({
  school, district, status,
  onSchoolChange, onDistrictChange, onStatusChange,
  totalStudents, totalIdeas,
}: Props) {
  const studentProgress = Math.min(100, (totalStudents / 150) * 100)
  const ideasProgress   = Math.min(100, (totalIdeas / 50) * 100)

  const pillBase =
    "h-9 px-5 rounded-full border text-[12px] font-normal bg-transparent data-[state=open]:ring-2 data-[state=open]:ring-[var(--primary)]"
  const pillWhenSelected =
    "ring-2 ring-[var(--primary)] border-[var(--neutral-300)]"
  const itemHover =
    "data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white"

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-6 px-5">
        {/* Left: Title + two cards */}
        <div className="flex-1">
          <h2 className="text-3xl font-semibold">Ideas</h2>
          <h3 className="text-[14px] font-normal text-foreground mb-4">
            Let's see the current statistics performance
          </h3>

          <div className="flex gap-6 mb-8">
            <KPICard valueText={String(totalStudents)} label="Total no of students" percentArc={studentProgress} />
            <KPICard valueText={String(totalIdeas)} label="Total no of idea submitted" percentArc={ideasProgress} />
          </div>
        </div>

        {/* Right: 3 pill selects */}
        <div className="flex items-center gap-4">
          <Select value={school} onValueChange={onSchoolChange}>
            <SelectTrigger className={`${pillBase} ${school ? pillWhenSelected : "border-[var(--neutral-300)]"}`}>
              <SelectValue placeholder="Select School" />
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden text-center">
              <SelectItem value="School A" className={`${itemHover} justify-center text-center`}>School A</SelectItem>
              <SelectItem value="School B" className={`${itemHover} justify-center text-center`}>School B</SelectItem>
              <SelectItem value="School C" className={`${itemHover} justify-center text-center`}>School C</SelectItem>
            </SelectContent>
          </Select>

          <Select value={district} onValueChange={onDistrictChange}>
            <SelectTrigger className={`${pillBase} ${district ? pillWhenSelected : "border-[var(--neutral-300)]"}`}>
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden text-center">
              <SelectItem value="District 1" className={`${itemHover} justify-center text-center`}>District 1</SelectItem>
              <SelectItem value="District 2" className={`${itemHover} justify-center text-center`}>District 2</SelectItem>
              <SelectItem value="District 3" className={`${itemHover} justify-center text-center`}>District 3</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className={`${pillBase} ${status ? pillWhenSelected : "border-[var(--neutral-300)]"}`}>
              <SelectValue placeholder="Select Idea status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden text-center">
              <SelectItem value="Approved" className={`${itemHover} justify-center text-center`}>Approved</SelectItem>
              <SelectItem value="Pending"  className={`${itemHover} justify-center text-center`}>Pending</SelectItem>
              <SelectItem value="Rejected" className={`${itemHover} justify-center text-center`}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
