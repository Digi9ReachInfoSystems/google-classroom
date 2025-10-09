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

/* ---------- small chip ---------- */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--primary)] text-white text-[11px] px-2.5 py-[5px] leading-none">
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

  // compact window
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
        {/* scrollable body */}
        <div className="max-h-[520px] overflow-y-auto custom-scrollbar">
          <table className="w-full table-fixed">
            <thead className="bg-[var(--success-100)]">
              <tr className="text-[14px] text-[var(--neutral-900)]">
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[56px]">No</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[120px]">District</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[200px]">School</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[180px]">File name</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[220px]">Focal points</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[160px]">Course name</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[90px]">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.no} className="text-[12px]">
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)] text-[var(--neutral-1000)]">{r.no}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.district}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.school}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.file}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    <div className="flex flex-wrap gap-2">
                      {r.focal.map((t) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.course}</td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">{r.range}</td>
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

        {/* slim pagination (design-matched) */}
        <div className="flex items-center justify-end px-4 md:px-5 py-3">
          <nav className="flex items-center gap-4" aria-label="Pagination">
            {/* Prev pill */}
            <button
              type="button"
              onClick={prev}
              disabled={page <= 1}
              className="
                 h-7 w-[132px] rounded-full border border-black
        text-[12px] text-black
        disabled:opacity-40 disabled:cursor-not-allowed
        bg-transparent
              "
            >
              Previous
            </button>

            {/* dots rail */}
            <div className="relative flex items-center gap-3 px-2">
              {/* subtle rail outline behind dots */}
            <div className="absolute inset-0 -z-10 rounded-full border border-black" />
              <ul className="flex items-center gap-3 px-3 py-1">
                {nums[0] > 1 && (
                  <>
                    <Dot page={1} active={page === 1} onClick={() => go(1)} />
                    {nums[0] > 2 && <Ellipsis />}
                  </>
                )}

                {nums.map((n) => (
                  <Dot key={n} page={n} active={n === page} onClick={() => go(n)} />
                ))}

                {nums[nums.length - 1] < pages && (
                  <>
                    {nums[nums.length - 1] < pages - 1 && <Ellipsis />}
                    <Dot
                      page={pages}
                      active={page === pages}
                      onClick={() => go(pages)}
                    />
                  </>
                )}
              </ul>
            </div>

            {/* Next pill */}
            <button
              type="button"
              onClick={next}
              disabled={page >= pages}
              className="
                h-7 w-[132px] rounded-full border border-black
        text-[12px] text-black
        disabled:opacity-40 disabled:cursor-not-allowed
        bg-transparent
              "
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </section>
  );
}

/* ---------- pagination bits (design) ---------- */
// function Ellipsis() {
//   return (
//     <li
//       aria-hidden
//       className="h-5 px-1 grid place-items-center text-[12px] text-[color:var(--neutral-600)]"
//     >
//       …
//     </li>
//   );
// }
function Dot({
  page,
  active,
  onClick,
}: {
  page: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        title={`Page ${page}`}
        className={`
          inline-grid place-items-center
          ${active ? "h-6 w-6" : "h-5 w-5"}
          rounded-full transition-opacity text-black text-[12px]
          ${active
            ? "bg-[var(--primary)]"   /* active background */
            : "border border-black"   /* inactive outline */
          }
          hover:opacity-90
        `}
      >
        {page}
      </button>
    </li>
  );
}
function Ellipsis() {
  return (
    <li aria-hidden className="h-5 px-2 grid place-items-center text-[12px] text-black/70">
      …
    </li>
  );
}
