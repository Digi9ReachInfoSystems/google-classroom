"use client"

import * as React from "react"
import { Search } from "lucide-react"
import type { IdeaRow } from "@/app/(superadmin)/superadmin/ideas/page"

// Map any incoming status to only "Approved" or "Pending"
function normalizeStatus(s?: string | null): "Approved" | "Pending" {
  const val = (s || "").trim().toLowerCase()
  if (val === "approved" || val === "submit" || val === "submitted") return "Approved"
  return "Pending"
}

// status pill (two states only) with fixed width and centered
function StatusBadge({ status }: { status: IdeaRow["status"] }) {
  const norm = normalizeStatus(status as string)
  const baseClass = "inline-block rounded-[16px] px-2 py-1 text-[12px] leading-[14px] text-center min-w-[80px]"
  const cls = norm === "Approved" 
    ? `${baseClass} bg-[var(--success-500)] text-white`
    : `${baseClass} bg-[var(--neutral-400)] text-white`
  return <span className={cls}>{norm}</span>
}

// -------- helpers: export to xlsx (preferred) or CSV (fallback) --------
function sanitizeFilename(name: string) {
  return name.replace(/[^\w\d\-_.]+/g, "_")
}

async function exportRowToExcel(row: IdeaRow) {
  const filenameBase = sanitizeFilename(
    `Idea_${row.student || "student"}_${row.date || "date"}`
  )

  const normalized = normalizeStatus(row.status as string)

  // Try real .xlsx via SheetJS if available
  try {
    const XLSX = await import("xlsx") // requires `npm i xlsx`
    const data = [
      {
        "Student Name": row.student,
        "Idea Title": row.title,
        "Category": row.category,
        "Date Submitted": row.date,
        "Status": normalized, // normalized
        "School": (row as any).school ?? "",
        "District": (row as any).district ?? "",
      },
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, "Idea")
    XLSX.writeFile(wb, `${filenameBase}.xlsx`)
    return
  } catch {
    // Fallback: CSV that opens in Excel
    const header = [
      "Student Name",
      "Idea Title",
      "Category",
      "Date Submitted",
      "Status",
      "School",
      "District",
    ]
    const vals = [
      row.student,
      row.title,
      row.category,
      row.date,
      normalized, // normalized
      (row as any).school ?? "",
      (row as any).district ?? "",
    ]
    const csv =
      header.join(",") +
      "\n" +
      vals
        .map((v) => {
          const s = String(v ?? "")
          if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
          return s
        })
        .join(",")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filenameBase}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
}

export default function Ideasubmitted({ rows }: { rows: IdeaRow[] }) {
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const normStatus = normalizeStatus(r.status as string)
      return [r.student, r.title, r.category, normStatus, (r as any).school, (r as any).district]
        .some(v => (v || "").toLowerCase().includes(q))
    })
  }, [query, rows])

  return (
    <div className="w-full px-5">
      {/* Top bar: left label + search */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[16px] font-semibold text-foreground/80">My Submitted data</span>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-full border border-[var(--neutral-300)] bg-transparent pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--warning-400)]"
          />
        </div>
      </div>

      {/* Table with improved styling matching IdeasTable */}
      <div className="overflow-x-auto">
        {/* Header table (fixed) */}
        <table className="w-full table-fixed rounded-t-lg overflow-hidden border-collapse border-b border-neutral-200">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[23%]" />
            <col className="w-[14%]" />
            <col className="w-[17%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F1F5F6]">
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600 rounded-tl-lg">Student Name</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600">Idea Title</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600">Category</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600">Date Submitted</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600 rounded-tr-lg">File</th>
            </tr>
          </thead>
        </table>

        <div className="max-h-[680px] overflow-y-auto rounded-b-lg custom-scrollbar">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[23%]" />
              <col className="w-[14%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={`${r.student}-${i}`} className="bg-white hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-6 text-sm text-card-foreground">{r.student}</td>
                  <td className="py-3 px-6 text-sm text-card-foreground">{r.title}</td>
                  <td className="py-3 px-6 text-sm text-card-foreground">{r.category}</td>
                  <td className="py-3 px-6 text-sm text-card-foreground">{r.date}</td>
                  <td className="py-3 px-6">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3 px-6 text-sm whitespace-nowrap">
                    {r.file && r.file !== "-" ? (
                      <button
                        type="button"
                        onClick={() => exportRowToExcel(r)}
                        className="text-[#2E7CF6] hover:underline whitespace-nowrap inline-block"
                      >
                        {r.file}
                      </button>
                    ) : (
                      <span className="text-neutral-400">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td className="py-10 px-6 text-center text-muted-foreground" colSpan={6}>
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}