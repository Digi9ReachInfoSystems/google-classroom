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

export default function TeacherCircleProgressRow() {
  return (
    <div className="flex gap-6 mb-8">
      <KPICard valueText="105" label="Total no of students" percentArc={78} />
      <KPICard valueText="6" label={"Total no of idea submitted"} percentArc={22} />
    </div>
  )
}
