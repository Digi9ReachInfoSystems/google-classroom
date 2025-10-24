"use client"

import * as React from "react"
import { Search } from "lucide-react"
import type { IdeaRow } from "@/app/(superadmin)/superadmin/ideas/page"

// status pill (two states only) with fixed width and centered
function StatusBadge({ status }: { status: IdeaRow["status"] }) {
  const baseClass = "inline-block rounded-[16px] px-2 py-1 text-[12px] leading-[14px] text-center min-w-[80px]"
  const cls = status === "completed"
    ? `${baseClass} bg-[var(--success-500)] text-white`
    : `${baseClass} bg-[var(--neutral-400)] text-white`
  return <span className={cls}>{status === "completed" ? "Completed" : "Pending"}</span>
}

// -------- helpers: export to xlsx (preferred) or CSV (fallback) --------
function sanitizeFilename(name: string) {
  return name.replace(/[^\w\d\-_.]+/g, "_")
}


export default function Ideasubmitted({ rows, loading }: { rows: IdeaRow[]; loading?: boolean }) {
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filtered = React.useMemo(() => {
    let result = rows
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter)
    }
    
    // Apply search filter
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter((r) => {
        return [r.student, r.title, r.category, (r as any).school, (r as any).district]
          .some(v => (v || "").toLowerCase().includes(q))
      })
    }
    
    return result
  }, [query, rows, statusFilter])

  return (
    <div className="w-full px-5">
      {/* Top bar: left label + filters */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[16px] font-semibold text-foreground/80">Student Ideas</span>
        <div className="flex items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
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
                        r.status === "completed" ? (
                          <a
                            href={r.file.replace('/viewform', '/edit#responses')}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#10B981] hover:underline whitespace-nowrap inline-block font-medium"
                            title="View student's response in Google Forms"
                          >
                            View Responses
                          </a>
                        ) : (
                          <a
                            href={r.file}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#2E7CF6] hover:underline whitespace-nowrap inline-block"
                            title="Open idea submission form"
                          >
                            Open Form
                          </a>
                        )
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
          )}
        </div>
      </div>
    </div>
  )
}