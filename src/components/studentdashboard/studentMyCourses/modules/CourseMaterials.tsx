"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Circle, PlayCircle, FileText, Link as LinkIcon, Download, ExternalLink } from "lucide-react"

interface CourseMaterial {
  id: string
  title: string
  description?: string
  workType: string
  materials?: any[]
  dueDate?: any
  maxPoints?: number
  state?: string
  submission?: {
    state: string
    assignedGrade?: number
  }
}

interface CourseMaterialsProps {
  courseId: string
  studentEmail: string
  selectedMaterialId?: string | null
  onAllComplete: () => void
  submitting: boolean
  onVideoSelect?: (videoId: string, videoData: any) => void
  onQuizSelect?: (quizId: string, quizData: any) => void
  learningModuleProgress?: Record<string, any>
  videoCompletions?: Record<string, boolean>
}

export default function CourseMaterials({ courseId, studentEmail, selectedMaterialId, onAllComplete, submitting, onVideoSelect, onQuizSelect, learningModuleProgress, videoCompletions }: CourseMaterialsProps) {
  console.log('CourseMaterials props:', { onVideoSelect: !!onVideoSelect, onQuizSelect: !!onQuizSelect })
  
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set()) // Don't expand any sections by default
  const [hierarchicalData, setHierarchicalData] = useState<any>(null)
  const [materialCompletionStatus, setMaterialCompletionStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchCourseMaterials()
    fetchHierarchicalData()
  }, [courseId])

  // Check material completion status when materials are loaded
  useEffect(() => {
    const checkAllMaterialCompletions = async () => {
      if (materials.length > 0) {
        const completionStatus: Record<string, boolean> = {}
        for (const material of materials) {
          const isCompleted = await checkMaterialCompletion(material.id)
          completionStatus[material.id] = isCompleted
        }
        setMaterialCompletionStatus(completionStatus)
      }
    }
    
    checkAllMaterialCompletions()
  }, [materials])

  // Update selected material when selectedMaterialId changes
  useEffect(() => {
    if (selectedMaterialId) {
      // First try to find in hierarchical data
      if (hierarchicalData) {
        const foundMaterial = findMaterialInHierarchy(hierarchicalData, selectedMaterialId)
        if (foundMaterial) {
          setSelectedMaterial(foundMaterial)
          return
        }
      }
      
      // Fallback to materials array
      if (materials.length > 0) {
        const material = materials.find(m => m.id === selectedMaterialId)
        if (material) {
          setSelectedMaterial(material)
        }
      }
    }
  }, [selectedMaterialId, materials, hierarchicalData])

  // Helper function to find material in hierarchical structure
  const findMaterialInHierarchy = (data: any, materialId: string): any => {
    if (!data || !data.learningModules) return null
    
    // Direct assignment lookup (no topics anymore)
    for (const assignment of data.learningModules.children) {
      if (assignment.id === materialId) {
        return assignment
      }
    }
    return null
  }

  const fetchCourseMaterials = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/coursework?courseId=${courseId}`)
      const data = await response.json()

      if (data.success) {
        // Filter out survey and idea assignments
        const courseMaterials = data.coursework.filter((item: any) => {
          const title = item.title?.toLowerCase() || ''
          return !title.includes('survey') && !title.includes('idea')
        })
        setMaterials(courseMaterials)
        
        // Auto-select first material
        if (courseMaterials.length > 0) {
          setSelectedMaterial(courseMaterials[0])
        }
      } else {
        setError('Failed to load course materials')
      }
    } catch (err) {
      console.error('Error fetching course materials:', err)
      setError('Failed to load course materials')
    } finally {
      setLoading(false)
    }
  }

  const fetchHierarchicalData = async () => {
    try {
      const response = await fetch(`/api/student/coursework-hierarchical?courseId=${courseId}`)
      const data = await response.json()

      if (data.success) {
        setHierarchicalData(data.hierarchicalData)
      }
    } catch (err) {
      console.error('Error fetching hierarchical data:', err)
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }
    return null
  }

  const checkMaterialCompletion = async (materialId: string) => {
    try {
      const response = await fetch(`/api/student/check-material-completion?courseId=${courseId}&materialId=${materialId}`)
      const data = await response.json()
      return data.success && data.completed
    } catch (error) {
      console.error('Error checking material completion:', error)
      return false
    }
  }

  const handleMarkMaterialComplete = async (materialId: string) => {
    try {
      // Find current index before making the API call
      const currentIndex = materials.findIndex(m => m.id === materialId);
      const nextMaterialId = currentIndex !== -1 && currentIndex < materials.length - 1 
        ? materials[currentIndex + 1].id 
        : null;
      
      const response = await fetch('/api/student/mark-material-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseWorkId: materialId
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`Material ${materialId} marked as complete successfully`);
        
        // Update local completion status
        setMaterialCompletionStatus(prev => ({
          ...prev,
          [materialId]: true
        }));
        
        // Add a small delay to ensure the database write is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh materials to show updated completion status
        const refreshResponse = await fetch(`/api/student/coursework?courseId=${courseId}`);
        const refreshData = await refreshResponse.json();

        if (refreshData.success) {
          const updatedMaterials = refreshData.coursework.filter((item: any) => {
            const title = item.title?.toLowerCase() || '';
            return !title.includes('survey') && !title.includes('idea');
          });
          
          console.log('Refreshed materials:', updatedMaterials.map((m: any) => ({
            id: m.id,
            title: m.title,
            hasSubmission: !!m.submission,
            submissionState: m.submission?.state
          })));
          
          setMaterials(updatedMaterials);

          // Auto-select next material after refresh
          if (nextMaterialId) {
            const nextMaterial = updatedMaterials.find((m: any) => m.id === nextMaterialId);
            if (nextMaterial) {
              setSelectedMaterial(nextMaterial);
            }
          } else {
            // Update current material to show completion
            const currentMaterial = updatedMaterials.find((m: any) => m.id === materialId);
            if (currentMaterial) {
              setSelectedMaterial(currentMaterial);
            }
          }
        } else {
          console.error('Failed to refresh materials:', refreshData.message);
        }
      } else {
        console.error('Failed to mark material complete:', data.message);
      }
    } catch (error) {
      console.error('Error marking material complete:', error)
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const renderSelectedMaterialContent = () => {
    if (!selectedMaterial) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a material to view
        </div>
      )
    }

    const isCompleted = selectedMaterial.submission?.state === 'TURNED_IN'
    const isCompletedViaAPI = materialCompletionStatus[selectedMaterial.id] || false

    // Check if learning module is completed based on video/quiz completions
    const isLearningModuleCompleted = () => {
      if (!learningModuleProgress || !videoCompletions || !selectedMaterial) return false
      
      // Get the module ID from the selected material
      const moduleId = selectedMaterial.id
      const moduleProgress = learningModuleProgress[moduleId]
      
      if (!moduleProgress) return false
      
      // Check if all videos and quizzes are completed
      const allVideosCompleted = selectedMaterial.children?.videos?.every((_: any, index: number) => {
        const videoId = `video-${moduleId}-${index}`
        return videoCompletions[videoId] === true
      }) || false

      const allQuizzesCompleted = selectedMaterial.children?.quizzes?.every((_: any, index: number) => {
        const quizId = `quiz-${moduleId}-${index}`
        return videoCompletions[quizId] === true
      }) || false

      return allVideosCompleted && allQuizzesCompleted
    }

    const moduleCompleted = isLearningModuleCompleted()
    
    // Check if this is Module 6
    const isModule6 = () => {
      const title = selectedMaterial.title?.toLowerCase() || ''
      return title.includes('module 6') || 
             title.includes('mod 6') || 
             title.includes('module6') ||
             title.includes('mod6') ||
             (title.includes('module') && title.includes('6')) ||
             (title.includes('mod') && title.includes('6'))
    }

    // Use hierarchical data if available, otherwise fallback to materials
    let videos: any[] = []
    let assignments: any[] = []

    if ((selectedMaterial as any).children) {
      // Use hierarchical structure - videos first, then resources, then quizzes at the end
      videos = (selectedMaterial as any).children.videos || []
      assignments = [...((selectedMaterial as any).children.resources || []), ...((selectedMaterial as any).children.quizzes || [])]
    } else if (selectedMaterial.materials && selectedMaterial.materials.length > 0) {
      // Fallback to original materials structure
      selectedMaterial.materials.forEach((item: any) => {
        if (item.youtubeVideo || (item.link && getYouTubeEmbedUrl(item.link.url)) || item.driveFile?.driveFile?.videoMediaMetadata) {
          videos.push(item)
        } else {
          assignments.push(item)
        }
      })
    }

    return (
      <div className="space-y-6">
        {/* Material Header */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{selectedMaterial.title}</h2>
              {selectedMaterial.description && (
                <p className="text-muted-foreground">{selectedMaterial.description}</p>
              )}
            </div>
            {!isCompleted && !isCompletedViaAPI && !moduleCompleted && (
              <Button
                onClick={() => handleMarkMaterialComplete(selectedMaterial.id)}
                size="sm"
                className="bg-green-500 hover:bg-green-600 flex-shrink-0"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm">
            {selectedMaterial.maxPoints && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                {selectedMaterial.maxPoints} points
              </span>
            )}
            {(isCompleted || isCompletedViaAPI || moduleCompleted) && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                {moduleCompleted ? 'Module Completed' : 'Completed'}
              </span>
            )}
          </div>
        </div>

        {/* Module 6 Course Completion Button */}
        {isModule6() && (isCompleted || isCompletedViaAPI || moduleCompleted) && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🎉 Module 6 Completed!</h3>
              <p className="text-blue-700 mb-4">You've completed the final learning module. Ready to mark the entire course as complete?</p>
              <Button
                onClick={onAllComplete}
                disabled={submitting}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                {submitting ? 'Marking Course Complete...' : '✓ Mark Course as Complete'}
              </Button>
            </div>
          </div>
        )}

        {/* Content will be shown only when individual items are selected from sidebar */}

        {/* No materials message */}
        {!selectedMaterial && (
          <div className="text-center py-12 text-muted-foreground bg-muted rounded-lg">
            <p className="text-lg font-medium mb-2">Select a material from the sidebar</p>
            <p className="text-sm">Click on videos or quizzes in the left sidebar to view their content here.</p>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const completedCount = materials.filter(m => m.submission?.state === 'TURNED_IN').length
  const allCompleted = completedCount >= materials.length && materials.length > 0

  console.log('Materials completion status:', {
    materials: materials.map(m => ({
      title: m.title,
      hasSubmission: !!m.submission,
      submissionState: m.submission?.state
    })),
    completedCount,
    totalCount: materials.length,
    allCompleted
  });

  return (
    <div className="space-y-6">
      {/* Main Content Area */}
      <Card className="min-h-[100px]">
        <CardContent className="p-6">
          {renderSelectedMaterialContent()}
        </CardContent>
      </Card>

      {/* Complete Button */}
      {allCompleted && (
        <div className="text-center">
          <Button 
            onClick={onAllComplete}
            disabled={submitting}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {submitting ? 'Marking Complete...' : '✓ Mark Course as Complete'}
          </Button>
        </div>
      )}
    </div>
  )
}
