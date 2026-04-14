import type React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { TopNavbar } from "@/components/dashboard/top-navbar"

import { SessionGuard } from "@/components/dashboard/session-guard"
import { BotProvider } from "@/contexts/bot-context"
import { ProfileCompletionPopup } from "@/components/dashboard/profile-popup"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isFocusedPage = pathname === "/community" || pathname === "/support"

  return (
    <SessionGuard>
      <BotProvider>
        <ProfileCompletionPopup />
        <SidebarProvider>
          <div className="flex h-screen max-h-screen w-full bg-black text-white overflow-hidden relative">
            {!isFocusedPage && <AppSidebar />}
            <SidebarInset className={cn(
                "flex flex-col flex-1 overflow-hidden bg-black relative",
                !isFocusedPage && "border-l border-white/5"
            )}>
              {!isFocusedPage && <TopNavbar />}
              <main className={cn(
                  "flex-1 overflow-y-auto custom-scrollbar relative",
                  !isFocusedPage ? "p-4 md:p-6" : "p-0"
              )}>
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </BotProvider>
    </SessionGuard>
  )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
