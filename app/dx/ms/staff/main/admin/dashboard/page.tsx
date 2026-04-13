"use client"

import * as React from "react"
import { 
  BarChart3, 
  Users, 
  Settings, 
  Bell, 
  Newspaper, 
  LogOut, 
  Menu, 
  X,
  Search,
  Filter,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  UserX,
  MessageSquare,
  Zap,
  Globe,
  Loader2,
  MoreVertical,
  Activity,
  Trophy,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/db"
import { SupportChat } from "@/components/admin/support-chat"
import { UserDetailDrawer } from "@/components/admin/user-detail"

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState("overview")
  const [users, setUsers] = React.useState<any[]>([])
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [stats, setStats] = React.useState({
    activeTraders: 0,
    globalVolume: 0,
    uptime: "99.99%",
    reports: 0
  })
  const [news, setNews] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Fetch data
  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // 1. Fetch Users
        const { data: usersData, count: userCount } = await supabase
          .from("users")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
        
        // 2. Fetch Global Volume (Sum of trades)
        const { data: tradesData } = await supabase
          .from("trades")
          .select("profit_loss")
          .not("profit_loss", "is", null)
        
        const totalVol = tradesData?.reduce((acc: number, curr: any) => acc + Math.abs(Number(curr.profit_loss)), 0) || 0
        
        // 3. Fetch News
        const { data: newsData } = await supabase
          .from("trading_news")
          .select("*")
          .order("created_at", { ascending: false })
        
        if (usersData) setUsers(usersData)
        if (newsData) setNews(newsData)
        
        setStats({
          activeTraders: userCount || 0,
          globalVolume: totalVol,
          uptime: "99.98%",
          reports: 0 // Placeholder until reporting system is live
        })
      } catch (err) {
        console.error("Fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "blocked" : "active"
    try {
        const { error } = await supabase.from("users").update({ status: nextStatus }).eq("deriv_account_id", userId)
        if (!error) {
            setUsers(prev => prev.map(u => u.deriv_account_id === userId ? { ...u, status: nextStatus } : u))
            if (selectedUser?.deriv_account_id === userId) {
                setSelectedUser((prev: any) => ({ ...prev, status: nextStatus }))
            }
        }
    } catch (err) {
        console.error("Update error:", err)
    }
  }

  const broadcastNotification = async (targetUserId: string, title: string, message: string) => {
    try {
        await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: targetUserId, title, message, type: "info" })
        })
        alert("Notification sent successfully")
    } catch (err) {
        console.error("Broadcast error:", err)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-8">
        <div className="px-6 mb-12 flex items-center gap-3">
            <div className="p-2 bg-teal-500 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-tighter">Admin Central</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Internal Control</span>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            {[
                { id: "overview", label: "Dashboard", icon: BarChart3 },
                { id: "users", label: "User Control", icon: Users },
                { id: "leaderboard", label: "Leaderboard", icon: Trophy },
                { id: "news", label: "News & Alerts", icon: Newspaper },
                { id: "broadcast", label: "System Broadcast", icon: MessageSquare },
                { id: "settings", label: "Security", icon: Settings },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                        activeTab === item.id ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20" : "text-gray-500 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                </button>
            ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-500/10 rounded-xl" onClick={() => window.location.href = "/"}>
                <LogOut className="w-4 h-4 mr-2" />
                Terminal Logout
            </Button>
        </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 border-r border-white/5 bg-zinc-950 flex-col shrink-0">
         <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 bg-black flex flex-col overflow-hidden">
        {/* Responsive Header */}
        <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-md p-4 md:p-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden text-white">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="bg-zinc-950 border-white/5 p-0 w-64">
                        <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
                <div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        {activeTab === "overview" && "System Overview"}
                        {activeTab === "users" && "User Terminal"}
                        {activeTab === "leaderboard" && "Leaderboard"}
                        {activeTab === "news" && "News Management"}
                        {activeTab === "broadcast" && "Broadcast Center"}
                        {activeTab === "settings" && "Platform Security"}
                        <Badge className="bg-teal-500/10 text-teal-500 border-teal-500/20 hidden sm:inline-flex">LIVE</Badge>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] font-black text-teal-500 uppercase">Status</span>
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                        Operational <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                    </span>
                </div>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-xl h-10 px-4 text-xs font-bold">
                    Export
                </Button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">

        {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Command Stats</h2>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-teal-500/20 text-teal-500 bg-teal-500/5 hover:bg-teal-500/10 text-[9px] font-black uppercase px-4 h-8 rounded-lg"
                        onClick={async () => {
                            const res = await fetch("/api/admin/leaderboard/sync", { method: "POST" });
                            if (res.ok) alert("Leaderboard scores recalculated successfully.");
                        }}
                    >
                        Sync Leaderboard Ranks
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Active Traders", value: stats.activeTraders, delta: "+12%", icon: Users, color: "teal" },
                        { label: "Global Volume", value: `$${stats.globalVolume.toLocaleString()}`, delta: "+5.4%", icon: Zap, color: "orange" },
                        { label: "System Uptime", value: stats.uptime, delta: "STABLE", icon: Globe, color: "blue" },
                        { label: "Reports Filed", value: stats.reports, delta: "-2", icon: Bell, color: "red" },
                    ].map((stat) => (
                        <Card key={stat.label} className="bg-zinc-950 border-white/5 hover:border-white/10 transition-all rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-${stat.color}-500/10`} />
                            <div className="flex justify-between items-start relative z-10">
                                <div className={cn(
                                    "p-3 rounded-2xl flex items-center justify-center",
                                    stat.color === 'teal' ? "bg-teal-500/10 text-teal-500" :
                                    stat.color === 'orange' ? "bg-orange-500/10 text-orange-500" :
                                    stat.color === 'blue' ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"
                                )}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <Badge className="bg-white/5 text-gray-500 text-[9px] border-none">{stat.delta}</Badge>
                            </div>
                            <div className="mt-8 relative z-10">
                                <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 bg-zinc-950 border-white/5 rounded-3xl p-8 shadow-2xl">
                        <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter">Growth Metrics</CardTitle>
                                <CardDescription className="text-gray-500">Institutional user acquisition over 30 days</CardDescription>
                            </div>
                            <div className="h-10 px-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2 text-xs font-bold">
                                <Search className="w-3 h-3" /> Filters
                            </div>
                        </CardHeader>
                        <div className="h-64 flex items-end justify-between gap-4">
                            {[40, 70, 45, 90, 65, 80, 50, 60, 85, 100].map((h, i) => (
                                <div key={i} className="flex-1 bg-teal-500/20 rounded-t-lg transition-all hover:bg-teal-500/40 relative group" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded hidden group-hover:block transition-all shadow-xl">
                                        {h} Users
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="bg-zinc-950 border-white/5 rounded-3xl p-8 shadow-2xl">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-xl font-black uppercase tracking-tighter">Recent Audit</CardTitle>
                        </CardHeader>
                        <div className="space-y-6">
                            {[
                                { user: "MasterAdmin", action: "Updated News Feed", time: "2 min ago" },
                                { user: "SystemAuth", action: "2FA Verified ROT903", time: "15 min ago" },
                                { user: "Staff_GT", action: "Blocked User DOT032", time: "1 hour ago" },
                                { user: "MasterAdmin", action: "Global Broadcast", time: "4 hours ago" },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white"><span className="text-teal-400 font-black">{log.user}</span> {log.action}</p>
                                        <p className="text-[10px] text-gray-600 font-medium uppercase mt-0.5">{log.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full mt-6 border-white/5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">View Full Logs</Button>
                    </Card>
                </div>
            </div>
        )}

        {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <Card className="bg-zinc-950 border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-6 justify-between mb-8">
                        <div className="relative group flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input 
                                placeholder="Search by Account ID, Nickname or Email..." 
                                className="bg-white/5 border-white/5 pl-12 h-12 rounded-xl font-bold focus:ring-teal-500/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="border-white/5 rounded-xl bg-white/5 h-12 px-6 text-xs font-black uppercase tracking-widest"><Filter className="w-3 h-3 mr-2"/> Filters</Button>
                            <Button className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl h-12 px-6 font-black uppercase tracking-widest border-none">Reload Data</Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">User Identity</th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Deriv Account</th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Balance</th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="text-right py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Operations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(u => 
                                    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    u.deriv_account_id?.toLowerCase().includes(searchQuery.toLowerCase())
                                ).map((u) => (
                                    <tr 
                                        key={u.id} 
                                        className="border-b border-white/5 hover:bg-white/[0.04] group transition-all cursor-pointer"
                                        onClick={() => {
                                            setSelectedUser(u)
                                            setIsDetailOpen(true)
                                        }}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 overflow-hidden font-black text-xs uppercase">
                                                    {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.username?.[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{u.username || "Anonymous"}</span>
                                                    <span className="text-[10px] text-gray-600 italic font-mono lowercase">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-mono text-[11px] h-7 px-3">
                                                {u.deriv_account_id || "N/A"}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-black text-teal-500">${u.balance?.toLocaleString() || "0.00"}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge className={cn(
                                                "h-6 px-2 text-[9px] font-black uppercase tracking-widest border-none",
                                                u.status === 'blocked' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                            )}>
                                                {u.status || 'active'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl transition-all",
                                                        u.status === 'blocked' ? "text-green-500 hover:bg-green-500/10" : "text-red-500 hover:bg-red-500/10"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleToggleUserStatus(u.deriv_account_id, u.status)
                                                    }}
                                                >
                                                    {u.status === 'blocked' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-gray-500" onClick={(e) => e.stopPropagation()}><MoreVertical className="w-4 h-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 text-white p-2">
                                                        <DropdownMenuItem className="hover:bg-white/5 rounded-lg text-xs font-bold" onClick={(e) => { e.stopPropagation(); broadcastNotification(u.deriv_account_id, "Official Message", "Your trading profile has been reviewed by the admin team.")}}>Send DM</DropdownMenuItem>
                                                        <DropdownMenuItem className="hover:bg-white/5 rounded-lg text-xs font-bold" onClick={(e) => { e.stopPropagation(); setSelectedUser(u); setIsDetailOpen(true) }}>View Dossier</DropdownMenuItem>
                                                        <DropdownMenuItem className="hover:bg-red-500/10 rounded-lg text-xs font-bold text-red-500">Hard Reset Token</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        )}

        {activeTab === "broadcast" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <Tabs defaultValue="support" className="w-full">
                    <TabsList className="bg-zinc-950 border border-white/5 rounded-2xl p-1 mb-6">
                        <TabsTrigger value="support" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-teal-600">Active Support</TabsTrigger>
                        <TabsTrigger value="global" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-teal-600">Global Broadcast</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="support">
                        <SupportChat />
                    </TabsContent>
                    
                    <TabsContent value="global">
                        <Card className="bg-zinc-950 border-white/5 rounded-3xl p-8 shadow-2xl">
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="text-center">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Platform Broadcast</h3>
                                    <p className="text-gray-500 text-sm italic">This will send a notification to EVERY registered user in the system.</p>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Broadcast Title</label>
                                        <Input id="broadcast-title" placeholder="System Maintenance..." className="bg-white/5 border-white/5 rounded-xl h-12 text-sm font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Core Message</label>
                                        <textarea id="broadcast-message" className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm font-bold min-h-[120px] focus:outline-none focus:border-teal-500/30" placeholder="Type your global announcement here..." />
                                    </div>
                                    <Button 
                                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest h-14 rounded-2xl border-none"
                                        onClick={async () => {
                                            const title = (document.getElementById("broadcast-title") as HTMLInputElement).value;
                                            const message = (document.getElementById("broadcast-message") as HTMLTextAreaElement).value;
                                            const res = await fetch("/api/notifications", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ userId: "all", title, message, type: "broadcast" })
                                            });
                                            if (res.ok) alert("Global broadcast initiated successfully.");
                                        }}
                                    >
                                        Initialize Global Transmission <BarChart3 className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        )}

        {activeTab === "news" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-zinc-950 border-white/5 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tighter">News Management</CardTitle>
                            <CardDescription className="text-gray-500">Curate and publish updates to the global trading feed</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest px-6 rounded-xl border-none">Create Article</Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle className="font-black uppercase tracking-widest">New Transmission</DialogTitle>
                                    <DialogDescription className="text-gray-500 text-xs">
                                        Input the article data for global distribution. All traders will receive this update instantly.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-500">Headline</label>
                                        <Input id="news-title" className="bg-white/5 border-white/5" placeholder="Bitcoin hits new ATH..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-500">Content</label>
                                        <textarea id="news-content" className="w-full bg-white/5 border border-white/5 rounded-lg p-3 text-sm min-h-[100px]" placeholder="Detailed analysis..." />
                                    </div>
                                    <Button 
                                        className="w-full bg-teal-600 font-black uppercase tracking-widest"
                                        onClick={async () => {
                                            const title = (document.getElementById("news-title") as HTMLInputElement).value;
                                            const content = (document.getElementById("news-content") as HTMLTextAreaElement).value;
                                            const res = await fetch("/api/admin/news", {
                                                method: "POST",
                                                body: JSON.stringify({ title, content, category: "Market" })
                                            });
                                            if (res.ok) {
                                                alert("Article published successfully");
                                                window.location.reload();
                                            }
                                        }}
                                    >
                                        Publish Now
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {/* Simplified News List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.length === 0 ? (
                            <div className="col-span-full py-20 text-center opacity-20">
                                <Newspaper className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-xs font-black uppercase">No articles found</p>
                            </div>
                        ) : news.map((item) => (
                            <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-teal-500/20 transition-all group">
                                <div className="h-32 mb-4 rounded-xl overflow-hidden bg-zinc-900">
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover grayscale-[0.8] group-hover:grayscale-0 transition-all" />
                                </div>
                                <h4 className="font-bold text-white mb-2 line-clamp-2">{item.title}</h4>
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-[9px] uppercase font-black border-white/10">{item.category}</Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500"><MoreVertical className="w-4 h-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        )}
        
        {activeTab === "leaderboard" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-zinc-950 border-white/5 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tighter">Leaderboard Management</CardTitle>
                            <CardDescription className="text-gray-500">View and sync global trader rankings</CardDescription>
                        </div>
                        <Button 
                            className="bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest px-6 rounded-xl border-none"
                            onClick={async () => {
                                const res = await fetch("/api/admin/leaderboard/sync", { method: "POST" });
                                if (res.ok) alert("Leaderboard synchronized successfully.");
                            }}
                        >
                            Sync Rankings
                        </Button>
                    </div>
                    <div className="py-20 text-center opacity-20 border border-dashed border-white/10 rounded-2xl">
                        <Trophy className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest mt-2">Rankings engine active</p>
                    </div>
                </Card>
            </div>
        )}

        {activeTab === "settings" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-zinc-950 border-white/5 rounded-3xl p-8 shadow-2xl">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <Shield className="w-6 h-6 text-teal-500" /> Platform Security
                        </CardTitle>
                        <CardDescription className="text-gray-500">Configure global application security</CardDescription>
                    </CardHeader>
                    <div className="space-y-6">
                        <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                            <h4 className="font-bold text-white uppercase tracking-widest text-sm mb-2">Row Level Security (RLS) Policies</h4>
                            <p className="text-xs text-gray-400 mb-6">Database policies and schema lockdown configuration for users, trades, news, and community.</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-zinc-950 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] uppercase font-black tracking-widest border-none">Users Secured</Badge>
                                    <span className="text-[9px] text-gray-500 mt-2">System R/W Only</span>
                                </div>
                                <div className="bg-zinc-950 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] uppercase font-black tracking-widest border-none">Trades Secured</Badge>
                                    <span className="text-[9px] text-gray-500 mt-2">System R/W Only</span>
                                </div>
                                <div className="bg-zinc-950 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] uppercase font-black tracking-widest border-none">News Secured</Badge>
                                    <span className="text-[9px] text-gray-500 mt-2">Public Select Array</span>
                                </div>
                                <div className="bg-zinc-950 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] uppercase font-black tracking-widest border-none">Chat Secured</Badge>
                                    <span className="text-[9px] text-gray-500 mt-2">Auth Required</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        )}
        </div>
      </main>

      <UserDetailDrawer 
        user={selectedUser} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        onStatusToggle={handleToggleUserStatus}
      />
    </div>
  )
}
