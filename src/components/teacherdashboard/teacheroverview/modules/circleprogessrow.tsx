import React from "react";
import TeacherRingProgress from "./ringprogesscards/circleproges";

function KPICard({
  valueText,
  label,
  percentArc,
}: {
  valueText: string;
  label: React.ReactNode;
  percentArc: number;
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
      <TeacherRingProgress percent={percentArc} text={valueText} size={72} color="var(--primary)" />
      <div className="text-[14px] leading-5 text-[var(--neutral-1000)] whitespace-nowrap">{label}</div>
    </div>
  );
}

export default function CircleProgressRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <KPICard valueText="200" label="Enrolled Students" percentArc={62} />
      <KPICard
        valueText="50%"
        label={"Course Progress (Avg)"}
        percentArc={50}
      />
      <KPICard valueText="15%" label="Pending" percentArc={15} />
    </div>
  );
}


