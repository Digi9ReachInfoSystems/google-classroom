"use client";
import { Bell, ChevronDown, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useDistrictCourse } from "../context/DistrictCourseContext";

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname() ?? "/districtadmin/overview";
  const { courses, selectedCourse, setSelectedCourse, refreshCourses } = useDistrictCourse();
  const [syncing, setSyncing] = useState(false);

  const tabs = [
    { label: "Overview", value: "overview", href: "/districtadmin/overview" },
    { label: "Metrics",  value: "metrics",  href: "/districtadmin/metrics" },
    { label: "Ideas",    value: "ideas",    href: "/districtadmin/ideas" },
    { label: "Reports",  value: "reports",  href: "/districtadmin/reports" },
  ] as const;

  // derive current tab from the 2nd segment after /districtadmin
  const seg = pathname.split("/")[2] || "overview";
  const currentTab = tabs.some(t => t.value === seg) ? seg : "overview";

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      // Use OAuth-based sync for district admin
      const response = await fetch('/api/admin/sync-with-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ syncType: 'full' })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sync successful:', data);
        alert(`Sync completed! Synced ${data.recordsSynced || 0} records in ${Math.round(data.duration / 1000)}s.`);
        
        // Refresh courses after successful sync
        await refreshCourses();
      } else {
        const errorData = await response.json();
        console.error('Sync request failed:', response.status, errorData);
        alert(`Sync failed: ${errorData.message || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    // Clear the authentication cookie
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    // Redirect to login page
    router.push('/login');
  };

  return (
    <header className="bg-white border-neutral-200 px-8 py-5">
      <div className="flex items-center justify-between">
        {/* Left: logo + tabs */}
        <div className="flex items-center space-x-8">
          <Image
            src="/upshiftlogo.png"
            alt="UPSHIFT BHUTAN"
            width={160}
            height={64}
            className="h-16 w-auto"
            priority
          />
          <Tabs
            value={currentTab}
            onValueChange={(val) => {
              const t = tabs.find((x) => x.value === val);
              if (t) router.push(t.href);
            }}
            className="hidden md:block"
          >
            <TabsList className="bg-neutral-100 border-0 h-12 gap-2 rounded-full px-1 py-1">
              {tabs.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="
                    px-7 py-2 text-sm font-medium rounded-full border-0 shadow-none transition-colors
                    data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white
                    
                    data-[state=inactive]:text-neutral-600 data-[state=inactive]:hover:text-neutral-800
                    data-[disabled]:opacity-60 data-[disabled]:text-neutral-400 data-[disabled]:cursor-not-allowed
                  "
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Right: actions */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-neutral-600 hover:text-neutral-900 gap-2 border border-neutral-300 rounded-full px-4 py-2 bg-white"
              >
                {selectedCourse ? selectedCourse.name : "All Courses"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl overflow-hidden">
              <DropdownMenuItem
                className="data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white"
                onClick={() => setSelectedCourse(null)}
              >
                All Courses
              </DropdownMenuItem>
              {courses.length === 0 ? (
                <DropdownMenuItem disabled className="text-sm text-muted-foreground">
                  No courses found. Click sync button to fetch courses.
                </DropdownMenuItem>
              ) : (
                courses.map((course) => (
                  <DropdownMenuItem
                    key={course.id}
                    className="data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white"
                    onClick={() => setSelectedCourse(course)}
                  >
                    {course.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral-600 hover:text-neutral-900"
            onClick={handleSync}
            disabled={syncing}
            title="Sync latest data"
          >
            <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-neutral-900">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src="/placeholder-avatar.jpg" alt="District Admin" />
                <AvatarFallback className="bg-neutral-200 text-neutral-700">DA</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl overflow-hidden">
              <DropdownMenuItem 
                className="data-[highlighted]:bg-red-500 data-[highlighted]:text-white focus:bg-red-500 focus:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
