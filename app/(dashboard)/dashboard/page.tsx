"use client"

import * as React from "react"
import { 
  Zap, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Play, 
  Activity,
  Clock,
  ShieldCheck,
  LayoutGrid
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/db"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface Tool {
  id: string
  name: string
  description: string
  category: string
  win_rate: number
  total_users: number
  status?: string
}

interface ActivityEvent {
  id: string
  activity_type: string
  description: string
  created_at: string
}

export default function DashboardPage() {
  const [tools, setTools] = React.useState<Tool[]>([])
  const [activities, setActivities] = React.useState<ActivityEvent[]>([])
  const [user, setUser] = React.useState<any>(null)
  const [activeAccount, setActiveAccount] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Load local user & accounts
    const storedUser = localStorage.getItem("derivex_user")
    const storedActiveId = localStorage.getItem("derivex_acct")
    const storedAccounts = localStorage.getItem("derivex_accounts")
    
    let parsedUser = null
    if (storedUser) {
      parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
    }

    if (storedActiveId && storedAccounts) {
      const allAccounts = JSON.parse(storedAccounts)
      const active = allAccounts.find((a: any) => a.account === storedActiveId)
      if (active) {
        setActiveAccount(active)
      }
    } else if (parsedUser) {
        // Fallback to primary user if no active selection
        setActiveAccount({
            account: parsedUser.loginid,
            balance: parsedUser.balance,
            currency: parsedUser.currency
        })
    }

    async function fetchData() {
      const [toolsRes, activityRes] = await Promise.all([
        supabase.from("trading_tools").select("*").order("name"),
        supabase.from("activity_feed").select("*").order("created_at", { ascending: false }).limit(10)
      ])

      if (toolsRes.data) setTools(toolsRes.data)
      if (activityRes.data) setActivities(activityRes.data)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const isActiveDemo = activeAccount?.account?.startsWith('VRTC')

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* A. WELCOME / STATUS CARD */}
      <section className={cn(
        "relative overflow-hidden rounded-3xl border p-8 shadow-2xl transition-all duration-700",
        isActiveDemo 
          ? "bg-gradient-to-br from-zinc-900 via-orange-950/20 to-zinc-900 border-orange-500/20 shadow-orange-500/5" 
          : "bg-gradient-to-br from-zinc-900 via-teal-950/20 to-zinc-900 border-teal-500/20 shadow-teal-500/5"
      )}>
        <div className={cn(
          "absolute top-0 right-0 w-96 h-96 blur-[120px] rounded-full -mr-20 -mt-20 transition-colors duration-700",
          isActiveDemo ? "bg-orange-500/10" : "bg-teal-500/10"
        )} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Badge className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border",
                    isActiveDemo 
                        ? "bg-orange-500/20 text-orange-500 border-orange-500/30" 
                        : "bg-teal-500/20 text-teal-500 border-teal-500/30"
                )}>
                    {isActiveDemo ? "Virtual practice environment active" : "Real institutional trading mode"}
                </Badge>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isActiveDemo ? "bg-orange-500" : "bg-teal-500")} />
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Live Sync</span>
                </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Welcome back, <span className={cn("transition-colors duration-700", isActiveDemo ? "text-orange-400" : "text-teal-400")}>
                {user?.fullname || user?.loginid || "Guest"}
              </span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 mt-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">Contract ID</span>
                <span className="text-sm font-bold text-white font-mono mt-1">{activeAccount?.account || "---"}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">Net Equity</span>
                <span className={cn(
                    "text-xl font-black mt-0.5 flex items-center gap-2",
                    isActiveDemo ? "text-orange-400" : "text-teal-400"
                )}>
                    <span className="text-xs opacity-50 font-bold">{activeAccount?.currency || "USD"}</span>
                    {parseFloat(activeAccount?.balance || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md flex flex-col items-center md:items-end gap-1">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Operational Status</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white uppercase italic">Command Center Ready</span>
                    <ShieldCheck className={cn("w-5 h-5", isActiveDemo ? "text-orange-500" : "text-teal-500")} />
                </div>
            </div>
            <Button className={cn(
                "w-full md:w-auto font-black h-12 px-8 rounded-xl shadow-2xl uppercase tracking-widest text-xs transition-all duration-300",
                isActiveDemo 
                    ? "bg-orange-500 hover:bg-orange-600 text-black shadow-orange-500/20" 
                    : "bg-teal-500 hover:bg-teal-600 text-black shadow-teal-500/20"
            )}>
              <Zap className="mr-2 w-5 h-5 fill-black" />
              Initialize Engine
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT & CENTER: ACTIVE PANEL + TOOLS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* B. ACTIVE TOOL PANEL */}
          <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm overflow-hidden border-l-4 border-l-teal-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  Active Trading Session
                </CardTitle>
                <Badge className="bg-gray-800 text-gray-400">Idle</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-white/5 rounded-2xl bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                   <Zap className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-gray-300 font-semibold">No active tool currently running</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-[240px]">Select a tool from the marketplace below to start your trading session.</p>
                <Button variant="outline" className="mt-6 border-white/10 hover:bg-white/5 text-white bg-transparent">
                  Browse Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* D. TOOL CARDS (MARKETPLACE) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-teal-500" />
                Tools Marketplace
              </h2>
              <Link href="/studio" className="text-sm text-teal-500 font-bold hover:underline">View All Tools</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                [1, 2].map(i => <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />)
              ) : (
                tools.map(tool => (
                  <Card key={tool.id} className="group bg-zinc-900/30 border-white/5 hover:border-teal-500/50 transition-all duration-300 overflow-hidden relative">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="w-24 h-24 text-white" />
                     </div>
                     <CardHeader className="pb-2 relative z-10">
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="bg-teal-500/10 text-teal-500 border-none text-[10px] font-bold uppercase tracking-wider">
                            {tool.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-green-500 font-mono text-sm font-bold">
                            <ArrowUpRight className="w-4 h-4" />
                            {tool.win_rate}%
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold text-white mt-2">{tool.name}</CardTitle>
                        <CardDescription className="text-gray-400 line-clamp-2 text-xs leading-relaxed">
                          {tool.description}
                        </CardDescription>
                     </CardHeader>
                     <CardContent className="relative z-10 mt-2">
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-400 font-medium">{tool.total_users.toLocaleString()} traders</span>
                          </div>
                          <Link href={`/tool/${tool.id}`}>
                            <Button size="sm" className="bg-white/5 hover:bg-teal-500 hover:text-black text-white font-bold border border-white/10 group-hover:border-teal-500/50 transition-all">
                              <Play className="mr-2 w-3 h-3 fill-current" />
                              Open Tool
                            </Button>
                          </Link>
                        </div>
                     </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: LIVE ACTIVITY + STATS */}
        <div className="space-y-8">
          
          {/* E. QUICK STATS */}
          <Card className="bg-zinc-900 border-white/5 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-teal-500 to-blue-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-widest">Global Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <TrendingUp className="w-5 h-5 text-teal-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">68.2%</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Win Rate Today</span>
                  </div>
                </div>
                <div className="h-10 w-24 bg-teal-500/5 rounded p-1 flex items-end gap-[2px]">
                   {[4,7,3,9,5,8,6,9].map((h, i) => <div key={i} style={{height: `${h*10}%`}} className="flex-1 bg-teal-500/40 rounded-t-[1px]" />)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Trades</span>
                  <span className="text-xl font-bold text-white">12,402</span>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Act. Users</span>
                  <span className="text-xl font-bold text-white">842</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* C. LIVE ACTIVITY FEED */}
          <Card className="bg-zinc-900/50 border-white/5 flex flex-col h-[520px]">
             <CardHeader className="pb-0">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-500" />
                    Live Activity
                  </CardTitle>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500/20" />
                  </div>
                </div>
             </CardHeader>
             <CardContent className="flex-1 overflow-hidden pt-0 px-2">
                <ScrollArea className="h-full px-4">
                  <div className="space-y-6 py-4">
                    {activities.map((act) => (
                      <div key={act.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                            act.activity_type === "TRADE" ? "bg-teal-500/10 border-teal-500/20 text-teal-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                          )}>
                             {act.activity_type === "TRADE" ? <Zap className="w-4 h-4 fill-current" /> : <ShieldCheck className="w-4 h-4" />}
                          </div>
                          <div className="w-[2px] flex-1 bg-white/5 my-2" />
                        </div>
                        <div className="pb-6">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                {act.activity_type}
                              </span>
                              <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                           <p className="text-sm text-gray-300 leading-relaxed font-medium">
                              {act.description}
                           </p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && !isLoading && (
                       <p className="text-center text-gray-500 text-sm py-10 italic">No recent activity detected.</p>
                    )}
                  </div>
                </ScrollArea>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
