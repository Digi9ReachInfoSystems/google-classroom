"use client"

import type { ReactNode } from "react"
import { Poppins } from "next/font/google"
import { DashboardHeader } from "@/components/districtadmin/navbar/header"
import { DistrictCourseProvider } from "@/components/districtadmin/context/DistrictCourseContext"
 
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})
 
export default function DistrictDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <DistrictCourseProvider>
      <div className={`${poppins.className} min-h-screen bg-white`}>
        <DashboardHeader />
        <main className="px-6 py-6">{children}</main>
      </div>
    </DistrictCourseProvider>
  )
}