import React from 'react'
import ProgressSidebar from './modules/progress-sidebar'
import Studentassements from './modules/studentassements'

export default function Assessment() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Assessment</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">UPSHIFT: English...</span>
            <span>assessment • reading task</span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <div className="max-w-[900px]">
              <Studentassements />
            </div>
          </div>
          <ProgressSidebar />
        </div>
      </div>
    </div>
  )
}
