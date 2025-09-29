// import AnnouncementsCard from "@/components/districtadmin/announcements/announcements";
// import ClassProgressCard from "@/components/districtadmin/charts/charts";
// import MeetCard from "@/components/districtadmin/meeting/meeting";
// import KPIRow from "@/components/districtadmin/overview/overview";
// import StudentsTable from "@/components/districtadmin/studenttable/studenttable";

// export default function DashboardPage() {
//   return (
//     <section className="space-y-6">
//       <h1 className="text-[48px] md:text-[36px] font-normal text-[var(--neutral-1000)]">
//         School Overview
//       </h1>

//       {/* Two-column layout */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* LEFT: KPI row + chart + table */}
//         <div className="lg:col-span-8 space-y-6">
//           <KPIRow />
//           <ClassProgressCard />
//           <StudentsTable />
//         </div>

//         {/* RIGHT: Meet + Announcements */}
//         <aside className="lg:col-span-4 space-y-6">
//           <MeetCard />
//           <AnnouncementsCard />
//         </aside>
//       </div>
//     </section>
//   );
// }



import { redirect } from "next/navigation";

export default function DistrictAdminIndex() {
  redirect("/districtadmin/overview");
}
