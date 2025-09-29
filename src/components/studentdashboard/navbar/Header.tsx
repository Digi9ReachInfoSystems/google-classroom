"use client"
import { Bell, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    { label: "Overview", value: "Overview", href: "/student/dashboard" },
    { label: "My Courses", value: "My Courses", href: "/student/dashboard/mycourses" },
    { label: "Leaderboard", value: "Leaderboard", href: "/student/dashboard/leaderboard" },
    { label: "Certificate", value: "Certificate", href: "/student/dashboard/certificate" },
  ] as const

  const currentTab = (() => {
    const match = tabs
      .filter((t) => t.href !== "#")
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
            <img src="/student/upshift-logo.png" alt="UPSHIFT BHUTAN" className="h-12 md:h-16 w-auto" />
          </div>

          <Tabs value={currentTab} onValueChange={(val) => {
            const target = tabs.find((t) => t.value === val)
            if (target && target.href && target.href !== "#") {
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
              <Button variant="ghost" className="text-neutral-600 hover:text-neutral-900 gap-2 border border-neutral-300 rounded-full px-4 py-2 bg-white">
                Select courses
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Course 1</DropdownMenuItem>
              <DropdownMenuItem>Course 2</DropdownMenuItem>
              <DropdownMenuItem>Course 3</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-neutral-900">
            <Bell className="h-5 w-5" />
          </Button>

          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.jpg" alt="Monish" />
            <AvatarFallback className="bg-neutral-200 text-neutral-700">M</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}