import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/studentdashboard/navbar/Header"
import { CourseProvider } from "@/components/studentdashboard/context/CourseContext"
import { Poppins } from "next/font/google"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export default function StudentDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <CourseProvider>
      <div className={`${poppins.className} min-h-screen bg-white`}>
        <DashboardHeader />
        <main className="px-6 py-6">{children}</main>
      </div>
    </CourseProvider>
  )
}


