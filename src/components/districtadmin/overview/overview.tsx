import React from "react";
import RingProgress from "../progress/progress";

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
        h-[112px] w-[203px]
        px-5 py-4
        flex items-center gap-4
      "
    >
      {/* ring at 72x72 */}
      <RingProgress percent={percentArc} text={valueText} size={72} />
      <div className="text-[14px] leading-5 text-[var(--neutral-1000)]">
        {label}
      </div>
    </div>
  );
}

const KPIRow: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <KPICard valueText="200" label="Enrolled Students" percentArc={62} />
      <KPICard
        valueText="50%"
        label={
          <span>
            Course Progress
            <br />(Avg)
          </span>
        }
        percentArc={50}
      />
      <KPICard valueText="15%" label="Pending" percentArc={15} />
      <KPICard
        valueText="15%"
        label={
          <span>
            course
            <br />completed
          </span>
        }
        percentArc={15}
      />
    </div>
  );
};

export default KPIRow;
