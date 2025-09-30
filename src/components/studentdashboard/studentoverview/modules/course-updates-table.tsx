"use client";
import { Badge } from "@/components/ui/badge";
interface CourseUpdate {
  module: string
  score: string
  dateOfSubmission: string
  status: "completed" | "pending"
}
 
const courseUpdates: CourseUpdate[] = [
  { module: "Video module -1", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -1", score: "88%", dateOfSubmission: "Sep 1, 2025", status: "completed" },
  { module: "Video module -2", score: "N/A", dateOfSubmission: "N/A", status: "pending" },
  { module: "Assignment -2", score: "90%", dateOfSubmission: "Sep 1, 2025", status: "pending" },
  { module: "Video module -3", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -3", score: "90%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -4", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -4", score: "78%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -5", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },
  { module: "Video module -3", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -3", score: "90%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -4", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -4", score: "78%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -5", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },  { module: "Video module -3", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -3", score: "90%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -4", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -4", score: "78%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -5", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },
    { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },
  { module: "Video module -3", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -3", score: "90%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -4", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -4", score: "78%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -5", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },  { module: "Video module -3", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -3", score: "90%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -4", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -4", score: "78%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -5", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },
    { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },
  { module: "Video module -3", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -3", score: "90%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -4", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -4", score: "78%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -5", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },  { module: "Video module -3", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -3", score: "90%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -4", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -4", score: "78%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -5", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },
  { module: "Video module -3", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -3", score: "90%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -4", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -4", score: "78%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -5", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },  { module: "Video module -3", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -3", score: "90%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -4", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -4", score: "78%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -5", score: "N/A", dateOfSubmission: "N/A", status: "completed" },
  { module: "Assignment -5", score: "65%", dateOfSubmission: "Sep 10, 2025", status: "pending" },
  { module: "Video module -6", score: "N/A", dateOfSubmission: "N/A", status: "pending" },
]
 
export function CourseUpdatesTable() {
  const courseData = courseUpdates.map((update) => ({
    module: update.module,
    score: update.score,
    date: update.dateOfSubmission,
    status: update.status,
  }));
  return (
    <>
      <div className="bg-white rounded-lg  border-neutral-200">
      <div className="p-6  border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">Course updates</h2>
      </div>
      <div className="overflow-x-auto">
        {/* Header table (not scrollable) */}
        <table className="w-full table-fixed rounded-t-lg overflow-hidden border-collapse border-b border-neutral-200">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[15%]" />
            <col className="w-[25%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F1F5F6]">
              <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600 border-0 rounded-tl-lg capitalize">Module/Quiz</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600 border-0 capitalize">Score</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600 border-0 capitalize">Date of Submission</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600 border-0 rounded-tr-lg capitalize">Status</th>
            </tr>
          </thead>
        </table>
 
        {/* Scrollable body only (shows ~10 rows) */}
        <div className="max-h-[680px] overflow-y-auto rounded-b-lg custom-scrollbar">
          <table className="w-[100%] table-fixed">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[15%]" />
              <col className="w-[25%]" />
              <col className="w-[20%]" />
            </colgroup>
            <tbody>
              {courseData.map((item, index) => (
                <tr
                  key={index}
                  className={`bg-white hover:bg-muted/50 transition-colors`}
                >
                  <td className="py-3 px-6 text-sm text-card-foreground">{item.module}</td>
                  <td className="py-3 px-6 text-sm text-card-foreground tabular-nums">{item.score}</td>
                  <td className="py-3 px-6 text-sm text-card-foreground">{item.date}</td>
                  <td className="py-3 px-6">
                    <Badge
                      variant={item.status === "completed" ? "default" : "secondary"}
                      className={
                        item.status === "completed"
                          ? "bg-[var(--success-500)] text-white border-transparent"
                          : "bg-[var(--neutral-200)] text-[var(--neutral-1000)] border-transparent"
                      }
                    >
                      {item.status === "completed" ? "Completed" : "Pending"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  )
}
 
 