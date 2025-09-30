// LearningResourcesTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Search } from "lucide-react";

type Row = { id: number; name: string; type: "Course video" | "PDF" };

/** Demo data (30 rows so you can see pagination working).
 * Replace with your own data source.
 */
const seed: Row[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: "File Name",
  type: (i % 3 === 0 ? "PDF" : "Course video") as Row["type"],
}));

export default function LearningResourcesTable() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter then paginate
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return seed;
    return seed.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages); // guard if filter shrinks pages
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="w-full">
      {/* Header (same width as table) */}
      <div className="mx-auto mt-6 flex w-[70%] items-center justify-between gap-4">
        <h1 className="text-[32px] font-normal leading-tight text-[var(--neutral-1000)]">
          Learning Resources
        </h1>

        <div className="relative w-full max-w-[520px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={18}
            stroke="var(--neutral-700)"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1); // reset to first page when searching
            }}
            type="text"
            placeholder="Search..."
            className="w-full rounded-full border border-[var(--neutral-300)] bg-[var(--neutral-100)] py-2 pl-9 pr-4 text-sm text-[var(--neutral-900)] outline-none focus:border-[var(--blue-400)]"
          />
        </div>
      </div>

      {/* Table card (70% width, centered) */}
      <div className="mx-auto my-6 w-[70%] overflow-hidden rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-100)]">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="h-14">
                <th className="px-6 text-sm text-[var(--neutral-900)]">No</th>
                <th className="px-6 text-sm text-[var(--neutral-900)]">Details</th>
                <th className="px-6 text-sm text-[var(--neutral-900)]">File type</th>
                <th className="px-6 text-sm text-[var(--neutral-900)]">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {pageRows.map((r) => (
                <tr key={r.id} className="h-12">
                  <td className="px-6  text-sm text-[var(--neutral-900)]">
                    {r.id}
                  </td>
                  <td className="px-6  text-sm text-[var(--neutral-900)]">
                    {r.name}
                  </td>
                  <td className="px-6  text-sm text-[var(--neutral-800)]">
                    {r.type}
                  </td>
                  <td className="px-6">
                    <div className="flex gap-4">
                      <button
                        className="rounded-full p-1.5 transition-colors hover:bg-[var(--neutral-200)]"
                        aria-label="View"
                        title="View"
                      >
                        <Eye size={18} stroke="var(--neutral-1000)" />
                      </button>
                      <button
                        className="rounded-full p-1.5 transition-colors hover:bg-[var(--neutral-200)]"
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil size={18} stroke="var(--neutral-1000)" />
                      </button>
                      <button
                        className="rounded-full p-1.5 transition-colors hover:bg-[var(--neutral-200)]"
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 size={18} stroke="var(--neutral-1000)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty state when search has no matches */}
              {pageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-[var(--neutral-700)]"
                  >
                    No resources found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div className="flex flex-col items-center justify-between gap-4 bg-white px-6 py-4 sm:flex-row">
          <div className="text-sm text-[var(--neutral-800)]">
            Showing {filtered.length === 0 ? 0 : start + 1}–
            {Math.min(start + pageSize, filtered.length)} of {filtered.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 1}
              className={`rounded-full border border-[var(--neutral-300)] px-4 py-1.5 text-sm ${
                currentPage === 1
                  ? "opacity-50"
                  : "text-[var(--neutral-900)] hover:bg-[var(--neutral-200)]"
              }`}
            >
              Previous
            </button>

            {/* Page numbers (compact) */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`rounded-full px-3 py-1 text-sm ${
                  p === currentPage
                    ? "bg-[var(--primary)] text-white"
                    : "border border-[var(--neutral-300)] text-[var(--neutral-900)] hover:bg-[var(--neutral-200)]"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`rounded-full border border-[var(--neutral-300)] px-4 py-1.5 text-sm ${
                currentPage === totalPages
                  ? "opacity-50"
                  : "text-[var(--neutral-900)] hover:bg-[var(--neutral-200)]"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
