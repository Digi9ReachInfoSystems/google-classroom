"use client"

import { useState, useEffect } from "react"
import { Lock, CheckCircle, Circle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CourseMaterials from "./CourseMaterials"
import { getPublicFormUrl } from "@/lib/form-utils"

interface StageContentProps {
  courseId: string
  studentEmail: string
  selectedStage: string
  stageProgress: any
  selectedMaterialId?: string | null
  onStageComplete: () => void
  loading: boolean
  learningModuleProgress?: Record<string, any>
  videoCompletions?: Record<string, boolean>
}

export default function StageContent({
  courseId,
  studentEmail,
  selectedStage,
  stageProgress,
  selectedMaterialId,
  onStageComplete,
  loading,
  learningModuleProgress,
  videoCompletions
}: StageContentProps) {
  const [submitting, setSubmitting] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  // Reset form submitted state when stage changes
  useEffect(() => {
    setFormSubmitted(false)
    setShowDisclaimer(false)
  }, [selectedStage])

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

  // Set up form submission detection for Google Forms in stage content
  const setupFormSubmissionDetection = () => {
    console.log('Setting up form submission detection for stage form');
    
    let isSubmitted = false; // Prevent multiple submissions
    
    // Method 1: Listen for postMessage events from Google Forms
    const handleMessage = (event: MessageEvent) => {
      if (isSubmitted) return; // Prevent duplicate submissions
      
      console.log('Stage form message received from iframe:', event.origin, event.data);
      
      // Check if message is from Google Forms
      if (event.origin.includes('docs.google.com') || event.origin.includes('forms.gle')) {
        const data = event.data;
        
        // Check for various submission indicators
        if (typeof data === 'string') {
          if (data.includes('submit') || data.includes('response') || data.includes('complete') || 
              data.includes('thank') || data.includes('success') || data.includes('formResponse')) {
            console.log('Stage form submission detected via message:', data);
            isSubmitted = true;
            setFormSubmitted(true);
            // Auto-mark stage as complete when form is submitted
            handleMarkComplete();
            return;
          }
        }
        
        // Check for object data
        if (typeof data === 'object' && data !== null) {
          const dataStr = JSON.stringify(data).toLowerCase();
          if (dataStr.includes('submit') || dataStr.includes('response') || dataStr.includes('complete') ||
              dataStr.includes('thank') || dataStr.includes('success')) {
            console.log('Stage form submission detected via object message:', data);
            isSubmitted = true;
            setFormSubmitted(true);
            // Auto-mark stage as complete when form is submitted
            handleMarkComplete();
            return;
          }
        }
      }
    };
    
    // Method 2: Poll for URL changes in the iframe (Google Forms redirect after submission)
    let lastUrl = '';
    const pollForUrlChange = () => {
      if (isSubmitted) return; // Prevent duplicate submissions
      
      const iframe = document.querySelector('iframe[src*="docs.google.com/forms"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          const currentUrl = iframe.contentWindow.location.href;
          if (currentUrl !== lastUrl && (currentUrl.includes('formResponse') || currentUrl.includes('thank'))) {
            console.log('Stage form submission detected via URL change:', currentUrl);
            isSubmitted = true;
            setFormSubmitted(true);
            // Auto-mark stage as complete when form is submitted
            handleMarkComplete();
            return;
          }
          lastUrl = currentUrl;
        } catch (e) {
          // Cross-origin access blocked, this is expected
        }
      }
    };
    
    // Method 3: Listen for iframe load events (Google Forms redirect after submission)
    const handleIframeLoad = () => {
      if (isSubmitted) return; // Prevent duplicate submissions
      
      const iframe = document.querySelector('iframe[src*="docs.google.com/forms"]') as HTMLIFrameElement;
      if (iframe) {
        const src = iframe.src;
        if (src.includes('formResponse') || src.includes('thank')) {
          console.log('Stage form submission detected via iframe load:', src);
          isSubmitted = true;
          setFormSubmitted(true);
          // Auto-mark stage as complete when form is submitted
          handleMarkComplete();
        }
      }
    };
    
    // Method 4: Listen for click events on the iframe (user clicking submit)
    const handleIframeClick = () => {
      console.log('Click detected on stage form iframe, user might be submitting form');
      // Give a delay to allow form submission to complete
      setTimeout(() => {
        if (isSubmitted) return;
        
        const iframe = document.querySelector('iframe[src*="docs.google.com/forms"]') as HTMLIFrameElement;
        if (iframe) {
          const src = iframe.src;
          if (src.includes('formResponse') || src.includes('thank')) {
            console.log('Stage form submission detected via click + URL check:', src);
            isSubmitted = true;
            setFormSubmitted(true);
            // Auto-mark stage as complete when form is submitted
            handleMarkComplete();
          }
        }
      }, 3000); // Wait 3 seconds for form submission to complete
    };
    
    // Add event listeners
    window.addEventListener('message', handleMessage);
    
    // Poll for URL changes every 1 second (more frequent for better detection)
    const urlPollInterval = setInterval(pollForUrlChange, 1000);
    
    // Listen for iframe events
    const iframe = document.querySelector('iframe[src*="docs.google.com/forms"]') as HTMLIFrameElement;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      iframe.addEventListener('click', handleIframeClick);
    }
    
    // Clean up function
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(urlPollInterval);
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
        iframe.removeEventListener('click', handleIframeClick);
      }
    };
  };

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
    // For form stages, show disclaimer if form hasn't been submitted
    if (stageInfo?.type === 'form' && !formSubmitted) {
      setShowDisclaimer(true)
      return
    }

    try {
      setSubmitting(true)
      setFormSubmitted(true) // Mark form as submitted when manually completing
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
      setFormSubmitted(false) // Reset if there was an error
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmComplete = async () => {
    setShowDisclaimer(false)
    
    try {
      setSubmitting(true)
      setFormSubmitted(true) // Mark form as submitted when manually completing
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
      setFormSubmitted(false) // Reset if there was an error
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
                    src={getPublicFormUrl(stageInfo.formUrl)}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    className="w-full h-full"
                    onLoad={() => {
                      console.log('Stage form iframe loaded, setting up form submission detection');
                      setupFormSubmissionDetection();
                    }}
                  >
                    Loading…
                  </iframe>
                </div>
                <div className="flex justify-between items-center">
                  {!formSubmitted ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {/* Form will be automatically marked as complete when submitted. Use the button below if needed. */}
                      </p>
                      <Button 
                        onClick={handleMarkComplete}
                        disabled={submitting}
                        variant="outline"
                      >
                        {submitting ? 'Marking Complete...' : 'Mark as Complete'}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <p className="text-sm font-medium">
                        Form submitted successfully! Stage will be marked as complete automatically.
                      </p>
                    </div>
                  )}
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
            learningModuleProgress={learningModuleProgress}
            videoCompletions={videoCompletions}
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
                      src={getPublicFormUrl(selectedQuiz.data.form.formUrl)}
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

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Form Submission Required
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                <strong>Important:</strong> Without actually submitting the Google Form, the {stageInfo?.title} stage remains due and the next stage will not unlock.
              </p>
              <p className="text-sm text-gray-600">
                Please make sure to:
              </p>
              <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc">
                <li>Fill out all required fields in the form</li>
                <li>Click the "Submit" button within the Google Form</li>
                <li>Wait for the form submission confirmation</li>
              </ul>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDisclaimer(false)}
                className="px-4"
              >
                Go Back to Form
              </Button>
              <Button
                onClick={handleConfirmComplete}
                disabled={submitting}
                className="px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? 'Completing...' : 'Mark Complete Anyway'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
