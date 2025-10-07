"use client";
import { Bell, ChevronDown, RefreshCw, LogOut } from "lucide-react";
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

export function Superadminheader() {
  const router = useRouter();
  const pathname = usePathname() ?? "/superadmin/overview";
  const [syncing, setSyncing] = useState(false);

  const tabs = [
    { label: "Overview", value: "overview", href: "/superadmin/overview" },
    {
      label: "Course Metrics",
      value: "metrics",
      href: "/superadmin/metrics",
    },
    { label: "Ideas", value: "ideas", href: "/superadmin/ideas" },
    { label: "Reports", value: "reports", href: "/superadmin/reports" },
    {
      label: "Learning Resources",
      value: "learningresource",
      href: "/superadmin/learningresource",
    },
    // {
    //   label: "Course Management",
    //   value: "coursemanagement",
    //   href: "/superadmin/coursemanagement",
    // },
  ] as const;

  const seg = pathname.split("/")[2] || "overview";
  const currentTab = tabs.some((t) => t.value === seg) ? seg : "overview";

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
            size="icon"
            className="text-neutral-600 hover:text-neutral-900"
          >
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Super Admin" />
                <AvatarFallback className="bg-neutral-200 text-neutral-700">
                  SA
                </AvatarFallback>
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
