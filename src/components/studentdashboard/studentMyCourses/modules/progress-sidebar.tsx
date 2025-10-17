"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface ModuleItem {
  id: string
  title: string
  completed: boolean
  locked?: boolean
  route?: string
  type?: 'assignment' | 'material' | 'video' | 'quiz' | 'resource'
  dueDate?: string
  maxPoints?: number
  assignedGrade?: number
  children?: ModuleItem[]
}

interface ProgressModule {
  id: string
  title: string
  subtitle?: string
  status: "completed" | "current" | "locked"
  videoCount: number
  expanded?: boolean
  items?: ModuleItem[]
  children?: ProgressModule[]
}

interface HierarchicalData {
  learningModules: {
    id: string
    title: string
    type: string
    children: Array<{
      id: string
      title: string
      type: string
      children: Array<{
        id: string
        title: string
        description?: string
        workType: string
        materials: any[]
        submission: any
        maxPoints?: number
        dueDate?: string
        type: string
        children: {
          videos: any[]
          quizzes: any[]
          resources: any[]
        }
      }>
    }>
  }
}

interface Course {
  id: string
  name: string
  section?: string
  description?: string
  room?: string
}

interface CourseworkData {
  course: Course
  courseWork: any[]
  submissions: any[]
}

interface ProgressSidebarProps {
  selectedCourse?: any
  stageProgress: any
  selectedStage: string
  onStageSelect: (stageId: string) => void
  onMaterialSelect?: (materialId: string) => void
  onVideoSelect?: (videoId: string, videoData: any, assignmentData?: any) => void
  onQuizSelect?: (quizId: string, quizData: any) => void
  onAssignmentSelect?: (assignmentId: string) => void
  videoCompletions?: Record<string, boolean>
  onHierarchicalDataChange?: (data: any) => void
}

