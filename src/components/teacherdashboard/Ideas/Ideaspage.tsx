"use client"

import { useState, useMemo } from "react"
import TeacherCircleProgressRow from "./modules/ideasprogress"
import { FiltersBar } from "./modules/FiltersBar"
import { IdeaRow, IdeasTable } from "./modules/IdeasTable"

// Sample data matching the image
const sampleIdeas: IdeaRow[] = [
  {
    studentName: "Alice Smith",
    ideaTitle: "Smart Recycling Bin",
    category: "STEM",
    dateSubmitted: "Sep 10, 2025",
    status: "completed",
    fileUrl: "https://forms.google.com/example1",
  },
  {
    studentName: "Rahul P",
    ideaTitle: "Digital Art Showcase",
    category: "Arts",
    dateSubmitted: "Sep 1, 2025",
    status: "completed",
    fileUrl: "https://forms.google.com/example2",
  },
  {
    studentName: "Sneha M",
    ideaTitle: "-",
    category: "-",
    dateSubmitted: "-",
    status: "pending",
  },
  {
    studentName: "Arjun T",
    ideaTitle: "-",
    category: "-",
    dateSubmitted: "-",
    status: "pending",
  },
  {
    studentName: "Alice Smith",
    ideaTitle: "Smart Recycling Bin",
    category: "Arts",
    dateSubmitted: "Sep 10, 2025",
    status: "completed",
    fileUrl: "https://forms.google.com/example3",
  },
  {
    studentName: "Alice Smith",
    ideaTitle: "-",
    category: "-",
    dateSubmitted: "-",
    status: "pending",
  },
  {
    studentName: "Alice Smith",
    ideaTitle: "Smart Recycling Bin",
    category: "Arts",
    dateSubmitted: "Sep 10, 2025",
    status: "completed",
    fileUrl: "https://forms.google.com/example4",
  },
  {
    studentName: "Alice Smith",
    ideaTitle: "-",
    category: "-",
    dateSubmitted: "-",
    status: "pending",
  },
]

export default function IdeasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Filter the ideas based on search and status
  const filteredIdeas = useMemo(() => {
    return sampleIdeas.filter((idea) => {
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
  }, [searchQuery, statusFilter])

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Ideas</h1>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Progress Cards */}
        <TeacherCircleProgressRow />

        {/* My submitted idea section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[var(--neutral-1000)]">My submitted idea</h2>
            <FiltersBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Ideas Table */}
          <IdeasTable rows={filteredIdeas} />
        </div>
      </div>
    </div>
  )
}
