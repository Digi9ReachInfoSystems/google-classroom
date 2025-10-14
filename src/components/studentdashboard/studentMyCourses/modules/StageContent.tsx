"use client"

import { useState } from "react"
import { Lock, CheckCircle, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CourseMaterials from "./CourseMaterials"

interface StageContentProps {
  courseId: string
  studentEmail: string
  selectedStage: string
  stageProgress: any
  selectedMaterialId?: string | null
  onStageComplete: () => void
  loading: boolean
}

export default function StageContent({
  courseId,
  studentEmail,
  selectedStage,
  stageProgress,
  selectedMaterialId,
  onStageComplete,
  loading
}: StageContentProps) {
  const [submitting, setSubmitting] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)

  const handleVideoSelect = (videoId: string, videoData: any) => {
    console.log('Video selected:', videoId, videoData)
    setSelectedVideo({ id: videoId, data: videoData })
    setSelectedQuiz(null) // Clear quiz selection
  }

  const handleQuizSelect = (quizId: string, quizData: any) => {
    console.log('Quiz selected:', quizId, quizData)
    setSelectedQuiz({ id: quizId, data: quizData })
    setSelectedVideo(null) // Clear video selection
  }

  if (loading || !stageProgress) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getStageInfo = () => {
    switch (selectedStage) {
      case "pre-survey":
        return {
          title: "Pre Survey",
          description: "Complete the pre-course survey to unlock the course content",
          isCompleted: stageProgress.preSurveyCompleted,
          isLocked: false,
          formUrl: stageProgress.preSurveyUrl,
          type: "form"
        }
      case "course":
        return {
          title: "Learning Modules",
          description: "Complete all course materials and assignments",
          isCompleted: stageProgress.courseCompleted,
          isLocked: !stageProgress.preSurveyCompleted,
          type: "course",
          completedCount: stageProgress.completedCourseworkCount || 0,
          totalCount: stageProgress.regularCourseworkCount || 0
        }
      case "ideas":
        return {
          title: "Idea Submission",
          description: "Submit your project ideas and innovations",
          isCompleted: stageProgress.ideasCompleted,
          isLocked: !stageProgress.courseCompleted,
          formUrl: stageProgress.ideasUrl,
          type: "form"
        }
      case "post-survey":
        return {
          title: "Post Survey",
          description: "Complete the post-course survey to finish",
          isCompleted: stageProgress.postSurveyCompleted,
          isLocked: !stageProgress.ideasCompleted,
          formUrl: stageProgress.postSurveyUrl,
          type: "form"
        }
      default:
        return null
    }
  }

  const stageInfo = getStageInfo()

  if (!stageInfo) {
    return <div>Invalid stage selected</div>
  }

  const handleMarkComplete = async () => {
    try {
      setSubmitting(true)
      const response = await fetch('/api/student/complete-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          stageId: selectedStage
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh stage progress
        await onStageComplete()
        
        // Note: Automatic navigation to next section will be implemented later
        // For now, just refresh the progress
      }
    } catch (error) {
      console.error('Error completing stage:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {stageInfo.isCompleted ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : stageInfo.isLocked ? (
            <Lock className="h-6 w-6 text-gray-400" />
          ) : (
            <Circle className="h-6 w-6 text-blue-500" />
          )}
          {stageInfo.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{stageInfo.description}</p>
      </CardHeader>
      <CardContent>
        {stageInfo.isLocked ? (
          <div className="text-center py-12">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">This section is locked</p>
            <p className="text-muted-foreground">
              Complete the previous stage to unlock this section
            </p>
          </div>
        ) : stageInfo.isCompleted ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Stage Completed!</p>
            <p className="text-muted-foreground">
              You have successfully completed this stage.
            </p>
            {/* {stageInfo.type === "form" && stageInfo.formUrl && (
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => window.open(stageInfo.formUrl, '_blank')}
                >
                  View Form Again
                </Button>
              </div>
            )} */}
          </div>
        ) : stageInfo.type === "form" ? (
          <div className="space-y-4">
            {stageInfo.formUrl ? (
              <>
                <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden border">
                  <iframe
                    src={stageInfo.formUrl}
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
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    After submitting the form, click the button to continue
                  </p>
                  <Button 
                    onClick={handleMarkComplete}
                    disabled={submitting}
                  >
                    {submitting ? 'Marking Complete...' : 'Mark as Complete'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No form URL configured for this stage.
                </p>
                <Button 
                  onClick={handleMarkComplete}
                  disabled={submitting}
                >
                  {submitting ? 'Marking Complete...' : 'Mark as Complete'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Course content - display all materials
          <CourseMaterials 
            courseId={courseId}
            studentEmail={studentEmail}
            selectedMaterialId={selectedMaterialId}
            onAllComplete={handleMarkComplete}
            submitting={submitting}
            onVideoSelect={handleVideoSelect}
            onQuizSelect={handleQuizSelect}
          />
        )}

        {/* Selected Video/Quiz Content */}
        {(selectedVideo || selectedQuiz) && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">
              {selectedVideo ? 'Selected Video' : 'Selected Quiz'}
            </h3>
            {selectedVideo && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Video ID: {selectedVideo.id}</p>
                <p className="text-sm text-gray-600">Title: {selectedVideo.data?.youtubeVideo?.title || selectedVideo.data?.link?.title || 'Video'}</p>
                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                  {selectedVideo.data?.youtubeVideo ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedVideo.data.youtubeVideo.id}`}
                      title={selectedVideo.data.youtubeVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : selectedVideo.data?.link ? (
                    <iframe
                      src={selectedVideo.data.link.url}
                      title={selectedVideo.data.link.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Video content not available
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedQuiz && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Quiz ID: {selectedQuiz.id}</p>
                <p className="text-sm text-gray-600">Title: {selectedQuiz.data?.form?.title || selectedQuiz.data?.link?.title || 'Quiz'}</p>
                <div className="w-full rounded-lg overflow-hidden border bg-white" style={{ height: '400px' }}>
                  {selectedQuiz.data?.form ? (
                    <iframe
                      src={selectedQuiz.data.form.formUrl}
                      title={selectedQuiz.data.form.title}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  ) : selectedQuiz.data?.link ? (
                    <iframe
                      src={selectedQuiz.data.link.url}
                      title={selectedQuiz.data.link.title}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Quiz content not available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
