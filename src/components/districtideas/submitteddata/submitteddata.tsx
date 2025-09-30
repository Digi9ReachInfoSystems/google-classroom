"use client";

import React, { useMemo, useState } from "react";

type Row = {
  student: string;
  title: string;
  category: string;
  date: string;
  status: "Completed" | "Pending";
  fileHref?: string;
};

const DATA: Row[] = [
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "STEM",  date: "Sep 10, 2025", status: "Completed", fileHref: "#" },
  { student: "Rahul P",     title: "Digital Art Showcase", category: "Arts", date: "Sep 1, 2025",  status: "Pending",   fileHref: "#" },
  { student: "Sneha M",     title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Arjun T",     title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "Arts", date: "Sep 10, 2025", status: "Completed", fileHref: "#" },
  { student: "Alice Smith", title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "Arts", date: "Sep 10, 2025", status: "Pending",   fileHref: "#" },
  { student: "Alice Smith", title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "STEM", date: "Sep 10, 2025", status: "Completed", fileHref: "#" },
  { student: "Rahul P",     title: "Digital Art Showcase", category: "Arts", date: "Sep 1, 2025",  status: "Pending",   fileHref: "#" },
  { student: "Sneha M",     title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Arjun T",     title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "Arts", date: "Sep 10, 2025", status: "Completed", fileHref: "#" },
  { student: "Alice Smith", title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "Arts", date: "Sep 10, 2025", status: "Pending",   fileHref: "#" },
  { student: "Alice Smith", title: "—",                    category: "—",    date: "—",           status: "Pending" },
];

// Badge component (exact colors per your request)
// Badge component with fixed width
function StatusBadge({ status }: { status: Row["status"] }) {
  const base =
    "inline-block rounded-[16px] px-3 py-2 text-[12px] leading-[14px] text-center min-w-[80px]";
  if (status === "Completed") {
    return (
      <span
        className={base}
        style={{ background: "var(--success-500)", color: "#FFFFFF" }}
      >
        Completed
      </span>
    );
  }
  return (
    <span
      className={base}
      style={{ background: "var(--neutral-500)", color: "#FFFFFF" }}
    >
      Pending
    </span>
  );
}

export default function Submitteddata() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return DATA;
    return DATA.filter(
      (r) =>
        r.student.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term)
    );
  }, [q]);

  const headers = [
    "Student Name",
    "Idea Title",
    "Category",
    "Date Submitted",
    "Status",
    "File"
  ];

  return (
    <section className="bg-white overflow-hidden mt-[20px] px-5 py-5">
      {/* Row 1: label + search */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-medium text-[var(--neutral-1000)]">
          My submitted data
        </h3>

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
      <div className="mt-4 rounded-t-xl overflow-hidden">
        <table className="w-full table-fixed border-0 [&_*]:!border-0">
          <thead>
            <tr
              className="text-[14px] text-[var(--neutral-900)]"
              style={{ backgroundColor: "var(--success-100)" }}
            >
              {headers.map((header, index) => (
                <th
                  key={header}
                  className={`px-5 py-4 text-left font-normal ${
                    index === 0 ? "first:rounded-tl-xl" : 
                    index === headers.length - 1 ? "last:rounded-tr-xl" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* BODY: rectangular (no rounded corners) with scroll */}
      <div className="max-h-[560px] overflow-y-auto custom-scrollbar">
        <table className="w-full table-fixed border-0 [&_*]:!border-0">
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.student}-${idx}`} className="text-[12px] bg-white">
                <td className="px-5 py-4 border-t border-[var(--neutral-200)] text-[var(--neutral-1000)]">
                  {r.student}
                </td>
                <td className="px-5 py-4 border-t border-[var(--neutral-200)]">{r.title}</td>
                <td className="px-5 py-4 border-t border-[var(--neutral-200)]">{r.category}</td>
                <td className="px-5 py-4 border-t border-[var(--neutral-200)]">{r.date}</td>
                <td className="px-5 py-4 border-t border-[var(--neutral-200)]">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-5 py-4 border-t border-[var(--neutral-200)]">
                  {r.fileHref ? (
                    <a href={r.fileHref} className="text-[12px] text-blue-600 hover:underline">
                      Explore idea
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-5 py-8 text-center text-[var(--neutral-700)] border-t border-[var(--neutral-200)]"
                >
                  No ideas found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}