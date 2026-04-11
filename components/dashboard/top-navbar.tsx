"use client"

import * as React from "react"
import { 
  Bell, 
  Search, 
  ChevronDown, 
  Globe, 
  Activity,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function TopNavbar() {
  const [user, setUser] = React.useState<any>(null)
  const [ticker, setTicker] = React.useState({
    vol75: "154,232.45",
    change: "+0.45",
    isUp: true
  })

  // Load user session
  React.useEffect(() => {
    const storedUser = localStorage.getItem("derivex_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Simulated live ticker
  React.useEffect(() => {
    const interval = setInterval(() => {
      const current = parseFloat(ticker.vol75.replace(/,/g, ""))
      const delta = (Math.random() - 0.48) * 10
      const next = current + delta
      setTicker({
        vol75: next.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: (delta > 0 ? "+" : "") + delta.toFixed(2),
        isUp: delta > 0
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [ticker.vol75])

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-black/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-gray-400 hover:text-white" />
        <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
        <h2 className="text-sm font-semibold text-white hidden md:block tracking-wide uppercase opacity-70">
          Command Center
        </h2>
      </div>

      <div className="flex-1 max-w-md mx-8 hidden lg:flex items-center gap-4 bg-white/5 rounded-full px-4 py-1.5 border border-white/5 shadow-inner">
        <div className="flex items-center gap-2 border-r border-white/10 pr-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">V75</span>
          <span className={cn(
            "text-sm font-mono font-bold transition-colors duration-500",
            ticker.isUp ? "text-green-400" : "text-red-400"
          )}>
            {ticker.vol75}
          </span>
          <span className={cn(
            "text-[10px] font-bold px-1.5 rounded",
            ticker.isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {ticker.change}%
          </span>
        </div>
        <div className="flex-1 flex items-center gap-2 text-gray-500 transition-all group overflow-hidden">
          <Activity className="w-3 h-3 text-teal-500 animate-pulse" />
          <span className="text-[10px] font-medium truncate group-hover:text-gray-300">
            Live Market Feed Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest leading-none">Status</span>
          <span className="text-xs font-bold text-white mt-1">Operational</span>
        </div>

        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-teal-400 hover:bg-white/5 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-black" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-white/5">
              <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-500 font-bold text-xs overflow-hidden">
                {user?.fullname?.[0] || user?.loginid?.[0] || "GT"}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10 text-white">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-gray-400 font-medium">
               {user?.loginid || "Not Connected"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
               className="hover:bg-white/5 cursor-pointer text-red-400 focus:text-red-400"
               onClick={() => {
                   localStorage.clear()
                   window.location.href = "/"
               }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
