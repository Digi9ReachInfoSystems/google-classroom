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

// status pill (two states only)
function StatusBadge({ status }: { status: IdeaRow["status"] }) {
  const norm = normalizeStatus(status as string)
  const cls = norm === "Approved" ? "label-success" : "label-warning"
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

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-[var(--card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--secondary)]">
            <tr>
              <th className="py-4 px-6">Student Name</th>
              <th className="py-4 px-6">Idea Title</th>
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Date Submitted</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">File</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={`${r.student}-${i}`}>
                <td className="py-4 px-6">{r.student}</td>
                <td className="py-4 px-6">{r.title}</td>
                <td className="py-4 px-6">{r.category}</td>
                <td className="py-4 px-6">{r.date}</td>
                <td className="py-4 px-6">
                  <StatusBadge status={r.status} />
                </td>
                <td className="py-4 px-6">
                  {r.file && r.file !== "-" ? (
                    <button
                      type="button"
                      onClick={() => exportRowToExcel(r)}
                      className="text-[var(--blue-400)] hover:underline"
                    >
                      {r.file}
                    </button>
                  ) : "-"}
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
  )
}
