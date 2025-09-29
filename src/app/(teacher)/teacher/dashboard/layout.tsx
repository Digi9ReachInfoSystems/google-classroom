import { TeacherDashboardHeader } from "@/components/teacherdashboard/navbar/TeacherHeader"
import React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <TeacherDashboardHeader />
      <main className="px-4 md:px-8 py-6">{children}</main>
    </div>
  )
}


