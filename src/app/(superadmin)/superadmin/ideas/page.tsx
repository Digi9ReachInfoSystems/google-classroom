"use client"

import * as React from "react"
import Superadminideas from "@/components/superadmin/superadminideas/ideas/ideas"
import Ideasubmitted from "@/components/superadmin/superadminideas/submitteddata/submitteddata"
import { useSuperAdminCourse } from "@/components/superadmin/context/SuperAdminCourseContext"

export type IdeaRow = {
  student: string
  title: string
  category: string
  date: string
  status: "completed" | "pending"
  file?: string | null
  school: string
  district: string
}

export default function Page() {
  const { selectedCourse } = useSuperAdminCourse()
  const [school, setSchool] = React.useState<string>("All")
  const [district, setDistrict] = React.useState<string>("All")
  const [schools, setSchools] = React.useState<string[]>([])
  const [districts, setDistricts] = React.useState<string[]>([])
  const [ideas, setIdeas] = React.useState<IdeaRow[]>([])
  const [totalStudents, setTotalStudents] = React.useState(0)
  const [totalIdeasSubmitted, setTotalIdeasSubmitted] = React.useState(0)
  const [submittedPercentage, setSubmittedPercentage] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  // Fetch schools and districts on mount
  React.useEffect(() => {
    fetchSchools()
    fetchDistricts()
  }, [])

  // Fetch ideas when course or filters change
  React.useEffect(() => {
    if (selectedCourse?.id) {
      fetchIdeasData()
    }
  }, [selectedCourse, school, district])

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/superadmin/schools')
      const data = await response.json()
      if (data.success) {
        setSchools(['All', ...data.schools.map((s: any) => s.name)])
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
      setSchools(['All'])
    }
  }

  const fetchDistricts = async () => {
    try {
      const response = await fetch('/api/superadmin/districts')
      const data = await response.json()
      if (data.success) {
        setDistricts(['All', ...data.districts])
      }
    } catch (error) {
      console.error('Error fetching districts:', error)
      setDistricts(['All'])
    }
  }

  const fetchIdeasData = async () => {
    if (!selectedCourse?.id) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('courseId', selectedCourse.id)
      if (school && school !== 'All') params.set('schoolName', school)
      if (district && district !== 'All') params.set('district', district)

      const response = await fetch(`/api/superadmin/ideas?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const mappedIdeas: IdeaRow[] = (data.ideas || []).map((idea: any) => ({
          student: idea.studentName,
          title: idea.ideaTitle,
          category: idea.category,
          date: idea.dateSubmitted,
          status: idea.status,
          file: idea.fileUrl,
          school: idea.schoolName,
          district: idea.district,
        }))
        setIdeas(mappedIdeas)
        setTotalStudents(data.totalStudents || 0)
        setTotalIdeasSubmitted(data.totalIdeasSubmitted || 0)
        setSubmittedPercentage(data.submittedPercentage || 0)
      }
    } catch (error) {
      console.error('Error fetching ideas data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading courses...</p>
      </div>
    )
  }

  return (
    <>
      <Superadminideas
        school={school}
        district={district}
        schools={schools}
        districts={districts}
        onSchoolChange={setSchool}
        onDistrictChange={setDistrict}
        totalStudents={totalStudents}
        totalIdeas={totalIdeasSubmitted}
        submittedPercentage={submittedPercentage}
        loading={loading}
      />
      <Ideasubmitted rows={ideas} loading={loading} />
    </>
  )
}
