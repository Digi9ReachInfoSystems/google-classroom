"use client";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname() ?? "/districtadmin/overview";

  const tabs = [
    { label: "Overview", value: "overview", href: "/districtadmin/overview" },
    { label: "Metrics",  value: "metrics",  href: "/districtadmin/metrics" },
    { label: "Ideas",    value: "ideas",    href: "/districtadmin/ideas" },
    { label: "Reports",  value: "reports",  href: "/districtadmin/reports" },
  ] as const;

  // derive current tab from the 2nd segment after /districtadmin
  const seg = pathname.split("/")[2] || "overview";
  const currentTab = tabs.some(t => t.value === seg) ? seg : "overview";

  return (
    <header className="bg-white border-neutral-200 px-8 py-5">
      <div className="flex items-center justify-between">
        {/* Left: logo + tabs */}
        <div className="flex items-center space-x-8">
          <img src="/upshiftlogo.png" alt="UPSHIFT BHUTAN" className="h-16 w-auto" />

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
                    data-[state=active]:bg-[var(--warning-400)] data-[state=active]:text-white
                    
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
  );
}
