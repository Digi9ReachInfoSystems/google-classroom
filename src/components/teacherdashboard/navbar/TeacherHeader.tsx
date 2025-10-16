"use client"
import { Bell, ChevronDown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { useTeacherCourse } from "../context/TeacherCourseContext"
import { useState, useEffect } from "react"

export function TeacherDashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { courses, selectedCourse, setSelectedCourse, loading: coursesLoading, error } = useTeacherCourse()
  const [user, setUser] = useState<any>(null)
  
  // Debug logging
  console.log('TeacherHeader - courses:', courses.length, 'loading:', coursesLoading, 'error:', error)

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
    { label: "Overview", value: "Overview", href: "/teacher/dashboard" },
    { label: "Ideas", value: "Ideas", href: "/teacher/dashboard/ideas" },
    { label: "Leaderboards", value: "Leaderboards", href: "/teacher/dashboard/leaderboards" },
    { label: "Reports", value: "Reports", href: "/teacher/dashboard/reports" },
    { label: "Learning Resources", value: "Learning Resources", href: "/teacher/dashboard/learningresources" },
    // { label: "Gemini", value: "Gemini", href: "/teacher/dashboard/gemini" },
  ] as const

 const currentTab = (() => {
  const match = [...tabs] // spread to make a mutable array
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
            <Image src="/student/upshift-logo.png" alt="UPSHIFT BHUTAN" width={120} height={64} className="h-12 md:h-16 w-auto" />
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
                className="text-neutral-600 hover:text-neutral-900 gap-2 border border-neutral-300 rounded-full px-4 py-2 bg-white min-w-[180px]"
                disabled={coursesLoading}
              >
                {coursesLoading ? (
                  "Loading..."
                ) : selectedCourse ? (
                  <>
                    {selectedCourse.name}
                    {selectedCourse.section && ` (${selectedCourse.section})`}
                  </>
                ) : (
                  "Select Course"
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-80 overflow-y-auto">
              {error ? (
                <DropdownMenuItem disabled className="text-red-600">
                  Error: {error}
                </DropdownMenuItem>
              ) : courses.length === 0 ? (
                <DropdownMenuItem disabled>
                  No courses found
                </DropdownMenuItem>
              ) : (
                courses.map((course) => (
                  <DropdownMenuItem
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`cursor-pointer ${selectedCourse?.id === course.id ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <div className="flex flex-col items-start w-full">
                      <div className="font-medium">{course.name}</div>
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
                  <AvatarImage src="/placeholder-avatar.jpg" alt={user?.email || "User"} />
                  <AvatarFallback className="bg-neutral-200 text-neutral-700">
                    {user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.email || "User"}</p>
                <p className="text-xs text-muted-foreground">Teacher</p>
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