"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Activity, 
  Zap, 
  Trophy, 
  History, 
  Newspaper, 
  Settings, 
  Circle,
  ChevronRight,
  Menu
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/db"

interface Tool {
  id: string
  name: string
}

export function AppSidebar() {
  const pathname = usePathname()
  const [tools, setTools] = React.useState<Tool[]>([])
  const { state } = useSidebar()

  React.useEffect(() => {
    async function fetchTools() {
      const { data, error } = await supabase
        .from("trading_tools")
        .select("id, name")
        .order("name", { ascending: true })
      
      if (!error && data) {
        setTools(data)
      }
    }
    fetchTools()
  }, [])

  const mainNav = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Live Activity", href: "/activity", icon: Activity },
  ]

  const insightNav = [
    { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { title: "Trade History", href: "/history", icon: History },
  ]

  const systemNav = [
    { title: "News & Updates", href: "/news", icon: Newspaper },
    { title: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-black">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)] group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white">Derivex</span>
              <span className="text-[10px] text-teal-500 font-medium -mt-1 uppercase tracking-widest">by Mesoflix</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 px-4 mb-2">Main Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className={cn(
                    "hover:bg-white/5 transition-colors",
                    pathname === item.href ? "text-teal-400 bg-teal-500/10" : "text-gray-400"
                  )}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 px-4 mb-2">Trading Tools</SidebarGroupLabel>
          <SidebarMenu>
            {tools.length > 0 ? (
              tools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/tool/${tool.id}`}
                    className={cn(
                      "hover:bg-white/5 transition-colors",
                      pathname === `/tool/${tool.id}` ? "text-teal-400 bg-teal-500/10" : "text-gray-400"
                    )}
                    tooltip={tool.name}
                  >
                    <Link href={`/tool/${tool.id}`} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Circle className="w-2 h-2 fill-teal-500 text-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                        <span>{tool.name}</span>
                      </div>
                      {state === "expanded" && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="px-4 py-2 text-xs text-gray-600 italic">No tools added yet</div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 px-4 mb-2">Insights</SidebarGroupLabel>
          <SidebarMenu>
            {insightNav.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className="text-gray-400 hover:bg-white/5"
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 px-4 mb-2">System</SidebarGroupLabel>
          <SidebarMenu>
            {systemNav.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className="text-gray-400 hover:bg-white/5"
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-black font-bold border-2 border-white/10 ring-2 ring-teal-500/20">
            GT
          </div>
          {state === "expanded" && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">Guest Trader</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                <span className="text-[10px] text-teal-500 font-bold uppercase tracking-wider">Connected</span>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
