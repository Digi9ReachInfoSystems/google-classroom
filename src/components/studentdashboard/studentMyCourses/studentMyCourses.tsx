"use client"

import { useState, useEffect, useRef } from "react"
import ProgressSidebar from "./modules/progress-sidebar"
import StageContent from "./modules/StageContent"
import { Button } from "@/components/ui/button"
import { BookOpen, AlertCircle } from "lucide-react"
import { useCourse } from "@/components/studentdashboard/context/CourseContext"
import { getPublicFormUrl } from "@/lib/form-utils"

export default function ClassroomPage() {
  const { selectedCourse, loadingCourses, error } = useCourse()
  const [studentEmail, setStudentEmail] = useState<string>("")
  const [stageProgress, setStageProgress] = useState<any>(null)
  const [selectedStage, setSelectedStage] = useState<string>("pre-survey")
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const [videoCompletions, setVideoCompletions] = useState<Record<string, boolean>>({})
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0)
  const [currentAssignment, setCurrentAssignment] = useState<any>(null)
  const [hierarchicalData, setHierarchicalData] = useState<any>(null)
  const currentVideoRef = useRef<string | null>(null)

  const handleVideoSelect = (videoId: string, videoData: any, assignmentData?: any) => {
    console.log('Video selected from sidebar:', videoId, videoData)
    setSelectedVideo({ id: videoId, data: videoData })
    setSelectedQuiz(null) // Clear quiz selection
    
    // Reset overlay state for new video
    setOverlayClicked(prev => ({
      ...prev,
      [videoId]: false
    }))
    
    // Update the current video ref
    currentVideoRef.current = videoId

    // Set current assignment and find video index
    if (assignmentData) {
      setCurrentAssignment(assignmentData)
      const videoIndex = assignmentData.children.videos.findIndex((v: any) => 
        v === videoData || JSON.stringify(v) === JSON.stringify(videoData)
      )
      setCurrentVideoIndex(videoIndex >= 0 ? videoIndex : 0)
    }
  }

  const handleQuizSelect = (quizId: string, quizData: any) => {
    console.log('Quiz selected from sidebar:', quizId, quizData)
    setSelectedQuiz({ id: quizId, data: quizData })
    setSelectedVideo(null) // Clear video selection
  }

  // Set up form submission detection for Google Forms
  const setupFormSubmissionDetection = (quizId: string) => {
    console.log('Setting up form submission detection for quiz:', quizId);
    
    let isSubmitted = false; // Prevent multiple submissions
    
    // Method 1: Listen for postMessage events from Google Forms
    const handleMessage = (event: MessageEvent) => {
      if (isSubmitted) return; // Prevent duplicate submissions
      
      console.log('Message received from iframe:', event.origin, event.data);
      
      // Check if message is from Google Forms
      if (event.origin.includes('docs.google.com') || event.origin.includes('forms.gle')) {
        const data = event.data;
        
        // Check for various submission indicators
        if (typeof data === 'string') {
          if (data.includes('submit') || data.includes('response') || data.includes('complete') || 
              data.includes('thank') || data.includes('success') || data.includes('formResponse')) {
            console.log('Form submission detected via message:', data);
            isSubmitted = true;
            handleQuizSubmit(quizId);
            return;
          }
        }
        
        // Check for object data
        if (typeof data === 'object' && data !== null) {
          const dataStr = JSON.stringify(data).toLowerCase();
          if (dataStr.includes('submit') || dataStr.includes('response') || dataStr.includes('complete') ||
              dataStr.includes('thank') || dataStr.includes('success')) {
            console.log('Form submission detected via object message:', data);
            isSubmitted = true;
            handleQuizSubmit(quizId);
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
            console.log('Form submission detected via URL change:', currentUrl);
            isSubmitted = true;
            handleQuizSubmit(quizId);
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
          console.log('Form submission detected via iframe load:', src);
          isSubmitted = true;
          handleQuizSubmit(quizId);
        }
      }
    };
    
    // Method 4: Listen for click events on the iframe (user clicking submit)
    const handleIframeClick = () => {
      console.log('Click detected on iframe, user might be submitting form');
      // Give a delay to allow form submission to complete
      setTimeout(() => {
        if (isSubmitted) return;
        
        const iframe = document.querySelector('iframe[src*="docs.google.com/forms"]') as HTMLIFrameElement;
        if (iframe) {
          const src = iframe.src;
          if (src.includes('formResponse') || src.includes('thank')) {
            console.log('Form submission detected via click + URL check:', src);
            isSubmitted = true;
            handleQuizSubmit(quizId);
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

  // Auto-detect quiz completion when form is submitted
  const handleQuizSubmit = (quizId: string) => {
    console.log('Quiz submitted:', quizId, 'Current assignment:', currentAssignment?.id)
    // Mark quiz as completed
    setVideoCompletions(prev => {
      const newCompletions = {
        ...prev,
        [quizId]: true
      }
      console.log('Updated quiz completions:', newCompletions)
      return newCompletions
    })
    
    // Also save to database
    if (selectedCourse?.id && currentAssignment) {
      console.log('Saving quiz completion to database:', { quizId, courseId: selectedCourse.id, assignmentId: currentAssignment.id })
      markVideoComplete(quizId, true)
    }
  }

  // Handle manual quiz completion with disclaimer
  const handleManualQuizSubmit = (quizId: string) => {
    setPendingQuizId(quizId)
    setShowQuizDisclaimer(true)
  }


  const handleConfirmQuizComplete = async () => {
    if (!pendingQuizId) return
    
    setSubmitting(true)
    try {
      console.log('🎯 Manually marking quiz as complete:', pendingQuizId)
      console.log('📊 Current state before completion:', {
        pendingQuizId,
        currentAssignment: currentAssignment?.id,
        videoCompletions: Object.keys(videoCompletions).filter(k => videoCompletions[k])
      })
      
      // Mark quiz as completed locally
      setVideoCompletions(prev => {
        const newCompletions = {
          ...prev,
          [pendingQuizId]: true
        }
        console.log('Updated quiz completions:', newCompletions)
        saveVideoCompletions(newCompletions)
        return newCompletions
      })
      
      // Save to database using the same API as CourseMaterials
      if (selectedCourse?.id && currentAssignment) {
        console.log('Saving quiz completion to database:', { quizId: pendingQuizId, courseId: selectedCourse.id, assignmentId: currentAssignment.id })
        
        try {
          // Use the same API endpoint as CourseMaterials for consistency
          const response = await fetch('/api/student/mark-material-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: selectedCourse.id,
              courseWorkId: pendingQuizId
            })
          })

          const data = await response.json()
          console.log('📡 Quiz completion API response:', data)

          if (data.success) {
            console.log(`✅ Quiz ${pendingQuizId} marked as complete successfully`)
            
            // Save learning module progress
            const moduleId = currentAssignment.id
            const currentProgress = learningModuleProgress[moduleId] || {}
            const updatedProgress = {
              ...currentProgress,
              completedQuizzes: [...(currentProgress.completedQuizzes || []), pendingQuizId],
              lastCompletedQuiz: pendingQuizId,
              completedAt: new Date().toISOString()
            }
            saveLearningModuleProgress(moduleId, updatedProgress)
            
            // Refresh stage progress to update UI
            await fetchStageProgress()
          } else {
            console.error('❌ Failed to mark quiz complete:', data)
          }
        } catch (error) {
          console.error('❌ Error marking quiz complete:', error)
        }
      }
      
      // Close disclaimer
      setShowQuizDisclaimer(false)
      setPendingQuizId(null)
    } catch (error) {
      console.error('Error marking quiz complete:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const markVideoComplete = async (videoId: string, completed: boolean) => {
    if (!selectedCourse?.id || !currentAssignment) return

    try {
      console.log('Marking video complete:', { 
        videoId, 
        completed, 
        courseId: selectedCourse.id, 
        assignmentId: currentAssignment.id,
        currentVideoRef: currentVideoRef.current
      })
      const response = await fetch('/api/student/video-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          videoId: videoId,
          assignmentId: currentAssignment.id,
          completed: completed
        })
      })

      const data = await response.json()
      console.log('Mark video complete response:', data)
      if (data.success) {
        // Update local state
        setVideoCompletions(prev => {
          const newCompletions = {
            ...prev,
            [videoId]: completed
          }
          console.log('Updated local video completions:', newCompletions)
          saveVideoCompletions(newCompletions)
          return newCompletions
        })

        // Save learning module progress for videos
        if (completed && videoId.startsWith('video-')) {
          const moduleId = currentAssignment.id
          const currentProgress = learningModuleProgress[moduleId] || {}
          const updatedProgress = {
            ...currentProgress,
            completedVideos: [...(currentProgress.completedVideos || []), videoId],
            lastCompletedVideo: videoId,
            completedAt: new Date().toISOString()
          }
          saveLearningModuleProgress(moduleId, updatedProgress)

          // Just refresh stage progress to update UI
          console.log('🔄 Refreshing stage progress after video completion...')
          await fetchStageProgress()
        }
      }
    } catch (error) {
      console.error('Error marking video complete:', error)
    }
  }

  // Manual trigger for video tracking and YouTube play
  const startVideoTracking = (videoId: string) => {
    console.log('Starting video tracking and YouTube autoplay:', videoId);
    
    // Start video tracking
    setVideoPlayStates(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        isPlaying: true,
        startTime: Date.now()
      }
    }));
    
    // Hide the overlay and trigger autoplay
    setOverlayClicked(prev => ({
      ...prev,
      [videoId]: true
    }));
  };

  // Track video play state and completion
  const [videoPlayStates, setVideoPlayStates] = useState<Record<string, { isPlaying: boolean; startTime: number; watchedDuration: number; videoDuration: number }>>({})
  const [videoTimers, setVideoTimers] = useState<Record<string, NodeJS.Timeout>>({})
  const [overlayClicked, setOverlayClicked] = useState<Record<string, boolean>>({})
  const [showQuizDisclaimer, setShowQuizDisclaimer] = useState(false)
  const [pendingQuizId, setPendingQuizId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [learningModuleProgress, setLearningModuleProgress] = useState<Record<string, any>>({})

  // Load learning module progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`learningModuleProgress_${studentEmail}`)
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress)
        setLearningModuleProgress(parsed)
        console.log('Loaded learning module progress:', parsed)
        
        // Restore video completions from localStorage
        const savedVideoCompletions = localStorage.getItem(`videoCompletions_${studentEmail}`)
        if (savedVideoCompletions) {
          try {
            const parsedCompletions = JSON.parse(savedVideoCompletions)
            setVideoCompletions(parsedCompletions)
            console.log('Loaded video completions from localStorage:', parsedCompletions)
          } catch (error) {
            console.error('Error loading video completions:', error)
          }
        }
        
        // Restore last viewed module
        restoreLastViewedModule()
      } catch (error) {
        console.error('Error loading learning module progress:', error)
      }
    }
  }, [studentEmail])

  // Save learning module progress to localStorage
  const saveLearningModuleProgress = (moduleId: string, progress: any) => {
    const newProgress = {
      ...learningModuleProgress,
      [moduleId]: {
        ...learningModuleProgress[moduleId],
        ...progress,
        lastUpdated: new Date().toISOString()
      }
    }
    setLearningModuleProgress(newProgress)
    localStorage.setItem(`learningModuleProgress_${studentEmail}`, JSON.stringify(newProgress))
    console.log('Saved learning module progress:', newProgress)
  }

  // Save video completions to localStorage
  const saveVideoCompletions = (completions: Record<string, boolean>) => {
    localStorage.setItem(`videoCompletions_${studentEmail}`, JSON.stringify(completions))
    console.log('Saved video completions to localStorage:', completions)
  }

  // Restore last viewed module from localStorage
  const restoreLastViewedModule = () => {
    const savedProgress = localStorage.getItem(`learningModuleProgress_${studentEmail}`)
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress)
        // Find the module with the most recent activity
        let lastModule = null
        let lastActivity = null
        
        Object.entries(parsed).forEach(([moduleId, progress]: [string, any]) => {
          if (progress.completedAt && (!lastActivity || new Date(progress.completedAt) > new Date(lastActivity))) {
            lastModule = moduleId
            lastActivity = progress.completedAt
          }
        })
        
        if (lastModule) {
          console.log('Restoring last viewed module:', lastModule)
          // You can add logic here to automatically select the last viewed module
          // For now, we'll just log it
        }
      } catch (error) {
        console.error('Error restoring last viewed module:', error)
      }
    }
  }

  // Start completion timer when video starts playing
  useEffect(() => {
    if (!selectedVideo || videoCompletions[selectedVideo.id]) return;

    const videoId = selectedVideo.id;
    const playState = videoPlayStates[videoId];
    
    if (playState?.isPlaying && !videoTimers[videoId]) {
      console.log('Video started playing - starting completion timer:', videoId);
      
      // Clear any existing timer
      if (videoTimers[videoId]) {
        clearTimeout(videoTimers[videoId]);
      }

      const timer = setTimeout(() => {
        const currentPlayState = videoPlayStates[videoId];
        if (currentPlayState?.isPlaying && currentVideoRef.current === videoId && !videoCompletions[videoId]) {
          console.log('Video completion timer reached - marking as complete:', videoId);
          markVideoComplete(videoId, true);
        }
      }, 30000); // 30 seconds

      setVideoTimers(prev => ({
        ...prev,
        [videoId]: timer
      }));
    }
  }, [videoPlayStates, selectedVideo?.id, videoCompletions, videoTimers]);

  const navigateToNextVideo = () => {
    if (!currentAssignment || !currentAssignment.children.videos) return
    
    const nextIndex = currentVideoIndex + 1
    if (nextIndex < currentAssignment.children.videos.length) {
      const nextVideo = currentAssignment.children.videos[nextIndex]
      const nextVideoId = `video-${currentAssignment.id}-${nextIndex}`
      setCurrentVideoIndex(nextIndex)
      setSelectedVideo({
        id: nextVideoId,
        data: nextVideo
      })
      currentVideoRef.current = nextVideoId
    }
  }

  const navigateToQuiz = () => {
    if (!currentAssignment || !currentAssignment.children.quizzes) return
    
    // Select the first quiz in the assignment
    const firstQuiz = currentAssignment.children.quizzes[0]
    if (firstQuiz) {
      const quizId = `quiz-${currentAssignment.id}-0`
      setSelectedQuiz({ id: quizId, data: firstQuiz })
      setSelectedVideo(null)
    }
  }

  // Check if all videos in current assignment are completed
  const areAllVideosCompleted = () => {
    if (!currentAssignment || !currentAssignment.children.videos) return false
    
    return currentAssignment.children.videos.every((_: any, index: number) => {
      const videoId = `video-${currentAssignment.id}-${index}`
      return videoCompletions[videoId] === true
    })
  }

  const navigateToPreviousVideo = () => {
    if (!currentAssignment || !currentAssignment.children.videos) return
    
    const prevIndex = currentVideoIndex - 1
    if (prevIndex >= 0) {
      const prevVideo = currentAssignment.children.videos[prevIndex]
      const prevVideoId = `video-${currentAssignment.id}-${prevIndex}`
      setCurrentVideoIndex(prevIndex)
      setSelectedVideo({
        id: prevVideoId,
        data: prevVideo
      })
      currentVideoRef.current = prevVideoId
    }
  }

  const fetchVideoCompletions = async (assignmentId: string) => {
    if (!selectedCourse?.id) return

    try {
      console.log('Fetching video completions for assignment:', assignmentId)
      const response = await fetch(`/api/student/video-completion?courseId=${selectedCourse.id}&assignmentId=${assignmentId}`)
      const data = await response.json()
      console.log('Video completions response:', data)
      if (data.success) {
        // Merge with existing completions instead of replacing
        setVideoCompletions(prev => {
          const newCompletions = {
            ...prev,
            ...data.completions
          }
          console.log('Updated video completions:', newCompletions)
          return newCompletions
        })
      }
    } catch (error) {
      console.error('Error fetching video completions:', error)
    }
  }

  // Handle hierarchical data from sidebar
  const handleHierarchicalDataChange = (data: any) => {
    console.log('Hierarchical data changed:', data)
    setHierarchicalData(data)
    
    if (data?.learningModules?.children && selectedCourse?.id) {
      // Fetch completions for all assignments (includes videos, resources, and quizzes)
      data.learningModules.children.forEach((assignment: any) => {
        if (assignment.id) {
          fetchVideoCompletions(assignment.id)
        }
      })
      
      // Auto-select the first assignment if we're in the learning modules stage and no assignment is selected
      if (selectedStage === 'course' && data.learningModules.children.length > 0) {
        const firstAssignment = data.learningModules.children[0]
        console.log('Auto-selecting first assignment:', firstAssignment.id, firstAssignment.title)
        setSelectedMaterialId(firstAssignment.id)
        
        // Also set the current assignment for video navigation
        setCurrentAssignment(firstAssignment)
      }
    }
  }

  // Helper function to check if a stage is completed
  const isStageCompleted = (stage: string) => {
    if (!stageProgress) return false;
    
    switch (stage) {
      case 'pre-survey':
        return stageProgress.preSurveyCompleted;
      case 'post-survey':
        return stageProgress.postSurveyCompleted;
      case 'ideas':
        return stageProgress.ideasCompleted;
      case 'course':
        // Course stage should never be hidden - learning modules should always be accessible
        return false;
      default:
        return false;
    }
  }

  // Helper function to get stage title
  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'pre-survey':
        return 'Pre-Survey';
      case 'post-survey':
        return 'Post-Survey';
      case 'ideas':
        return 'Ideas';
      case 'course':
        return 'Course Content';
      default:
        return 'Stage';
    }
  }

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

  // Auto-select first assignment when switching to learning modules stage
  useEffect(() => {
    if (selectedStage === 'course' && hierarchicalData?.learningModules?.children?.length > 0) {
      const firstAssignment = hierarchicalData.learningModules.children[0]
      console.log('Stage changed to course, auto-selecting first assignment:', firstAssignment.id, firstAssignment.title)
      setSelectedMaterialId(firstAssignment.id)
      setCurrentAssignment(firstAssignment)
    }
  }, [selectedStage, hierarchicalData])

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
            {/* Only show StageContent if the current stage is not completed */}
            {!isStageCompleted(selectedStage) && (
              <StageContent
                courseId={selectedCourse.id}
                studentEmail={studentEmail}
                selectedStage={selectedStage}
                stageProgress={stageProgress}
                selectedMaterialId={selectedMaterialId}
                onStageComplete={fetchStageProgress}
                loading={loadingProgress}
                learningModuleProgress={learningModuleProgress}
                videoCompletions={videoCompletions}
              />
            )}
            
            {/* Show completion message for completed stages */}
            {isStageCompleted(selectedStage) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getStageTitle(selectedStage)} Completed!
                </h3>
                <p className="text-gray-600 mb-4">
                  You have successfully completed this stage. Great work!
                </p>
              </div>
            )}

            {/* Selected Video/Quiz Content from Sidebar */}
            {(selectedVideo || selectedQuiz) && (
              <div className="mt-6 p-6 border rounded-lg bg-gray-50">
                {selectedVideo && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Title: {selectedVideo.data?.youtubeVideo?.title || selectedVideo.data?.link?.title || 'Video'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Video {currentVideoIndex + 1} of {currentAssignment?.children?.videos?.length || 1}
                        </span>
                        {videoCompletions[selectedVideo.id] ? (
                          <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                        ) : videoPlayStates[selectedVideo.id]?.isPlaying ? (
                          <span className="text-xs text-blue-600 font-medium">▶️ Playing</span>
                        ) : videoPlayStates[selectedVideo.id] ? (
                          <span className="text-xs text-orange-600 font-medium">⏸️ Paused</span>
                        ) : (
                          <span className="text-xs text-gray-500">⏸️ Not Started</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="aspect-video w-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg relative">
                      {selectedVideo.data?.youtubeVideo ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${selectedVideo.data.youtubeVideo.id}?enablejsapi=1&origin=${window.location.origin}&autoplay=${overlayClicked[selectedVideo.id] ? '1' : '0'}`}
                          title={selectedVideo.data.youtubeVideo.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                          id={`youtube-player-${selectedVideo.id}`}
                        />
                      ) : selectedVideo.data?.link ? (
                        <iframe
                          src={selectedVideo.data.link.url}
                          title={selectedVideo.data.link.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : selectedVideo.data?.driveFile ? (
                        <iframe
                          src={selectedVideo.data.driveFile.alternateLink || selectedVideo.data.driveFile.driveFile?.alternateLink}
                          title={selectedVideo.data.driveFile.title || selectedVideo.data.driveFile.driveFile?.title || 'Google Drive Video'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          Video content not available
                        </div>
                      )}
                      
                      {/* Clickable overlay to start video tracking */}
                      {!videoPlayStates[selectedVideo.id]?.isPlaying && !videoCompletions[selectedVideo.id] && !overlayClicked[selectedVideo.id] && (
                        <div 
                          className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-all duration-200"
                          onClick={() => startVideoTracking(selectedVideo.id)}
                        >
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg hover:scale-105 transition-transform duration-200">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>


                    {/* Video Controls */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={navigateToPreviousVideo}
                        variant="outline"
                        size="sm"
                        disabled={currentVideoIndex === 0}
                      >
                        ← Previous
                      </Button>
                      <Button
                        onClick={navigateToNextVideo}
                        variant="default"
                        size="sm"
                        disabled={
                          !currentAssignment?.children?.videos || 
                          currentVideoIndex >= currentAssignment.children.videos.length - 1 ||
                          !videoCompletions[selectedVideo.id] // Can't go to next until current is completed
                        }
                      >
                        Next →
                      </Button>
                      
                      {/* Go to Quiz button - shows when all videos are completed */}
                      {areAllVideosCompleted() && currentAssignment?.children?.quizzes && currentAssignment.children.quizzes.length > 0 && (
                        <Button
                          onClick={navigateToQuiz}
                          variant="secondary"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          📝 Go to Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {selectedQuiz && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Title: {selectedQuiz.data?.form?.title || selectedQuiz.data?.link?.title || 'Quiz'}
                      </p>
                      <div className="flex items-center gap-2">
                        {videoCompletions[selectedQuiz.id] && (
                          <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg bg-white" style={{ height: '500px' }}>
                      {selectedQuiz.data?.form ? (
                        <iframe
                          src={getPublicFormUrl(selectedQuiz.data.form.formUrl)}
                          title={selectedQuiz.data.form.title}
                          className="w-full h-full border-0"
                          loading="lazy"
                          onLoad={() => {
                            console.log('Quiz iframe loaded, setting up form submission detection');
                            // Set up multiple detection methods for form submission
                            setupFormSubmissionDetection(selectedQuiz.id);
                          }}
                        />
                      ) : selectedQuiz.data?.link ? (
                        <iframe
                          src={selectedQuiz.data.link.url}
                          title={selectedQuiz.data.link.title}
                          className="w-full h-full border-0"
                          loading="lazy"
                          onLoad={() => {
                            console.log('Quiz iframe loaded, setting up form submission detection');
                            // Set up multiple detection methods for form submission
                            setupFormSubmissionDetection(selectedQuiz.id);
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          Quiz content not available
                        </div>
                      )}
                    </div>

                    {/* Quiz completion status and manual completion button */}
                    <div className="flex items-center justify-center gap-2">
                      {!videoCompletions[selectedQuiz.id] && (
                        <Button
                          onClick={() => handleManualQuizSubmit(selectedQuiz.id)}
                          variant="outline"
                          size="sm"
                        >
                          Mark Quiz as Completed
                        </Button>
                      )}
                      {videoCompletions[selectedQuiz.id] && (
                        <div className="text-center">
                          <p className="text-sm text-green-600 font-medium">✓ Quiz Completed Successfully!</p>
                          <p className="text-xs text-gray-500 mt-1">Great job on completing this quiz.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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
          onVideoSelect={handleVideoSelect}
          onQuizSelect={handleQuizSelect}
          onAssignmentSelect={fetchVideoCompletions}
          videoCompletions={videoCompletions}
          onHierarchicalDataChange={handleHierarchicalDataChange}
        />
          </div>
        </div>
      </div>

      {/* Quiz Disclaimer Modal */}
      {showQuizDisclaimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Complete Quiz?</h3>
                <p className="text-sm text-gray-600">Make sure you've submitted the quiz form</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Have you already submitted the quiz form? If not, please complete the quiz first before marking it as done.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowQuizDisclaimer(false)
                  setPendingQuizId(null)
                }}
                variant="outline"
                size="sm"
              >
                Go Back to Quiz
              </Button>
              <Button
                onClick={handleConfirmQuizComplete}
                disabled={submitting}
                className="px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                size="sm"
              >
                {submitting ? 'Completing...' : 'Mark Complete Anyway'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
