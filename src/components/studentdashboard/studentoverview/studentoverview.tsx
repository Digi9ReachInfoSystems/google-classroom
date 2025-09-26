"use client";
import { Announcements } from "./modules/announcements"
import { BadgesSection } from "./modules/badges-section"
import { CourseUpdatesTable } from "./modules/course-updates-table"
import { ProgressCircle } from "./modules/progress-circle"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-neutral-100 ">

      <main className="px-6 py-6 bg-white ">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Hi, Monish!</h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
                    {/* Progress Circles */}
          <div className="flex items-center justify-start gap-20 mb-12">
            <ProgressCircle status="completed" label="Pre-Survey" />
            <ProgressCircle status="due" label="Course Progress" />
            <ProgressCircle status="pending" label="Ideas" />
            <ProgressCircle status="due" label="Post-Survey" />
          </div>
            <CourseUpdatesTable />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            <Announcements />
            <BadgesSection />
          </div>
        </div>
      </main>
    </div>
  )
}
