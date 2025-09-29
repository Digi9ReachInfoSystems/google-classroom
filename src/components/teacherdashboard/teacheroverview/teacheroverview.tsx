import React from "react";
import CircleProgressRow from "./modules/circleprogessrow";
import TeacherclassProgressCard from "./modules/ClassProgressCard";
import TeacherstudentsTable from "./modules/StudentsTable";
import TeacherMeetCard from "./modules/MeetCard";
import TeacherAnnouncementsCard from "./modules/AnnouncementsCard";


export default function TeacherOverview() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold">Welcome, Teacher!</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <CircleProgressRow />
          <TeacherclassProgressCard />
          <TeacherstudentsTable />
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <TeacherMeetCard />
          <TeacherAnnouncementsCard />
        </aside>
      </div>
    </div>
  );
}
