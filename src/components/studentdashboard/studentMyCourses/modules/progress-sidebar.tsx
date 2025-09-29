"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface ModuleItem {
  id: string
  title: string
  completed: boolean
  locked?: boolean
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

const ProgressSidebar = () => {
  const [modules, setModules] = useState<ProgressModule[]>([
    {
      id: "1",
      title: "Pre Survey",
      status: "completed",
      videoCount: 3,
      expanded: false,
    },
    {
      id: "2",
      title: "Learning modules",
      subtitle: "Topic of the course",
      status: "current",
      videoCount: 2,
      expanded: true,
      items: [
        { id: "2-1", title: "Advance tech", completed: true },
        { id: "2-2", title: "Advance tech assessment", completed: false },
      ],
    },
    {
      id: "3",
      title: "Idea Submission",
      status: "locked",
      videoCount: 2,
      expanded: false,
    },
    {
      id: "4",
      title: "Post Survey",
      status: "locked",
      videoCount: 3,
      expanded: false,
    },
  ])

  // No dropdown interaction – modules render statically based on status

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
        return "text-gray-700"
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

            <div className="flex items-start space-x-4 group">
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
                      {module.videoCount} Video{module.videoCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>

                {module.items && module.status !== "locked" && (
                  <div className="mt-3 lg:mt-4 space-y-2 lg:space-y-3 pl-3 lg:pl-4 border-l border-gray-200">
                    {module.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 lg:space-x-3">
                        <div className="flex-shrink-0">
                          {item.completed ? (
                            <div className="relative flex items-center justify-center">
                              <div className="h-4 w-4 rounded-full border-2 border-green-500 bg-white" />
                              <Check className="absolute h-2.5 w-2.5 text-green-600" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300 bg-white"></div>
                          )}
                        </div>
                        <span className={`text-sm ${item.completed ? "text-gray-600" : "text-gray-800"}`}>
                          {item.title}
                        </span>
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
