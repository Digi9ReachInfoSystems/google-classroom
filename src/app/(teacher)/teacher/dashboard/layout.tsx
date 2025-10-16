import { TeacherDashboardHeader } from "@/components/teacherdashboard/navbar/TeacherHeader"
import { TeacherCourseProvider } from "@/components/teacherdashboard/context/TeacherCourseContext"
import React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TeacherCourseProvider>
      <div className="min-h-screen">
        <TeacherDashboardHeader />
        <main className="px-4 md:px-8 py-6">{children}</main>
      </div>
    </TeacherCourseProvider>
  )
}


