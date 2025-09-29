import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import { Superadminheader } from "@/components/superadmin/navbar/superadminheader";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function StudentDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${poppins.className} min-h-screen bg-white`}>
      <Superadminheader />
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
