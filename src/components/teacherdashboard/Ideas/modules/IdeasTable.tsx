"use client"
import { Badge } from "@/components/ui/badge"

export type IdeaRow = {
  studentName: string
  ideaTitle: string
  category: string
  dateSubmitted: string
  status: "completed" | "pending"
  fileUrl?: string
}

export function IdeasTable({ rows }: { rows: IdeaRow[] }) {
  return (
    <div className="overflow-x-auto">
      {/* Header table (fixed) - mirrors student CourseUpdatesTable styles */}
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
            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-600 rounded-tl-lg">Student Name</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-600">Idea Title</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-600">Category</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-600">Date Submitted</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-600">Status</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-600 rounded-tr-lg">File</th>
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
            {rows.map((row, idx) => (
              <tr key={idx} className="bg-white hover:bg-muted/50 transition-colors">
                <td className="py-3 px-6 text-sm text-card-foreground">{row.studentName}</td>
                <td className="py-3 px-6 text-sm text-card-foreground">{row.ideaTitle}</td>
                <td className="py-3 px-6 text-sm text-card-foreground">{row.category}</td>
                <td className="py-3 px-6 text-sm text-card-foreground">{row.dateSubmitted}</td>
                <td className="py-3 px-6">
                  <Badge
                    variant={row.status === "completed" ? "default" : "secondary"}
                    className={
                      row.status === "completed"
                        ? "bg-[var(--success-500)] text-white border-transparent"
                        : "bg-[var(--neutral-200)] text-[var(--neutral-1000)] border-transparent"
                    }
                  >
                    {row.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </td>
                <td className="py-3 px-6 text-sm whitespace-nowrap">
                  {row.fileUrl ? (
                    <a 
                      className="text-[#10B981] hover:underline whitespace-nowrap inline-block font-medium" 
                      href={row.fileUrl.replace('/viewform', '/edit#responses')} 
                      target="_blank" 
                      rel="noreferrer"
                      title="View responses in Google Forms"
                    >
                      View Responses
                    </a>
                  ) : (
                    <span className="text-neutral-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
