// app/districtadmin/overview/page.tsx
import AnnouncementsCard from "@/components/districtadmin/announcements/announcements";
import ClassProgressCard from "@/components/districtadmin/charts/charts";
import MeetCard from "@/components/districtadmin/meeting/meeting";
import KPIRow from "@/components/districtadmin/overview/overview";
import StudentsTable from "@/components/districtadmin/studenttable/studenttable";

export default function Page() {
  return (
    <section className="space-y-6 px-5">
      <h1 className="text-[32px] md:text-[32px] font-normal text-[var(--neutral-1000)]">
        School Overview
      </h1>

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
