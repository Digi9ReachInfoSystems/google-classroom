"use client";

import React from "react";
import { Download } from "lucide-react";
import Pagination from "@/components/ui/pagination";

/* ---------- types & fake data ---------- */
type Row = {
  no: number;
  district: string;
  school: string;
  file: string;
  focal: string[]; // chips
  course: string;
  range: string;
};

const ALL_ROWS: Row[] = Array.from({ length: 87 }).map((_, i) => ({
  no: i + 1,
  district: ["Gasa", "Punakha", "Haa"][i % 3],
  school: "School Name",
  file: [
    "Report Name",
    "Report Name", 
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name"
  ][i % 10],
  focal:
    i % 4 === 1
      ? ["Age"]
      : i % 4 === 2
      ? ["Gender", "Disability", "Grade"]
      : i % 4 === 3
      ? ["Gender", "Grade"]
      : ["Age", "Gender", "Disability", "Grade"],
  course: ["Biology", "Maths", "Physics"][i % 3],
  range: "10 Jun – 12 Sep",
}));

/* ---------- small chip ---------- */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--primary)] text-white text-[11px] px-2.5 py-[5px] leading-none">
      {children}
    </span>
  );
}


/* ---------- main ---------- */
export default function Reporttable() {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalItems = ALL_ROWS.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const start = (currentPage - 1) * itemsPerPage;
  const rows = ALL_ROWS.slice(start, start + itemsPerPage);

  return (
    <section className="w-full px-4 md:px-5 py-5 mt-5">
      <div className="bg-white rounded-lg border-neutral-200">
        {/* fixed header like teacher table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed rounded-t-lg overflow-hidden border-collapse border-b border-neutral-200">
            <colgroup>
              <col className="w-[56px]" />
              <col className="w-[120px]" />
              <col className="w-[200px]" />
              <col className="w-[180px]" />
              <col className="w-[220px]" />
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[90px]" />
            </colgroup>
            <thead className="bg-[#F1F5F6]">
              <tr className="text-[12px] text-[var(--neutral-900)]">
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[56px]">No</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[120px]">District</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[200px]">School</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[180px]">File name</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[220px]">Report Metrics</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[160px]">Course name</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[90px]">Action</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* scrollable body only */}
        <div className="max-h-[520px] overflow-y-auto rounded-b-lg custom-scrollbar">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[56px]" />
              <col className="w-[120px]" />
              <col className="w-[200px]" />
              <col className="w-[180px]" />
              <col className="w-[220px]" />
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[90px]" />
            </colgroup>
            <tbody>
              {rows.map((r) => (
                <tr key={r.no} className="text-[12px]">
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)] text-[var(--neutral-1000)]">
                    {r.no}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    {r.district}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    {r.school}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    {r.file}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    <div className="flex flex-wrap gap-2">
                      {r.focal.map((t) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    {r.course}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    {r.range}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--neutral-300)] hover:bg-[var(--neutral-100)]"
                      aria-label={`Download row ${r.no}`}
                    >
                      <Download className="h-4 w-4 text-[var(--neutral-800)]" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-[var(--neutral-700)] border-t border-[var(--neutral-200)]"
                  >
                    No data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (shared component) */}
        <div className="px-4 md:px-5 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </section>
  );
}
