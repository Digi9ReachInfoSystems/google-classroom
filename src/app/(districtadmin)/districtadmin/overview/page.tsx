// app/districtadmin/overview/page.tsx
import AnnouncementsCard from "@/components/districtadmin/announcements/announcements";
import ClassProgressCard from "@/components/districtadmin/charts/charts";
import MeetCard from "@/components/districtadmin/meeting/meeting";
import KPIRow from "@/components/districtadmin/overview/overview";
import StudentsTable from "@/components/districtadmin/studenttable/studenttable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Page() {
  return (
    <section className="space-y-6 px-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">
          School Overview
        </h1>
        <Select>
          <SelectTrigger
            className="h-9 w-[160px] rounded-full bg-white ring-1 ring-[var(--neutral-300)] px-4 text-sm focus:outline-none data-[state=open]:ring-2 data-[state=open]:ring-[var(--primary)]"
            aria-label="Select school filter"
          >
            <SelectValue placeholder="Select School" />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-white ring-1 ring-[var(--neutral-300)]">
            <SelectItem value="all">All Schools</SelectItem>
            <SelectItem value="a">School A</SelectItem>
            <SelectItem value="b">School B</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6">
        {/* LEFT: KPI row + chart + table */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <KPIRow />
          <ClassProgressCard />
          <StudentsTable />
        </div>

        {/* RIGHT: Meet + Announcements */}
        <aside className="md:col-span-5 lg:col-span-4 space-y-6">
          <MeetCard />
          <AnnouncementsCard />
        </aside>
      </div>
    </section>
  );
}
