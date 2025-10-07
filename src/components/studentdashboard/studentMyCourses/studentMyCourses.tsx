"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { VideoPlayer } from "./modules/classroomvideo-player"
import ProgressSidebar from "./modules/progress-sidebar"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function ClassroomPage() {
  const router = useRouter()
  const [videoCompleted, setVideoCompleted] = useState(false)

  const handleVideoComplete = () => {
    setVideoCompleted(true)
  }

  const handleNext = () => {
    router.push("/student/dashboard/mycourses/assessment")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="3xl:max-w-7xl 3xl:mx-auto p-4 sm:p-6 xl:p-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Classroom</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
            <span className="font-medium">UPSHIFT: English...</span>
            <span className="hidden sm:inline">•</span>
            <span>class video • 20minute</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 xl:gap-8 2xl:gap-12">
          <div className="flex-1 min-w-0 order-1 lg:order-1">
            <div className="max-w-4xl mx-auto xl:max-w-5xl 2xl:max-w-6xl space-y-4">
              <VideoPlayer onVideoComplete={handleVideoComplete} />
              
              {videoCompleted && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleNext}
                    className="px-6 py-2 2xl:px-8 2xl:py-3 rounded-full bg-green-500 text-white text-sm 2xl:text-base font-medium shadow hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    Next: Assessment
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="order-2 lg:order-2">
            <ProgressSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
