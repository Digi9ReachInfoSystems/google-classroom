"use client"

import { useState, useEffect } from "react"
import ProgressSidebar from "./modules/progress-sidebar"
import StageContent from "./modules/StageContent"
import { Button } from "@/components/ui/button"
import { BookOpen, AlertCircle } from "lucide-react"
import { useCourse } from "@/components/studentdashboard/context/CourseContext"

export default function ClassroomPage() {
  const { selectedCourse, loadingCourses, error } = useCourse()
  const [studentEmail, setStudentEmail] = useState<string>("")
  const [stageProgress, setStageProgress] = useState<any>(null)
  const [selectedStage, setSelectedStage] = useState<string>("pre-survey")
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(true)

  // Get student email from token/session
  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        if (data.success && data.user) {
          setStudentEmail(data.user.email)
        }
      } catch (error) {
        console.error('Error fetching student info:', error)
      }
    }

    fetchStudentInfo()
  }, [])

  // Fetch stage progress when course changes
  useEffect(() => {
    if (selectedCourse?.id) {
      fetchStageProgress()
    }
  }, [selectedCourse])

  const fetchStageProgress = async () => {
    if (!selectedCourse?.id) return

    try {
      setLoadingProgress(true)
      const response = await fetch(`/api/student/stage-progress?courseId=${selectedCourse.id}`)
      const data = await response.json()

      if (data.success) {
        setStageProgress(data.progress)
        // Auto-select first incomplete stage
        if (!data.progress.preSurveyCompleted) {
          setSelectedStage("pre-survey")
        } else if (!data.progress.courseCompleted) {
          setSelectedStage("course")
        } else if (!data.progress.ideasCompleted) {
          setSelectedStage("ideas")
        } else if (!data.progress.postSurveyCompleted) {
          setSelectedStage("post-survey")
        }
      }
    } catch (error) {
      console.error('Error fetching stage progress:', error)
    } finally {
      setLoadingProgress(false)
    }
  }

  // Show loading state
  if (loadingCourses) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Courses</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Show no course selected state
  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Course Selected</h2>
          <p className="text-muted-foreground">
            Please select a course from the dropdown in the header to view course content.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="3xl:max-w-7xl 3xl:mx-auto p-4 sm:p-6 xl:p-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Classroom</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{selectedCourse.name}</span>
            {selectedCourse.section && (
              <>
                <span className="hidden sm:inline">•</span>
                <span>{selectedCourse.section}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 xl:gap-8 2xl:gap-12">
          {/* Main content area */}
          <div className="flex-1 min-w-0 order-1 lg:order-1">
            <div className="max-w-4xl mx-auto xl:max-w-5xl 2xl:max-w-6xl">
            <StageContent
              courseId={selectedCourse.id}
              studentEmail={studentEmail}
              selectedStage={selectedStage}
              stageProgress={stageProgress}
              selectedMaterialId={selectedMaterialId}
              onStageComplete={fetchStageProgress}
              loading={loadingProgress}
            />
            </div>
          </div>

          {/* Sidebar */}
          <div className="order-2 lg:order-2">
        <ProgressSidebar
          selectedCourse={selectedCourse}
          stageProgress={stageProgress}
          selectedStage={selectedStage}
          onStageSelect={setSelectedStage}
          onMaterialSelect={(materialId) => {
            setSelectedMaterialId(materialId)
          }}
        />
          </div>
        </div>
      </div>
    </div>
  )
}
