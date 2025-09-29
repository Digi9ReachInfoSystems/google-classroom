// components/ideas/IdeasKPI.tsx
"use client";
import React, {useEffect, useRef, useState} from "react";

/* ---------- 72px ring ---------- */
function RingProgress({
  size = 72,               // <- 72px
  stroke = 6,
  percent = 0,
  text,
}: {
  size?: number;
  stroke?: number;
  percent: number;
  text: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--neutral-300)" strokeWidth={stroke} strokeLinecap="round" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--warning-400)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${c-dash}`} transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14"
            fill="var(--neutral-1000)" style={{fontWeight: 400}}>
        {text}
      </text>
    </svg>
  );
}

/* ---------- KPI card (112 x 320) ---------- */
function KPI({ valueText, label, percentArc }: { valueText: string; label: string; percentArc: number }) {
  return (
    <div className="h-[112px] w-[320px] rounded-xl bg-white shadow-sm px-5">
      <div className="h-full w-full flex items-center gap-4">
        <RingProgress percent={percentArc} text={valueText} />
        <p className="text-[12px] leading-5 text-[var(--neutral-1000)]">{label}</p>
      </div>
    </div>
  );
}

/* ---------- custom pill dropdown (options hover = --warning-400) ---------- */
function CustomSelect({
  label,
  options,
  width = 150, // tweak if you want a different width
}: {
  label: string;
  options: string[];
  width?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref} style={{ width }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="
          h-9 w-full px-3 rounded-full border border-[var(--neutral-300)] bg-white
          text-[12px] text-[var(--neutral-900)] transition
          hover:bg-[var(--warning-400)] hover:text-white
          focus:outline-none focus:ring-2 focus:ring-[var(--warning-400)]
          flex items-center justify-center text-center
          bg-[right_0.6rem_center] bg-no-repeat
        "
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7l5 5 5-5' stroke='%23606060' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          paddingRight: "1.75rem", // room for chevron
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value ?? label}
      </button>

      {open && (
        <ul
          role="listbox"
          className="
            absolute right-0 z-10 mt-2 rounded-xl bg-white
            border border-[var(--neutral-300)] shadow-sm overflow-hidden
            text-center
          "
          style={{ width }}
        >
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              onClick={() => {
                setValue(opt);
                setOpen(false);
              }}
              className="
                cursor-pointer px-3 py-2 text-[12px] text-[var(--neutral-900)]
                hover:bg-[var(--warning-400)] hover:text-white
              "
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


/* ---------- page section ---------- */
const IdeasKPI: React.FC = () => {
  return (
    <section className="w-full space-y-5 px-5">
      {/* Row 1: Title + dropdowns */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[32px] font-medium text-[var(--neutral-1000)]">Ideas</h2>

        <div className="flex items-center gap-3">
          <CustomSelect label="Select School"  options={["All", "School A", "School B"]} />
          <CustomSelect label="Select District" options={["All", "District 1", "District 2"]} />
          <CustomSelect label="Select Idea status" options={["All", "Submitted", "Accepted"]} />
        </div>
      </div>

      {/* Row 2: KPI area 70% on lg+ */}
      <div className="flex gap-6">
        <div className="w-full ">
          <div className="flex flex-wrap gap-6">
            <KPI valueText="105" percentArc={78} label="Total no of students" />
            <KPI valueText="6"   percentArc={22} label="Total no of idea submitted" />
            <KPI valueText="6"   percentArc={22} label="Total no of ideas accepted" />
          </div>
        </div>
        <div className="hidden lg:block flex-1" />
      </div>
    </section>
  );
};

export default IdeasKPI;