const ProgressSidebar = ({ selectedCourse, stageProgress, selectedStage, onStageSelect, onMaterialSelect, onVideoSelect, onQuizSelect, onAssignmentSelect, videoCompletions = {}, onHierarchicalDataChange }: ProgressSidebarProps) => {
  const router = useRouter()
  const [modules, setModules] = useState<ProgressModule[]>([])
  const [courseMaterials, setCourseMaterials] = useState<any[]>([])
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['course'])) // Default expand Learning modules
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set())

  // Fetch course materials when course is selected
  useEffect(() => {
    if (selectedCourse?.id) {
      fetchCourseMaterials()
      fetchHierarchicalData()
    }
  }, [selectedCourse])

  // Helper function to extract module number from title
  const extractModuleNumber = (title: string): number => {
    // Try various patterns to extract module number
    const patterns = [
      /(?:module|mod)\s*(\d+)/i,           // "Module 1", "Mod 2", etc.
      /^(\d+)[\s\-\.]/i,                   // "1 - Title", "2. Title", etc.
      /lesson\s*(\d+)/i,                   // "Lesson 1", etc.
      /chapter\s*(\d+)/i,                  // "Chapter 1", etc.
      /unit\s*(\d+)/i,                     // "Unit 1", etc.
      /part\s*(\d+)/i,                     // "Part 1", etc.
      /section\s*(\d+)/i,                  // "Section 1", etc.
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    // Default to 999 for non-module items (will appear at the end)
    return 999;
  };

  const fetchCourseMaterials = async () => {
    try {
      const response = await fetch(`/api/student/coursework?courseId=${selectedCourse.id}`)
      const data = await response.json()

      console.log('Fetched coursework:', data)

      if (data.success) {
        // Filter out survey and idea assignments
        const materials = data.coursework.filter((item: any) => {
          const title = item.title?.toLowerCase() || ''
          return !title.includes('survey') && !title.includes('idea')
        })
        
        // Sort materials by module number
        const sortedMaterials = materials.sort((a: any, b: any) => {
          const aModuleNumber = extractModuleNumber(a.title || '');
          const bModuleNumber = extractModuleNumber(b.title || '');
          
          // Sort by module number first, then by title for non-module items
          if (aModuleNumber !== bModuleNumber) {
            return aModuleNumber - bModuleNumber;
          }
          // If module numbers are the same (or both are 999), sort alphabetically
          return (a.title || '').localeCompare(b.title || '');
        });
        
        console.log('Filtered and sorted materials for sidebar:', sortedMaterials)
        setCourseMaterials(sortedMaterials)
      }
    } catch (err) {
      console.error('Error fetching course materials:', err)
    }
  }

  const fetchHierarchicalData = async () => {
    try {
      console.log('Fetching hierarchical data for course:', selectedCourse.id)
      const response = await fetch(`/api/student/coursework-hierarchical?courseId=${selectedCourse.id}`)
      const data = await response.json()

      console.log('Fetched hierarchical data:', data)

      if (data.success) {
        console.log('Setting hierarchical data:', data.hierarchicalData)
        
        // Sort hierarchical data if it exists
        let sortedHierarchicalData = data.hierarchicalData;
        if (sortedHierarchicalData?.learningModules?.children) {
          sortedHierarchicalData = {
            ...sortedHierarchicalData,
            learningModules: {
              ...sortedHierarchicalData.learningModules,
              children: sortedHierarchicalData.learningModules.children.sort((a: any, b: any) => {
                const aModuleNumber = extractModuleNumber(a.title || '');
                const bModuleNumber = extractModuleNumber(b.title || '');
                
                // Sort by module number first, then by title for non-module items
                if (aModuleNumber !== bModuleNumber) {
                  return aModuleNumber - bModuleNumber;
                }
                // If module numbers are the same (or both are 999), sort alphabetically
                return (a.title || '').localeCompare(b.title || '');
              })
            }
          };
        }
        
        setHierarchicalData(sortedHierarchicalData)
        // Notify parent component about the hierarchical data
        if (onHierarchicalDataChange) {
          onHierarchicalDataChange(sortedHierarchicalData)
        }
      } else {
        console.error('Failed to fetch hierarchical data:', data.message)
      }
    } catch (err) {
      console.error('Error fetching hierarchical data:', err)
    }
  }

  // Update modules based on stage progress
  useEffect(() => {
    if (stageProgress) {
      // Create items for Learning modules
      const learningModuleItems: ModuleItem[] = courseMaterials.map(material => ({
        id: material.id,
        title: material.title,
        completed: material.submission?.state === 'TURNED_IN',
        type: material.materials?.[0]?.youtubeVideo ? 'video' : 'assignment',
        maxPoints: material.maxPoints,
        assignedGrade: material.submission?.assignedGrade
      }))

      const stageModules: ProgressModule[] = [
        {
          id: "pre-survey",
          title: "Pre Survey",
          status: stageProgress.preSurveyCompleted ? "completed" : "current",
          videoCount: 1,
          expanded: selectedStage === "pre-survey",
        },
        {
          id: "course",
          title: "Learning modules",
          subtitle: "Course materials",
          status: !stageProgress.preSurveyCompleted 
            ? "locked" 
            : stageProgress.courseCompleted 
            ? "completed" 
            : "current",
          videoCount: courseMaterials.length,
          expanded: selectedStage === "course",
          items: learningModuleItems
        },
        {
          id: "ideas",
          title: "Idea Submission",
          status: !stageProgress.courseCompleted 
            ? "locked" 
            : stageProgress.ideasCompleted 
            ? "completed" 
            : "current",
          videoCount: 1,
          expanded: selectedStage === "ideas",
        },
        {
          id: "post-survey",
          title: "Post Survey",
          status: !stageProgress.ideasCompleted 
            ? "locked" 
            : stageProgress.postSurveyCompleted 
            ? "completed" 
            : "current",
          videoCount: 1,
          expanded: selectedStage === "post-survey",
        },
      ]
      setModules(stageModules)
    } else {
      // Fallback to default modules
      setModules([
        {
          id: "pre-survey",
          title: "Pre Survey",
          status: "current",
          videoCount: 1,
          expanded: true,
        },
        {
          id: "course",
          title: "Learning modules",
          subtitle: "Course materials",
          status: "locked",
          videoCount: 0,
          expanded: false,
        },
        {
          id: "ideas",
          title: "Idea Submission",
          status: "locked",
          videoCount: 1,
          expanded: false,
        },
        {
          id: "post-survey",
          title: "Post Survey",
          status: "locked",
          videoCount: 1,
          expanded: false,
        },
      ])
    }
  }, [stageProgress, selectedStage, courseMaterials])

  const generateModulesFromCoursework = (data: CourseworkData): ProgressModule[] => {
    const { courseWork, submissions } = data
    
    // Group coursework by type or create logical modules
    const assignments = courseWork.filter(work => work.workType === 'ASSIGNMENT')
    const quizzes = courseWork.filter(work => work.workType === 'QUIZ')
    const materials = courseWork.filter(work => work.workType === 'MATERIAL')
    
    const modules: ProgressModule[] = []
    
    // Assignments module
    if (assignments.length > 0) {
      const assignmentItems: ModuleItem[] = assignments.map(work => {
        const submission = submissions.find(sub => sub.courseWorkId === work.id)
        return {
          id: work.id,
          title: work.title,
          completed: submission?.submitted || false,
          type: 'assignment',
          dueDate: work.dueDate,
          maxPoints: work.maxPoints,
          assignedGrade: submission?.assignedGrade
        }
      })
      
      modules.push({
        id: "assignments",
        title: "Assignments",
        subtitle: `${assignments.length} assignments`,
        status: assignmentItems.every(item => item.completed) ? "completed" : 
                assignmentItems.some(item => item.completed) ? "current" : "locked",
        videoCount: assignments.length,
        expanded: true,
        items: assignmentItems
      })
    }
    
    // Quizzes module
    if (quizzes.length > 0) {
      const quizItems: ModuleItem[] = quizzes.map(work => {
        const submission = submissions.find(sub => sub.courseWorkId === work.id)
        return {
          id: work.id,
          title: work.title,
          completed: submission?.submitted || false,
          type: 'assignment',
          dueDate: work.dueDate,
          maxPoints: work.maxPoints,
          assignedGrade: submission?.assignedGrade
        }
      })
      
      modules.push({
        id: "quizzes",
        title: "Quizzes",
        subtitle: `${quizzes.length} quizzes`,
        status: quizItems.every(item => item.completed) ? "completed" : 
                quizItems.some(item => item.completed) ? "current" : "locked",
        videoCount: quizzes.length,
        expanded: true,
        items: quizItems
      })
    }
    
    // Materials module
    if (materials.length > 0) {
      const materialItems: ModuleItem[] = materials.map(work => ({
        id: work.id,
        title: work.title,
        completed: false, // Materials don't have submissions
        type: 'material'
      }))
      
      modules.push({
        id: "materials",
        title: "Course Materials",
        subtitle: `${materials.length} materials`,
        status: "current",
        videoCount: materials.length,
        expanded: true,
        items: materialItems
      })
    }
    
    return modules
  }

  const handleModuleClick = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (module && module.status !== "locked") {
      // Toggle expansion
      setExpandedModules(prev => {
        const newSet = new Set(prev)
        if (newSet.has(moduleId)) {
          newSet.delete(moduleId)
        } else {
          newSet.add(moduleId)
        }
        return newSet
      })
      
      onStageSelect(moduleId)
    }
  }
  
  const toggleModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const toggleTopic = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedTopics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(topicId)) {
        newSet.delete(topicId)
      } else {
        newSet.add(topicId)
      }
      return newSet
    })
  }

  const toggleAssignment = (assignmentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedAssignments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId)
      } else {
        newSet.add(assignmentId)
      }
      return newSet
    })
  }

  // Helper function to detect YouTube URLs
  const getYouTubeEmbedUrl = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    return null;
  }

  // Helper function to check if a video is completed
  const isVideoCompleted = (videoId: string) => {
    return videoCompletions[videoId] || false;
  }

  // Helper function to check if an assignment is completed (all videos AND quizzes completed)
  const isAssignmentCompleted = (assignment: any) => {
    const videos = assignment.children?.videos || [];
    const quizzes = assignment.children?.quizzes || [];
    
    // Check if all videos are completed
    const allVideosCompleted = videos.length === 0 || videos.every((_: any, idx: number) => 
      isVideoCompleted(`video-${assignment.id}-${idx}`)
    );
    
    // Check if all quizzes are completed
    const allQuizzesCompleted = quizzes.length === 0 || quizzes.every((_: any, idx: number) => 
      isVideoCompleted(`quiz-${assignment.id}-${idx}`)
    );
    
    // Assignment is completed only if both videos and quizzes are completed
    return allVideosCompleted && allQuizzesCompleted;
  }

  // Helper function to check if an assignment is locked (previous assignment not completed)
  const isAssignmentLocked = (assignment: any, assignmentIndex: number) => {
    if (assignmentIndex === 0) {
      return false; // First assignment is never locked
    }
    
    // Check if previous assignment is completed
    const previousAssignment = hierarchicalData?.learningModules?.children[assignmentIndex - 1];
    if (!previousAssignment) {
      return false;
    }
    
    return !isAssignmentCompleted(previousAssignment);
  }

  // Helper function to check if a video is locked (previous videos not completed)
  const isVideoLocked = (videoIndex: number, assignment: any) => {
    if (videoIndex === 0) {
      return false; // First video is never locked
    }
    
    // Check if all previous videos are completed
    const videos = (assignment as any).children?.videos || [];
    for (let i = 0; i < videoIndex; i++) {
      const videoId = `video-${assignment.id}-${i}`;
      if (!isVideoCompleted(videoId)) {
        return true; // Previous video not completed, so this one is locked
      }
    }
    return false;
  }

  // Helper function to check if a quiz is locked (all videos in assignment must be completed)
  const isQuizLocked = (assignment: any) => {
    const videos = (assignment as any).children?.videos || [];
    
    // Check if all videos in this assignment are completed
    for (let i = 0; i < videos.length; i++) {
      const videoId = `video-${assignment.id}-${i}`;
      if (!isVideoCompleted(videoId)) {
        return true; // Not all videos completed, so quiz is locked
      }
    }
    return false;
  }

  // Helper function to check if a resource is locked (all previous videos must be completed)
  const isResourceLocked = (resourceIndex: number, assignment: any) => {
    const videos = (assignment as any).children?.videos || [];
    
    // Check if all videos are completed (resources come after videos)
    for (let i = 0; i < videos.length; i++) {
      const videoId = `video-${assignment.id}-${i}`;
      if (!isVideoCompleted(videoId)) {
        return true; // Not all videos completed, so resource is locked
      }
    }
    return false;
  }

  const handleItemClick = (item: ModuleItem, moduleId: string) => {
    if (item.locked) return
    
    // Notify parent component about material selection
    if (onMaterialSelect && moduleId === "course") {
      onMaterialSelect(item.id)
    }
    
    if (item.route) {
      router.push(item.route)
    }
  }

  const getStatusIcon = (status: "completed" | "current" | "locked") => {
    switch (status) {
      case "completed":
        return (
          <div className="relative flex items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-green-500 bg-white" />
            <Check className="absolute h-3 w-3 text-green-600" />
          </div>
        )
      case "current":
        return <div className="h-5 w-5 rounded-full border-2 border-green-500 bg-white" />
      case "locked":
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-white" />
    }
  }

  const getStatusStyle = (status: "completed" | "current" | "locked") => {
    switch (status) {
      case "completed":
        return "text-green-600 font-medium"
      case "current":
        return "text-foreground font-medium"
      case "locked":
        return "text-gray-400"
    }
  }

  // Render hierarchical structure if available, otherwise fallback to original structure
  const renderHierarchicalContent = () => {
    // Always render the modules, but use hierarchical data for the learning modules section if available
    return (
      <div className="space-y-6 lg:space-y-8 2xl:space-y-10">
        {modules.map((module, index) => {
          // Find the learning modules in hierarchical data
          const learningModule = hierarchicalData?.learningModules;
          
          console.log('Rendering module:', module.id, 'has hierarchical data:', !!learningModule)
          
          if (module.id === 'course' && learningModule) {
            return (
              <div key={module.id} className="relative">
                {index < modules.length - 1 && (
                  <div
                    className={`absolute left-2.5 top-8 w-px h-12 lg:h-20 ${module.status === "completed" ? "bg-green-200" : "bg-gray-200"}`}
                  ></div>
                )}

                <div className="space-y-2">
                  <div 
                    className={`flex items-start space-x-4 group ${module.status !== "locked" ? "cursor-pointer" : ""}`}
                    onClick={() => handleModuleClick(module.id)}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(module.status)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <h3 className={`text-sm font-medium ${getStatusStyle(module.status)} line-clamp-2`}>
                            {module.title}
                          </h3>
                          <button
                            onClick={(e) => toggleModule(module.id, e)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <svg 
                              className={`h-4 w-4 transition-transform ${expandedModules.has(module.id) ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        {module.subtitle && <p className="text-xs text-gray-500 mt-1">{module.subtitle}</p>}

                        <div className="flex items-center space-x-2 flex-shrink-0 sm:ml-2">
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-none">
                            {module.videoCount} {module.videoCount !== 1 ? "items" : "item"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hierarchical Content - Direct Assignments */}
                  {expandedModules.has(module.id) && module.status !== "locked" && (
                    <div className="ml-9 mt-3 lg:mt-4 space-y-3 pl-3 lg:pl-4 border-l border-gray-200">
                      {learningModule.children.map((assignment, assignmentIndex) => {
                        const isLocked = isAssignmentLocked(assignment, assignmentIndex);
                        const isCompleted = isAssignmentCompleted(assignment);
                        
                        return (
                          <div key={assignment.id} className="space-y-2">
                            {/* Assignment Header */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => !isLocked && toggleAssignment(assignment.id, e)}
                                className={`flex items-center gap-2 rounded p-1 -m-1 transition-colors ${
                                  isLocked 
                                    ? 'cursor-not-allowed opacity-50' 
                                    : 'hover:bg-gray-50'
                                }`}
                                disabled={isLocked}
                              >
                                {isLocked ? (
                                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                ) : (
                                  <svg 
                                    className={`h-4 w-4 transition-transform ${expandedAssignments.has(assignment.id) ? 'rotate-90' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                                <span 
                                  className={`text-sm ${
                                    isCompleted 
                                      ? "text-green-600 font-medium" 
                                      : isLocked
                                        ? "text-gray-400"
                                        : (assignment as any).submission?.state === 'TURNED_IN' 
                                          ? "text-green-600 font-medium" 
                                          : "text-gray-800 font-medium"
                                  } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isLocked && onMaterialSelect) {
                                      onMaterialSelect(assignment.id)
                                    }
                                  }}
                                >
                                  {assignment.title} {isCompleted && '✓'} {isLocked && '🔒'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(assignment as any).children?.videos?.length || 0 + (assignment as any).children?.quizzes?.length || 0 + (assignment as any).children?.resources?.length || 0})
                                </span>
                              </button>
                            </div>

                          {/* Assignment Content - Videos first, then Resources, then Quizzes at the end */}
                          {expandedAssignments.has(assignment.id) && (
                            <div className="ml-6 space-y-1 pl-3 border-l border-gray-100">
                              {/* Videos */}
                              {(assignment as any).children?.videos?.map((video: any, idx: number) => {
                                const videoId = `video-${assignment.id}-${idx}`;
                                const isCompleted = isVideoCompleted(videoId);
                                const isVideoLockedForThis = isVideoLocked(idx, assignment);
                                
                                // Get the title from various possible sources
                                const getVideoTitle = (video: any) => {
                                  if (video.youtubeVideo?.title) return video.youtubeVideo.title;
                                  if (video.link?.title) return video.link.title;
                                  if (video.driveFile?.title) return video.driveFile.title;
                                  if (video.driveFile?.driveFile?.title) return video.driveFile.driveFile.title;
                                  return `Video ${idx + 1}`;
                                };

                                const videoTitle = getVideoTitle(video);

                                return (
                                  <div 
                                    key={videoId} 
                                    className={`flex items-center gap-2 rounded p-1 -m-1 transition-colors ${
                                      isLocked || isVideoLockedForThis
                                        ? 'cursor-not-allowed opacity-50' 
                                        : 'cursor-pointer hover:bg-gray-50'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!isLocked && !isVideoLockedForThis) {
                                        if (onVideoSelect) {
                                          onVideoSelect(videoId, video, assignment)
                                        }
                                        if (onAssignmentSelect) {
                                          onAssignmentSelect(assignment.id)
                                        }
                                      }
                                    }}
                                  >
                                    <div className={`h-2 w-2 rounded-full ${
                                      isLocked || isVideoLockedForThis
                                        ? 'bg-gray-300' 
                                        : isCompleted 
                                          ? 'bg-green-500' 
                                          : 'bg-blue-400'
                                    }`}></div>
                                    <span className={`text-xs ${
                                      isLocked || isVideoLockedForThis
                                        ? 'text-gray-400' 
                                        : isCompleted 
                                          ? 'text-green-600 font-medium' 
                                          : 'text-gray-600 hover:text-blue-600'
                                    } truncate`} title={videoTitle}>
                                      {videoTitle} {isCompleted && '✓'} {(isLocked || isVideoLockedForThis) && '🔒'}
                                    </span>
                                  </div>
                                );
                              })}
                              
                              {/* Resources */}
                              {(assignment as any).children?.resources?.map((resource: any, idx: number) => {
                                // Get the title from various possible sources
                                const getResourceTitle = (resource: any) => {
                                  if (resource.youtubeVideo?.title) return resource.youtubeVideo.title;
                                  if (resource.link?.title) return resource.link.title;
                                  if (resource.driveFile?.title) return resource.driveFile.title;
                                  if (resource.driveFile?.driveFile?.title) return resource.driveFile.driveFile.title;
                                  if (resource.form?.title) return resource.form.title;
                                  return `Resource ${idx + 1}`;
                                };

                                const resourceTitle = getResourceTitle(resource);
                                const resourceId = `resource-${assignment.id}-${idx}`;
                                const isCompleted = isVideoCompleted(resourceId);
                                const isResourceLockedForThis = isResourceLocked(idx, assignment);

                                return (
                                  <div 
                                    key={resourceId} 
                                    className={`flex items-center gap-2 rounded p-1 -m-1 transition-colors ${
                                      isLocked || isResourceLockedForThis
                                        ? 'cursor-not-allowed opacity-50' 
                                        : 'cursor-pointer hover:bg-gray-50'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!isLocked && !isResourceLockedForThis) {
                                        // Check if resource is a video
                                        if (resource.youtubeVideo || 
                                            (resource.link && getYouTubeEmbedUrl(resource.link.url)) ||
                                            resource.driveFile?.driveFile?.videoMediaMetadata) {
                                          if (onVideoSelect) {
                                            onVideoSelect(resourceId, resource, assignment)
                                          }
                                        }
                                        // Check if resource is a quiz/form
                                        else if (resource.form || 
                                                 (resource.link && (resource.link.url.includes('docs.google.com/forms') || resource.link.url.includes('forms.gle')))) {
                                          if (onQuizSelect) {
                                            onQuizSelect(resourceId, resource)
                                          }
                                        }
                                        // Default to video handler for other resources
                                        else if (onVideoSelect) {
                                          onVideoSelect(resourceId, resource, assignment)
                                        }
                                        
                                        if (onAssignmentSelect) {
                                          onAssignmentSelect(assignment.id)
                                        }
                                      }
                                    }}
                                  >
                                    <div className={`h-2 w-2 rounded-full ${
                                      isLocked || isResourceLockedForThis
                                        ? 'bg-gray-300' 
                                        : isCompleted 
                                          ? 'bg-green-500' 
                                          : 'bg-gray-400'
                                    }`}></div>
                                    <span className={`text-xs ${
                                      isLocked || isResourceLockedForThis
                                        ? 'text-gray-400' 
                                        : isCompleted 
                                          ? 'text-green-600 font-medium' 
                                          : 'text-gray-600 hover:text-gray-800'
                                    } truncate`} title={resourceTitle}>
                                      {resourceTitle} {isCompleted && '✓'} {(isLocked || isResourceLockedForThis) && '🔒'}
                                    </span>
                                  </div>
                                );
                              })}
                              
                              {/* Quizzes (at the end) */}
                              {(assignment as any).children?.quizzes?.map((quiz: any, idx: number) => {
                                // Get the title from various possible sources
                                const getQuizTitle = (quiz: any) => {
                                  if (quiz.form?.title) return quiz.form.title;
                                  if (quiz.link?.title) return quiz.link.title;
                                  return `Quiz ${idx + 1}`;
                                };

                                const quizTitle = getQuizTitle(quiz);
                                const quizId = `quiz-${assignment.id}-${idx}`;
                                const isQuizCompleted = isVideoCompleted(quizId);
                                const isQuizLockedForThis = isQuizLocked(assignment);

                                return (
                                  <div 
                                    key={quizId} 
                                    className={`flex items-center gap-2 rounded p-1 -m-1 transition-colors ${
                                      isLocked || isQuizLockedForThis
                                        ? 'cursor-not-allowed opacity-50' 
                                        : 'cursor-pointer hover:bg-gray-50'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!isLocked && !isQuizLockedForThis && onQuizSelect) {
                                        onQuizSelect(quizId, quiz)
                                      }
                                    }}
                                  >
                                    <div className={`h-2 w-2 rounded-full ${
                                      isLocked || isQuizLockedForThis
                                        ? 'bg-gray-300' 
                                        : isQuizCompleted
                                          ? 'bg-green-500'
                                          : 'bg-green-400'
                                    }`}></div>
                                    <span className={`text-xs ${
                                      isLocked || isQuizLockedForThis
                                        ? 'text-gray-400' 
                                        : isQuizCompleted
                                          ? 'text-green-600 font-medium'
                                          : 'text-gray-600 hover:text-green-600'
                                    } truncate`} title={quizTitle}>
                                      {quizTitle} {isQuizCompleted && '✓'} {(isLocked || isQuizLockedForThis) && '🔒'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          }

          // Render other modules (pre-survey, ideas, post-survey) normally
          return (
            <div key={module.id} className="relative">
              {index < modules.length - 1 && (
                <div
                  className={`absolute left-2.5 top-8 w-px h-12 lg:h-20 ${module.status === "completed" ? "bg-green-200" : "bg-gray-200"}`}
                ></div>
              )}

              <div className="space-y-2">
                <div 
                  className={`flex items-start space-x-4 group ${module.status !== "locked" ? "cursor-pointer" : ""}`}
                  onClick={() => handleModuleClick(module.id)}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">{getStatusIcon(module.status)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <h3 className={`text-sm font-medium ${getStatusStyle(module.status)} line-clamp-2`}>
                          {module.title}
                        </h3>
                        {module.items && module.items.length > 0 && module.status !== "locked" && (
                          <button
                            onClick={(e) => toggleModule(module.id, e)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <svg 
                              className={`h-4 w-4 transition-transform ${expandedModules.has(module.id) ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {module.subtitle && <p className="text-xs text-gray-500 mt-1">{module.subtitle}</p>}

                      <div className="flex items-center space-x-2 flex-shrink-0 sm:ml-2">
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-none">
                          {module.videoCount} {module.videoCount !== 1 ? "items" : "item"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Items */}
                {module.items && module.status !== "locked" && expandedModules.has(module.id) && (
                  <div className="ml-9 mt-3 lg:mt-4 space-y-2 lg:space-y-3 pl-3 lg:pl-4 border-l border-gray-200">
                    {module.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start space-x-2 lg:space-x-3 ${
                          !item.locked ? "cursor-pointer hover:bg-gray-50 rounded-md p-1 -m-1 transition-colors" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleItemClick(item, module.id)
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {item.completed ? (
                            <div className="relative flex items-center justify-center">
                              <div className="h-4 w-4 rounded-full border-2 border-green-500 bg-white" />
                              <Check className="absolute h-2.5 w-2.5 text-green-600 font-bold" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300 bg-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${item.completed ? "text-green-600 font-medium" : "text-gray-800 font-medium"}`}>
                            {item.title}
                          </span>
                          {item.dueDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {new Date(item.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full lg:w-[400px] xl:w-[480px] 2xl:w-[520px] h-auto lg:h-[calc(90vh-120px)] lg:sticky lg:top-6 lg:self-start bg-white border border-gray-200 rounded-2xl shadow-md p-4 2xl:p-6 scrollbar-slim overflow-y-auto flex-shrink-0">
      {renderHierarchicalContent()}
    </div>
  )
}

export default ProgressSidebar
