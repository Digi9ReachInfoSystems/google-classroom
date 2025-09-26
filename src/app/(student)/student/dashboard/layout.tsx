import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/studentdashboard/navbar/Header"

export default function StudentDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />
      <main className="px-6 py-6">{children}</main>
    </div>
  )
}


