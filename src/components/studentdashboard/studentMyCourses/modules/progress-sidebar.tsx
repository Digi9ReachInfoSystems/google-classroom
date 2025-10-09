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
  type?: 'assignment' | 'material' | 'video'
  dueDate?: string
  maxPoints?: number
  assignedGrade?: number
}

interface ProgressModule {
  id: string
  title: string
  subtitle?: string
  status: "completed" | "current" | "locked"
  videoCount: number
  expanded?: boolean
  items?: ModuleItem[]
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
}

const ProgressSidebar = ({ selectedCourse, stageProgress, selectedStage, onStageSelect, onMaterialSelect }: ProgressSidebarProps) => {
  const router = useRouter()
  const [modules, setModules] = useState<ProgressModule[]>([])
  const [courseMaterials, setCourseMaterials] = useState<any[]>([])

  // Fetch course materials when course is selected
  useEffect(() => {
    if (selectedCourse?.id) {
      fetchCourseMaterials()
    }
  }, [selectedCourse])

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
        console.log('Filtered materials for sidebar:', materials)
        setCourseMaterials(materials)
      }
    } catch (err) {
      console.error('Error fetching course materials:', err)
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
      onStageSelect(moduleId)
    }
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

  return (
    <div className="w-full lg:w-[400px] xl:w-[480px] 2xl:w-[520px] h-auto lg:h-[calc(90vh-120px)] lg:sticky lg:top-6 lg:self-start bg-white border border-gray-200 rounded-2xl shadow-md p-4 2xl:p-6 scrollbar-slim overflow-y-auto flex-shrink-0">
      <div className="space-y-6 lg:space-y-8 2xl:space-y-10">
        {modules.map((module, index) => (
          <div key={module.id} className="relative">
            {index < modules.length - 1 && (
              <div
                className={`absolute left-2.5 top-8 w-px h-12 lg:h-20 ${module.status === "completed" ? "bg-green-200" : "bg-gray-200"}`}
              ></div>
            )}

            <div 
              className={`flex items-start space-x-4 group ${module.status !== "locked" ? "cursor-pointer" : ""}`}
              onClick={() => handleModuleClick(module.id)}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">{getStatusIcon(module.status)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium ${getStatusStyle(module.status)} line-clamp-2`}>
                      {module.title}
                    </h3>
                    {module.subtitle && <p className="text-xs text-gray-500 mt-1">{module.subtitle}</p>}
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 sm:ml-2">
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-none">
                      {module.videoCount} {module.videoCount !== 1 ? "items" : "item"}
                    </Badge>
                  </div>
                </div>

                {module.items && module.status !== "locked" && (
                  <div className="mt-3 lg:mt-4 space-y-2 lg:space-y-3 pl-3 lg:pl-4 border-l border-gray-200">
                    {module.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start space-x-2 lg:space-x-3 ${
                          !item.locked ? "cursor-pointer hover:bg-gray-50 rounded-md p-1 -m-1 transition-colors" : ""
                        }`}
                        onClick={() => handleItemClick(item, module.id)}
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
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressSidebar
