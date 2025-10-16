"use client"

import { useState, useMemo, useEffect } from "react"
import TeacherCircleProgressRow from "./modules/ideasprogress"
import { FiltersBar } from "./modules/FiltersBar"
import { IdeaRow, IdeasTable } from "./modules/IdeasTable"
import { useTeacherCourse } from "../context/TeacherCourseContext"

export default function IdeasPage() {
  const { selectedCourse } = useTeacherCourse()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ideas, setIdeas] = useState<IdeaRow[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalIdeasSubmitted, setTotalIdeasSubmitted] = useState(0)
  const [submittedPercentage, setSubmittedPercentage] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch ideas data when course changes
  useEffect(() => {
    if (selectedCourse?.id) {
      fetchIdeasData()
    }
  }, [selectedCourse])

  const fetchIdeasData = async () => {
    if (!selectedCourse?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/teacher/ideas?courseId=${selectedCourse.id}`)
      const data = await response.json()

      if (data.success) {
        setIdeas(data.ideas || [])
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

  // Filter the ideas based on search and status
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesSearch =
        idea.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.ideaTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "completed" && idea.status === "completed") ||
        (statusFilter === "pending" && idea.status === "pending")

      return matchesSearch && matchesStatus
    })
  }, [ideas, searchQuery, statusFilter])

  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Please select a course to view ideas</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Ideas</h1>
        </div>

        {/* Progress Cards */}
        <TeacherCircleProgressRow 
          totalStudents={totalStudents}
          totalIdeasSubmitted={totalIdeasSubmitted}
          submittedPercentage={submittedPercentage}
        />

        {/* My submitted idea section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[var(--neutral-1000)]">Student Ideas</h2>
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
              <FiltersBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>

          {/* Ideas Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <IdeasTable rows={filteredIdeas} />
          )}
        </div>
      </div>
    </div>
  )
}
