// components/ideas/IdeasTable.tsx
"use client";

import React, { useMemo, useState } from "react";

type Row = {
  student: string;
  title: string;
  category: string;
  date: string;
  status: string;
  fileHref?: string;
};

const DATA: Row[] = [
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "STEM", date: "Sep 10, 2025", status: "—", fileHref: "#" },
  { student: "Rahul P", title: "Digital Art Showcase", category: "Arts", date: "Sep 1, 2025", status: "—", fileHref: "#" },
  { student: "Sneha M", title: "—", category: "—", date: "—", status: "—" },
  { student: "Arjun T", title: "—", category: "—", date: "—", status: "—" },
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "Arts", date: "Sep 10, 2025", status: "—", fileHref: "#" },
  { student: "Alice Smith", title: "—", category: "—", date: "—", status: "—" },
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "Arts", date: "Sep 10, 2025", status: "—", fileHref: "#" },
  { student: "Alice Smith", title: "—", category: "—", date: "—", status: "—" },
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "STEM", date: "Sep 10, 2025", status: "—", fileHref: "#" },
  { student: "Rahul P", title: "Digital Art Showcase", category: "Arts", date: "Sep 1, 2025", status: "—", fileHref: "#" },
  { student: "Sneha M", title: "—", category: "—", date: "—", status: "—" },
  { student: "Arjun T", title: "—", category: "—", date: "—", status: "—" },
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "Arts", date: "Sep 10, 2025", status: "—", fileHref: "#" },
  { student: "Alice Smith", title: "—", category: "—", date: "—", status: "—" },
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "Arts", date: "Sep 10, 2025", status: "—", fileHref: "#" },
  { student: "Alice Smith", title: "—", category: "—", date: "—", status: "—" },
];

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

      {/* Table with sticky header + rounded corners everywhere */}
      <div className="mt-4">
        {/* Make the container rounded and clip children so the sticky header follows the curve */}
        <div className="max-h-[560px] overflow-y-auto scroll-thin  bg-white">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 z-[1]">
              <tr
                className="text-[12px] text-[var(--neutral-900)]"
                style={{ backgroundColor: "var(--success-100)" }}
              >
                {/* round the header’s top corners */}
                <th className="px-5 py-4 text-left font-normal first:rounded-tl-xl">Student Name</th>
                <th className="px-5 py-4 text-left font-normal">Idea Title</th>
                <th className="px-5 py-4 text-left font-normal">Category</th>
                <th className="px-5 py-4 text-left font-normal">Date Submitted</th>
                <th className="px-5 py-4 text-left font-normal">Status</th>
                <th className="px-5 py-4 text-left font-normal last:rounded-tr-xl">File</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.student}-${idx}`} className="text-[12px] bg-white">
                  <td className="px-5 py-4 border-t border-[var(--neutral-200)] text-[var(--neutral-1000)]">
                    {r.student}
                  </td>
                  <td className="px-5 py-4 border-t border-[var(--neutral-200)]">{r.title}</td>
                  <td className="px-5 py-4 border-t border-[var(--neutral-200)]">{r.category}</td>
                  <td className="px-5 py-4 border-t border-[var(--neutral-200)]">{r.date}</td>
                  <td className="px-5 py-4 border-t border-[var(--neutral-200)]">{r.status}</td>
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
                    colSpan={6}
                    className="px-5 py-8 text-center text-[var(--neutral-700)] border-t border-[var(--neutral-200)]"
                  >
                    No ideas found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
