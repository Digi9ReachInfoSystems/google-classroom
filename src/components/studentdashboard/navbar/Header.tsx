"use client"
import { Bell, ChevronDown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useCourse } from "@/components/studentdashboard/context/CourseContext"

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const { selectedCourse, setSelectedCourse, courses, loadingCourses, error } = useCourse()

  useEffect(() => {
    // Fetch user info
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(console.error)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const tabs = [
    { label: "Overview", value: "Overview", href: "/student/dashboard" },
    { label: "My Courses", value: "My Courses", href: "/student/dashboard/mycourses" },
    { label: "Leaderboard", value: "Leaderboard", href: "/student/dashboard/leaderboard" },
    { label: "Certificate", value: "Certificate", href: "/student/dashboard/certificate" },
  ] as const

const currentTab = (() => {
const match = [...tabs]
.sort((a, b) => b.href.length - a.href.length)
.find((t) => (pathname ?? "").startsWith(t.href))

return match ? match.value : "Overview"
})()

  return (
    <header className="bg-white border-neutral-200 px-4 md:px-8 py-5">
      <div className="flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-4 md:space-x-8 flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Image src="/student/upshift-logo.png" alt="UPSHIFT BHUTAN" className="h-12 md:h-16 w-auto"
            height={48}
            width={48} />
          </div>

          <Tabs value={currentTab} onValueChange={(val) => {
            const target = tabs.find((t) => t.value === val)
           if (target) {
  router.push(target.href)
}
          }}>
            <TabsList className="bg-neutral-100 border-0 h-12 gap-1 md:gap-2 rounded-full px-1 py-1 overflow-x-auto">
              {tabs.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="px-3 md:px-7 py-2 text-xs md:text-sm font-medium rounded-full border-0 shadow-none transition-colors data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:text-neutral-600 data-[state=inactive]:hover:text-neutral-800 data-[disabled]:opacity-60 data-[disabled]:text-neutral-400 data-[disabled]:cursor-not-allowed whitespace-nowrap"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-neutral-600 hover:text-neutral-900 gap-2 border border-neutral-300 rounded-full px-4 py-2 bg-white"
                disabled={loadingCourses}
              >
                {loadingCourses ? (
                  'Loading...'
                ) : selectedCourse ? (
                  selectedCourse.name || 'Select Course'
                ) : (
                  'Select Course'
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
              {error ? (
                <div className="px-3 py-2 text-sm text-red-600">
                  Error: {error}
                </div>
              ) : courses.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No courses found
                </div>
              ) : (
                courses.map((course) => (
                  <DropdownMenuItem
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`px-3 py-2 cursor-pointer ${
                      selectedCourse?.id === course.id ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <div className="flex flex-col items-start w-full">
                      <div className="font-medium text-sm">{course.name || 'Untitled Course'}</div>
                      {course.section && (
                        <div className="text-xs text-gray-500 mt-1">{course.section}</div>
                      )}
                      {course.room && (
                        <div className="text-xs text-gray-400">Room: {course.room}</div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-neutral-900">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={user?.name || "User"} />
                  <AvatarFallback className="bg-neutral-200 text-neutral-700">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}