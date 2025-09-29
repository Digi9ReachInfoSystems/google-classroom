"use client"

import CompletionTable from "@/components/superadmin/superadmincoursemetric/completiontable/completiontable"
import CoursePartition from "@/components/superadmin/superadmincoursemetric/courseparticipation/courseparticipation"
import ProgressTrends from "@/components/superadmin/superadmincoursemetric/progresstrends/progresstrends"


export default function DashboardPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Full width header and summary cards */}
      <CoursePartition />

      {/* Two charts below (50/50 split on lg+, stacked on small) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressTrends />
        <CompletionTable />
      </div>
    </div>
  )
}
