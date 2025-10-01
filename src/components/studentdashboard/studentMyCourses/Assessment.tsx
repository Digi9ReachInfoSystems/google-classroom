import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ProgressSidebar from './modules/progress-sidebar'
import Studentassements from './modules/studentassements'

export default function Assessment() {
  return (
    <div className="min-h-screen bg-background">
      <div className="3xl:max-w-7xl 3xl:mx-auto p-4 sm:p-6 xl:p-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Assessment</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
            <span className="font-medium">UPSHIFT: English...</span>
            <span className="hidden sm:inline">•</span>
            <span>assessment • reading task</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 xl:gap-8 2xl:gap-12">
          <div className="flex-1 min-w-0 order-1 lg:order-1">
            <div className="max-w-4xl mx-auto xl:max-w-5xl 2xl:max-w-6xl">
              <Studentassements />

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
