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
import { useState, useEffect } from "react";

interface Course {
  id: string;
  name: string;
}

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname() ?? "/districtadmin/overview";
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
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

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/districtadmin/courses');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCourses(data.courses);
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      // Use the working sync API from the dashboard
      const response = await fetch('/api/sync/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sync successful:', data);
        alert(`Sync completed! Synced ${data.synced || 0} courses.`);
        
        // Refresh courses after successful sync
        const coursesResponse = await fetch('/api/districtadmin/courses');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          if (coursesData.success) {
            setCourses(coursesData.courses);
          }
        }
      } else {
        const errorData = await response.json();
        console.error('Sync request failed:', response.status, errorData);
        alert(`Sync failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setSyncing(true);
      
      // Call the seed data API to create sample data
      const response = await fetch('/api/districtadmin/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Seed data successful:', data.data);
          alert(`Sample data created successfully! ${data.data.courses} courses and ${data.data.students} students.`);
          // Refresh courses after successful seed
          const coursesResponse = await fetch('/api/districtadmin/courses');
          if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            if (coursesData.success) {
              setCourses(coursesData.courses);
            }
          }
        } else {
          console.error('Seed data failed:', data.message);
          alert(`Seed data failed: ${data.message}`);
        }
      } else {
        console.error('Seed data request failed:', response.status);
        alert('Seed data request failed. Please try again.');
      }
    } catch (error) {
      console.error('Seed data failed:', error);
      alert('Seed data failed. Please try again.');
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
                {selectedCourse === "all" ? "All Courses" : courses.find(c => c.id === selectedCourse)?.name || "Select Course"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl overflow-hidden">
              <DropdownMenuItem
                className="data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white"
                onClick={() => setSelectedCourse("all")}
              >
                All Courses
              </DropdownMenuItem>
              {courses.map((course) => (
                <DropdownMenuItem
                  key={course.id}
                  className="data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white"
                  onClick={() => setSelectedCourse(course.id)}
                >
                  {course.name}
                </DropdownMenuItem>
              ))}
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

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-full px-3 py-1 text-xs"
            onClick={handleSeedData}
            disabled={syncing}
            title="Create sample data for testing"
          >
            {syncing ? 'Seeding...' : 'Seed Data'}
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
              <DropdownMenuItem className="data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="data-[highlighted]:bg-[var(--primary)] data-[highlighted]:text-white focus:bg-[var(--primary)] focus:text-white">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
