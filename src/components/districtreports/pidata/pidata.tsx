"use client";

import React from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

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
  file: "—",
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

/* ---------- small chip (better padding) ---------- */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--warning-400)] text-white text-[11px] px-2.5 py-[5px] leading-none">
      {children}
    </span>
  );
}

/* ---------- pagination helper ---------- */
function usePagination(total: number, perPage: number) {
  const [page, setPage] = React.useState(1);
  const pages = Math.max(1, Math.ceil(total / perPage));

  const go = (p: number) => setPage(Math.min(pages, Math.max(1, p)));
  const next = () => go(page + 1);
  const prev = () => go(page - 1);

  // compact window like the design
  const window = 5;
  const start = Math.max(1, page - Math.floor(window / 2));
  const end = Math.min(pages, start + window - 1);
  const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return { page, pages, go, next, prev, nums };
}

/* ---------- main ---------- */
export default function Pidata() {
  const PER_PAGE = 10;
  const { page, pages, go, next, prev, nums } = usePagination(
    ALL_ROWS.length,
    PER_PAGE
  );

  const start = (page - 1) * PER_PAGE;
  const rows = ALL_ROWS.slice(start, start + PER_PAGE);

  return (
    <section className="w-full px-4 md:px-5 py-5 mt-5">
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* scrollable body (still shows only 10 rows per page) */}
        <div className="max-h-[520px] overflow-y-auto scroll-thin">
          <table className="w-full table-fixed">
            <thead className="bg-[var(--success-100)]">
              <tr className="text-[12px] text-[var(--neutral-900)]">
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[56px]">
                  No
                </th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[120px]">
                  District
                </th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[200px]">
                  School
                </th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[180px]">
                  File name
                </th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[220px]">
                  Focal points
                </th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[160px]">
                  Course name
                </th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[170px]">
                  Date Range
                </th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[90px]">
                  Action
                </th>
              </tr>
            </thead>

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

        {/* pagination strip (dynamic; matches your style) */}
        <div className="flex items-center justify-end px-4 md:px-5 py-3">
          <div className="flex items-center gap-2 rounded-full bg-[var(--neutral-1000)]/90 px-2 md:px-3 py-2">
            <button
              type="button"
              onClick={prev}
              disabled={page === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:text-white disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {nums[0] > 1 && (
              <>
                <PageDot n={1} active={page === 1} onClick={() => go(1)} />
                <Ellipsis />
              </>
            )}

            {nums.map((n) => (
              <PageDot key={n} n={n} active={n === page} onClick={() => go(n)} />
            ))}

            {nums[nums.length - 1] < pages && (
              <>
                <Ellipsis />
                <PageDot
                  n={pages}
                  active={page === pages}
                  onClick={() => go(pages)}
                />
              </>
            )}

            <button
              type="button"
              onClick={next}
              disabled={page === pages}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:text-white disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- pagination bits ---------- */
function PageDot({
  n,
  active,
  onClick,
}: {
  n: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px]",
        active
          ? "bg-[var(--warning-400)] text-white"
          : "text-white/80 hover:text-white",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
      aria-label={`Page ${n}`}
    >
      {n}
    </button>
  );
}

function Ellipsis() {
  return <span className="px-1 text-white/60">…</span>;
}
