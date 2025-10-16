"use client";
import { Announcements } from "./modules/announcements"
import { BadgesSection } from "./modules/badges-section"
import { CourseUpdatesTable } from "./modules/course-updates-table"
import { CourseProgressCircles } from "./modules/course-progress-circles"
import { useCourse } from "@/components/studentdashboard/context/CourseContext"
import { useState, useEffect } from "react"

export default function Dashboard() {
  const { selectedCourse } = useCourse()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user info and profile
    const fetchUserData = async () => {
      try {
        // First get basic user info
        const userRes = await fetch('/api/auth/me')
        const userData = await userRes.json()
        
        if (userData.success && userData.user?.email) {
          // Then get detailed profile from Google
          const profileRes = await fetch('/api/auth/profile')
          const profileData = await profileRes.json()
          
          if (profileData.success) {
            setUser({
              ...userData.user,
              ...profileData.profile
            })
          } else {
            // Fallback to basic user data
            setUser(userData.user)
          }
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  return (
    <div className="min-h-screen bg-white">

      <main className="px-4 md:px-6 py-6 bg-white">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
              Hi, {loading ? '...' : (
                user?.studentProfile?.preferredName || 
                user?.studentProfile?.firstName || 
                user?.name || 
                user?.given_name || 
                (user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'there')
              )}!
            </h1>
            {user?.studentProfile && (
              <div className="mt-2 text-sm text-gray-600">
                Grade {user.studentProfile.grade} • {user.studentProfile.schoolname}
                {user.studentProfile.district && ` • ${user.studentProfile.district}`}
              </div>
            )}
          </div>
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          <div className="lg:col-span-2">
            {/* Progress Circles */}
            <CourseProgressCircles />
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
