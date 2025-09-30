"use client";
import Image from "next/image";
import React, { useMemo, useState } from "react";

/* ✓ / ? using your assets */
function StatusIcon({ type }: { type: "ok" | "warn" }) {
  const src = type === "ok" ? "/checkcircle.png" : "/questioncircle.png";
  return (
    <Image
      src={src}
      alt=""
      width={24}
      height={24}
      className="h-6 w-6 inline-block"
      draggable={false}
    />
  );
}

/* Orange progress with centered knob; red dot at extreme start */
function LessonProgress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const TRACK_H = 8;
  const KNOB = 14;
  const EXTREME = 6; // <= show red dot
  const isStart = v <= EXTREME;

  return (
    <div className="relative w-full max-w-[11rem] min-w-[8rem]" style={{ height: KNOB }}>
      {/* gray track (centered vertically) */}
      <div
        className="absolute left-0 right-0 rounded-full bg-[var(--neutral-300)]"
        style={{ height: TRACK_H, top: "50%", transform: "translateY(-50%)" }}
      />
      {/* filled orange */}
      {!isStart && (
        <div
          className="absolute left-0 rounded-full bg-[var(--primary)]"
          style={{ height: TRACK_H, width: `${v}%`, top: "50%", transform: "translateY(-50%)" }}
        />
      )}
      {/* knob / red start dot */}
      {isStart ? (
        <span
          className="absolute rounded-full bg-[var(--error-400)]"
          style={{ width: 12, height: 12, left: 4, top: "50%", transform: "translateY(-50%)" }}
          aria-hidden
        />
      ) : (
        <span
          className="absolute rounded-full bg-white border border-[var(--neutral-300)] shadow-sm"
          style={{ width: KNOB, height: KNOB, left: `${v}%`, top: "50%", transform: "translate(-50%, -50%)" }}
          aria-hidden
        />
      )}
    </div>
  );
}

type Row = {
  name: string;
  pre: "ok" | "warn";
  lesson: number;
  idea: "ok" | "warn";
  post: "ok" | "warn";
  cert: "ok" | "warn";
};

const DATA: Row[] = [
  { name: "Sam",  pre: "ok",   lesson: 64, idea: "warn", post: "ok",   cert: "warn" },
  { name: "Jack", pre: "warn", lesson: 52, idea: "ok",   post: "warn", cert: "warn" },
  { name: "Tina", pre: "warn", lesson: 6,  idea: "ok",   post: "ok",   cert: "warn" },
  { name: "Lee",  pre: "warn", lesson: 18, idea: "ok",   post: "ok",   cert: "warn" },
  { name: "Ssam",  pre: "ok",   lesson: 64, idea: "warn", post: "ok",   cert: "warn" },
  { name: "Jasck", pre: "warn", lesson: 52, idea: "ok",   post: "warn", cert: "warn" },
  { name: "Tisna", pre: "warn", lesson: 6,  idea: "ok",   post: "ok",   cert: "warn" },
  { name: "Lsee",  pre: "warn", lesson: 18, idea: "ok",   post: "ok",   cert: "warn" },
];

export default function StudentsTable() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? DATA.filter(r => r.name.toLowerCase().includes(term)) : DATA;
  }, [q]);

  const headers = [
    "Student Name",
    "Pre survey",
    "Lesson progress",
    "Idea submission",
    "Post survey",
    "Course certificate",
  ];

  return (
    <div className="bg-white">
      {/* search pill */}
      <div className="px-5 pt-4 pb-4 flex justify-end">
        <label className="flex items-center gap-2 rounded-full border border-[var(--neutral-300)] bg-[var(--neutral-100)] pl-3 pr-4 h-9 w-[300px] shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-[var(--neutral-700)]">
            <path
              d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-transparent outline-none flex-1 text-sm text-[var(--neutral-900)] placeholder-[var(--neutral-600)]"
            placeholder="Search..."
          />
        </label>
      </div>

      {/* HEADER with rounded corners */}
      <div className="rounded-t-2xl overflow-hidden">
        <table className="w-full table-fixed border-0 [&_*]:!border-0">
          <thead className="bg-[var(--success-1000)]">
            <tr className="text-[12px] text-white">
              {headers.map(h => (
                <th
                  key={h}
                  className="px-5 py-3 text-left font-normal border-r border-[var(--neutral-200)] last:border-r-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* BODY: rectangular (no rounded corners) */}
      <div className="max-h-[224px] overflow-y-auto custom-scrollbar">
        <table className="w-full table-fixed border-0 [&_*]:!border-0">
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="text-[12px] bg-white">
                <td className="px-5 py-4 font-light text-[var(--neutral-1000)] border-r border-[var(--neutral-200)] last:border-r-0">
                  {r.name}
                </td>
                <td className="px-5 py-4 border-r border-[var(--neutral-200)] last:border-r-0">
                  <StatusIcon type={r.pre} />
                </td>
                <td className="px-5 py-4 border-r border-[var(--neutral-200)] last:border-r-0">
                  <LessonProgress value={r.lesson} />
                </td>
                <td className="px-5 py-4 border-r border-[var(--neutral-200)] last:border-r-0">
                  <StatusIcon type={r.idea} />
                </td>
                <td className="px-5 py-4 border-r border-[var(--neutral-200)] last:border-r-0">
                  <StatusIcon type={r.post} />
                </td>
                <td className="px-5 py-4 last:border-r-0">
                  <StatusIcon type={r.cert} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-5 py-8 text-center text-[var(--neutral-700)]"
                >
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}