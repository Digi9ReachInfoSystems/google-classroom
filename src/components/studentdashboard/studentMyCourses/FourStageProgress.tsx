"use client"

import { useState, useEffect } from "react"
import { Lock, CheckCircle, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPublicFormUrl } from "@/lib/form-utils"

interface Stage {
  id: string
  title: string
  description: string
  type: "form" | "course"
  formUrl?: string
  isCompleted: boolean
  isLocked: boolean
}

interface FourStageProgressProps {
  courseId: string
  studentEmail: string
}

export default function FourStageProgress({ courseId, studentEmail }: FourStageProgressProps) {
  const [stages, setStages] = useState<Stage[]>([
    {
      id: "pre-survey",
      title: "Pre-Survey",
      description: "Complete the pre-course survey to unlock the course content",
      type: "form",
      formUrl: "",
      isCompleted: false,
      isLocked: false
    },
    {
      id: "course",
      title: "Course",
      description: "Complete all course materials and assignments",
      type: "course",
      isCompleted: false,
      isLocked: true
    },
    {
      id: "ideas",
      title: "Ideas",
      description: "Submit your project ideas and innovations",
      type: "form",
      formUrl: "",
      isCompleted: false,
      isLocked: true
    },
    {
      id: "post-survey",
      title: "Post-Survey",
      description: "Complete the post-course survey to finish",
      type: "form",
      formUrl: "",
      isCompleted: false,
      isLocked: true
    }
  ])

  const [selectedStage, setSelectedStage] = useState<string>("pre-survey")
  const [loading, setLoading] = useState(true)

  // Fetch stage progress from API
  useEffect(() => {
    fetchStageProgress()
  }, [courseId, studentEmail])

  const fetchStageProgress = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/stage-progress?courseId=${courseId}`)
      const data = await response.json()

      if (data.success) {
        updateStagesFromProgress(data.progress)
      }
    } catch (error) {
      console.error('Error fetching stage progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStagesFromProgress = (progress: any) => {
    setStages(prevStages => {
      const updatedStages = [...prevStages]
      
      // Update completion status
      updatedStages[0].isCompleted = progress.preSurveyCompleted || false
      updatedStages[1].isCompleted = progress.courseCompleted || false
      updatedStages[2].isCompleted = progress.ideasCompleted || false
      updatedStages[3].isCompleted = progress.postSurveyCompleted || false

      // Update form URLs
      updatedStages[0].formUrl = progress.preSurveyUrl || ""
      updatedStages[2].formUrl = progress.ideasUrl || ""
      updatedStages[3].formUrl = progress.postSurveyUrl || ""

      // Update locked status (each stage locked until previous is completed)
      updatedStages[1].isLocked = !updatedStages[0].isCompleted
      updatedStages[2].isLocked = !updatedStages[1].isCompleted
      updatedStages[3].isLocked = !updatedStages[2].isCompleted

      // Auto-select first incomplete stage
      const firstIncomplete = updatedStages.find(s => !s.isCompleted)
      if (firstIncomplete) {
        setSelectedStage(firstIncomplete.id)
      }

      return updatedStages
    })
  }

  const handleStageClick = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    if (stage && !stage.isLocked) {
      setSelectedStage(stageId)
    }
  }

  const handleFormSubmit = async (stageId: string) => {
    try {
      const response = await fetch('/api/student/complete-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          stageId
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh stage progress
        await fetchStageProgress()
      }
    } catch (error) {
      console.error('Error completing stage:', error)
    }
  }

  const currentStage = stages.find(s => s.id === selectedStage)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stage Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stages.map((stage, index) => (
          <Card
            key={stage.id}
            className={`cursor-pointer transition-all ${
              selectedStage === stage.id
                ? 'ring-2 ring-primary'
                : stage.isLocked
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-md'
            }`}
            onClick={() => handleStageClick(stage.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {stage.isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : stage.isLocked ? (
                    <Lock className="h-6 w-6 text-gray-400" />
                  ) : (
                    <Circle className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{stage.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {stage.isCompleted ? 'Completed' : stage.isLocked ? 'Locked' : 'In Progress'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stage Content */}
      {currentStage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStage.isCompleted ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : currentStage.isLocked ? (
                <Lock className="h-6 w-6 text-gray-400" />
              ) : (
                <Circle className="h-6 w-6 text-blue-500" />
              )}
              {currentStage.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{currentStage.description}</p>
          </CardHeader>
          <CardContent>
            {currentStage.isLocked ? (
              <div className="text-center py-12">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Complete the previous stage to unlock this section
                </p>
              </div>
            ) : currentStage.type === "form" ? (
              <div className="space-y-4">
                {currentStage.isCompleted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">Stage Completed!</p>
                    <p className="text-muted-foreground">
                      You have successfully completed this stage.
                    </p>
                  </div>
                ) : currentStage.formUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                      <iframe
                        src={getPublicFormUrl(currentStage.formUrl)}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        marginHeight={0}
                        marginWidth={0}
                        className="w-full h-full"
                      >
                        Loading…
                      </iframe>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => handleFormSubmit(currentStage.id)}>
                        Mark as Complete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No form URL configured for this stage.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Course content
              <div className="space-y-4">
                {currentStage.isCompleted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">Course Completed!</p>
                    <p className="text-muted-foreground">
                      You have successfully completed all course materials.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Course materials will be displayed here.
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => handleFormSubmit(currentStage.id)}
                    >
                      Mark Course as Complete
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
