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
  schools: string[]
  districts: string[]
  onSchoolChange: (v: string) => void
  onDistrictChange: (v: string) => void
  totalStudents: number
  totalIdeas: number
  submittedPercentage: number
  loading: boolean
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
  school, district, schools, districts,
  onSchoolChange, onDistrictChange,
  totalStudents, totalIdeas, submittedPercentage, loading
}: Props) {
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
          <h2 className="text-3xl font-semibold mb-4">Ideas</h2>

          <div className="flex gap-6 mb-8">
            <KPICard 
              valueText={loading ? "..." : String(totalStudents)} 
              label="Total no of students" 
              percentArc={100} 
            />
            <KPICard 
              valueText={loading ? "..." : String(totalIdeas)} 
              label="Total no of idea submitted" 
              percentArc={submittedPercentage} 
            />
          </div>
        </div>

        {/* Right: 2 pill selects */}
        <div className="flex items-center gap-4">
          <Select value={district} onValueChange={onDistrictChange}>
            <SelectTrigger className={`${pillBase} ${district && district !== 'All' ? pillWhenSelected : "border-[var(--neutral-300)]"}`}>
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden text-center">
              {districts.map((d) => (
                <SelectItem key={d} value={d} className={`${itemHover} justify-center text-center`}>
                  {d === 'All' ? 'All Districts' : d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={school} onValueChange={onSchoolChange}>
            <SelectTrigger className={`${pillBase} ${school && school !== 'All' ? pillWhenSelected : "border-[var(--neutral-300)]"}`}>
              <SelectValue placeholder="Select School" />
            </SelectTrigger>
            <SelectContent className="rounded-xl overflow-hidden text-center">
              {schools.map((s) => (
                <SelectItem key={s} value={s} className={`${itemHover} justify-center text-center`}>
                  {s === 'All' ? 'All Schools' : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
