import OverviewKPIs, { ProgressCircle } from "./modules/overview/overview";
import { DashboardHeader } from "./navbar/header";
import RingProgress from "./progress/progress";

export default function DistrictAdmin() {
    return (
        <>
       <div className="space-y-6">
      <h1 className="text-[28px] font-semibold text-neutral-900">School Overview</h1>
      
    </div>
    <RingProgress />
    
    <OverviewKPIs />
        {/* <ProgressCircle /> */}
        </>
    );
}






 
// import React from "react";

// /* ---------- little SVG ring ---------- */
// function RingProgress({
//   size = 56,
//   stroke = 6,
//   percent = 0, // 0–100
//   text,
// }: {
//   size?: number;
//   stroke?: number;
//   percent: number;
//   text: string; // what to show in the center (e.g. "200" or "50%")
// }) {
//   const r = (size - stroke) / 2;
//   const c = 2 * Math.PI * r;
//   const dash = (percent / 100) * c;

//   return (
//     <svg
//       width={size}
//       height={size}
//       className="shrink-0"
//       viewBox={`0 0 ${size} ${size}`}
//       aria-hidden="true"
//     >
//       {/* track */}
//       <circle
//         cx={size / 2}
//         cy={size / 2}
//         r={r}
//         fill="none"
//         stroke="var(--neutral-300)"
//         strokeWidth={stroke}
//         strokeLinecap="round"
//       />
//       {/* arc */}
//       <circle
//         cx={size / 2}
//         cy={size / 2}
//         r={r}
//         fill="none"
//         stroke="var(--warning-400)"
//         strokeWidth={stroke}
//         strokeLinecap="round"
//         strokeDasharray={`${dash} ${c - dash}`}
//         transform={`rotate(-90 ${size / 2} ${size / 2})`}
//       />
//       {/* center text */}
//       <text
//         x="50%"
//         y="50%"
//         dominantBaseline="middle"
//         textAnchor="middle"
//         fontSize="14"
//         fill="var(--neutral-1000)"
//         style={{ fontWeight: 400 }}
//       >
//         {text}
//       </text>
//     </svg>
//   );
// }

// /* ---------- one KPI row item ---------- */
// function KPIItem({
//   valueText,
//   label,
//   percentArc,
// }: {
//   valueText: string; // "200" or "50%"
//   label: string;     // right-side text
//   percentArc: number; // how much of the ring to color (0–100)
// }) {
//   return (
//     <div className="flex items-center gap-3">
//       <RingProgress percent={percentArc} text={valueText} />
//       <div className="text-[14px] leading-5 text-[var(--neutral-1000)]">
//         {label}
//       </div>
//     </div>
//   );
// }

// /* ---------- wrapper with the four stats ---------- */
// const OverviewKPIs: React.FC = () => {
//   return (
//     <div className="flex items-center gap-12">
//       <KPIItem valueText="200" label="Enrolled Students" percentArc={62} />
//       <KPIItem valueText="50%" label={"Course Progress\n(Avg)"} percentArc={50} />
//       <KPIItem valueText="15%" label="Pending" percentArc={15} />
//       <KPIItem valueText="15%" label={"course\ncompleted"} percentArc={15} />
//     </div>
//   );
// };

// export default OverviewKPIs;
