"use client";
import { Announcements } from "./modules/announcements"
import { BadgesSection } from "./modules/badges-section"
import { CourseUpdatesTable } from "./modules/course-updates-table"
import { ProgressCircle } from "./modules/progress-circle"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white">

      <main className="px-4 md:px-6 py-6 bg-white">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6 md:mb-8">Hi, Monish!</h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          <div className="lg:col-span-2">
            {/* Progress Circles */}
            <div className="flex items-center justify-start gap-4 md:gap-8 lg:gap-20 mb-8 md:mb-12 overflow-x-auto pb-2">
              <ProgressCircle status="completed" label="Pre-Survey" />
              <ProgressCircle status="due" label="Course Progress" />
              <ProgressCircle status="pending" label="Ideas" />
              <ProgressCircle status="due" label="Post-Survey" />
            </div>
            <CourseUpdatesTable />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 md:space-y-8">
            <Announcements />
            <BadgesSection />
          </div>
        </div>
      </main>
    </div>
  )
}
