"use client"

import * as React from "react"
import Superadminideas from "@/components/superadmin/superadminideas/ideas/ideas"
import Ideasubmitted from "@/components/superadmin/superadminideas/submitteddata/submitteddata"

// ----- Dummy data (now includes school & district) -----
export type IdeaRow = {
  student: string
  title: string
  category: string
  date: string
  status: "Approved" | "Pending" | "Rejected" | "-" | ""
  file?: string | null
  school: string
  district: string
}

const ALL_ROWS: IdeaRow[] = [
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "STEM", date: "Sep 10, 2025", status: "Approved", file: "Explore idea", school: "School A", district: "District 1" },
  { student: "Rahul P", title: "Digital Art Showcase", category: "Arts", date: "Sep 1, 2025", status: "Pending",  file: "Explore idea", school: "School B", district: "District 2" },
  { student: "Sneha M", title: "-",                   category: "-",   date: "-",           status: "-",        file: "-",           school: "School C", district: "District 3" },
  { student: "Arjun T",  title: "-",                   category: "-",   date: "-",           status: "Rejected", file: "-",           school: "School A", district: "District 1" },
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "Arts", date: "Sep 10, 2025", status: "Approved", file: "Explore idea", school: "School A", district: "District 1" },
  { student: "Alice Smith", title: "-",                   category: "-",   date: "-",           status: "-",        file: "-",           school: "School B", district: "District 2" },
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "Arts", date: "Sep 10, 2025", status: "Pending",  file: "Explore idea", school: "School C", district: "District 3" },
  { student: "Alice Smith", title: "-",                   category: "-",   date: "-",           status: "-",        file: "-",           school: "School A", district: "District 1" },
]

export default function Page() {
  // ----- filters in page state -----
  const [school, setSchool]   = React.useState<string>("")
  const [district, setDistrict] = React.useState<string>("")
  const [status, setStatus]   = React.useState<string>("")

  // ----- filter rows based on dropdowns -----
  const filteredRows = React.useMemo(() => {
    return ALL_ROWS.filter(r =>
      (school   ? r.school   === school   : true) &&
      (district ? r.district === district : true) &&
      (status   ? r.status   === status   : true)
    )
  }, [school, district, status])

  // ----- numbers for rings -----
  const totalStudents = React.useMemo(() => {
    const set = new Set(filteredRows.map(r => r.student).filter(s => s && s !== "-"))
    return set.size
  }, [filteredRows])

  const totalIdeasSubmitted = React.useMemo(() => {
    return filteredRows.filter(r => r.title && r.title !== "-").length
  }, [filteredRows])

  return (
    <>
      <Superadminideas
        school={school}
        district={district}
        status={status}
        onSchoolChange={setSchool}
        onDistrictChange={setDistrict}
        onStatusChange={setStatus}
        totalStudents={totalStudents}
        totalIdeas={totalIdeasSubmitted}
      />
      <Ideasubmitted rows={filteredRows} />
    </>
  )
}
