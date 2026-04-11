import type React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { TopNavbar } from "@/components/dashboard/top-navbar"

import { SessionGuard } from "@/components/dashboard/session-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionGuard>
      <SidebarProvider>
        <div className="flex h-screen max-h-screen w-full bg-black text-white overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden bg-black border-l border-white/5 relative">
            <TopNavbar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </SessionGuard>
  )
}
