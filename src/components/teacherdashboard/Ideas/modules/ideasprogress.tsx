import type React from "react"
import TeacherRingIdeas from "./ringprogesscards/circleproges"

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
      <TeacherRingIdeas percent={percentArc} text={valueText} size={72} />
      <div className="text-[14px] leading-5 text-[var(--neutral-1000)] whitespace-nowrap">{label}</div>
    </div>
  )
}

export default function TeacherCircleProgressRow({ 
  totalStudents = 0, 
  totalIdeasSubmitted = 0,
  submittedPercentage = 0
}: { 
  totalStudents?: number
  totalIdeasSubmitted?: number
  submittedPercentage?: number
}) {
  return (
    <div className="flex gap-6 mb-8">
      <KPICard 
        valueText={totalStudents.toString()} 
        label="Total no of students" 
        percentArc={100} 
      />
      <KPICard 
        valueText={totalIdeasSubmitted.toString()} 
        label="Total no of idea submitted" 
        percentArc={submittedPercentage} 
      />
    </div>
  )
}
