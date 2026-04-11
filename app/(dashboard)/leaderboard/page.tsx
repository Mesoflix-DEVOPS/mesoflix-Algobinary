"use client"

import * as React from "react"
import { 
  Trophy, 
  TrendingUp, 
  ArrowUpRight, 
  Medal,
  Users,
  Search,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchLeaderboard() {
      const { data, error } = await supabase
        .from("leaderboard")
        .select(`
          *,
          users (
            username,
            full_name,
            avatar_url
          )
        `)
        .order("rank", { ascending: true })
      
      if (data) setLeaderboard(data)
      setIsLoading(false)
    }
    fetchLeaderboard()
  }, [])

  const topThree = leaderboard.slice(0, 3)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-teal-400" />
            Global Hall of Fame
          </h1>
          <p className="text-gray-400 font-medium">
            Tracking the top performing strategies and traders across the Derivex network.
          </p>
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {isLoading ? (
           [1, 2, 3].map(i => <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse" />)
         ) : (
           topThree.map((entry, i) => (
             <Card key={entry.id} className={cn(
               "relative overflow-hidden border-none shadow-2xl transition-all hover:scale-[1.02]",
               i === 0 ? "bg-gradient-to-br from-teal-500/20 to-black ring-1 ring-teal-500/50" : "bg-zinc-900"
             )}>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Medal className={cn(
                     "w-24 h-24",
                     i === 0 ? "text-teal-400" : i === 1 ? "text-gray-400" : "text-amber-700"
                   )} />
                </div>
                <CardContent className="pt-8 flex flex-col items-center text-center">
                   <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border-2 border-white/10 flex items-center justify-center text-xl font-bold mb-4 shadow-xl">
                      {entry.users?.username?.[0] || "U"}
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <h3 className="text-lg font-bold text-white">{entry.users?.username || "Trader"}</h3>
                        <CheckCircle2 className="w-4 h-4 text-teal-500" />
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-gray-400">Rank #{entry.rank}</Badge>
                   </div>
                   <div className="mt-6 w-full grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                      <div className="text-center">
                         <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Total Profit</span>
                         <span className="text-lg font-bold text-green-400">+${entry.total_profit.toLocaleString()}</span>
                      </div>
                      <div className="text-center">
                         <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Win Rate</span>
                         <span className="text-lg font-bold text-teal-400">{entry.win_rate}%</span>
                      </div>
                   </div>
                </CardContent>
             </Card>
           ))
         )}
      </div>

      {/* FULL LEADERBOARD TABLE */}
      <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
           <div>
             <CardTitle className="text-lg font-bold text-white">Detailed Rankings</CardTitle>
             <CardDescription className="text-gray-500">Live statistics updated every 15 minutes.</CardDescription>
           </div>
           <div className="flex items-center gap-2 bg-black/50 border border-white/5 rounded-xl px-3 w-full md:w-64">
              <Search className="w-4 h-4 text-gray-600" />
              <Input placeholder="Search traders..." className="bg-transparent border-none text-xs text-white focus-visible:ring-0" />
           </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all-time" className="w-full">
            <TabsList className="bg-black/40 border border-white/10 p-1 mb-6 rounded-xl">
               <TabsTrigger value="daily" className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-black font-bold text-xs px-6">Daily</TabsTrigger>
               <TabsTrigger value="weekly" className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-black font-bold text-xs px-6">Weekly</TabsTrigger>
               <TabsTrigger value="all-time" className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-black font-bold text-xs px-6">All-Time</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-time">
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-[80px] text-[10px] uppercase font-bold text-gray-500">Rank</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-gray-500">User</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-gray-500">Profit</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-gray-500">Total Trades</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-gray-500 text-right">Win Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry) => (
                      <TableRow key={entry.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="font-bold text-gray-400">#{entry.rank}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs text-white border border-white/5">
                                {entry.users?.username?.[0] || "U"}
                             </div>
                             <span className="font-semibold text-white">{entry.users?.username || "Trader"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-400">+${entry.total_profit.toLocaleString()}</TableCell>
                        <TableCell className="text-gray-400">{entry.total_trades.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-2">
                             <span className="font-bold text-teal-400">{entry.win_rate}%</span>
                             <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                                <div className="h-full bg-teal-500/50 rounded-full" style={{ width: `${entry.win_rate}%` }} />
                             </div>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {leaderboard.length === 0 && !isLoading && (
                       <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-gray-500 italic">No rankings available yet.</TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
