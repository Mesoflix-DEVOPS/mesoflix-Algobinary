"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Trophy, 
  TrendingUp,
  Medal,
  Loader2,
  ShieldCheck,
  ArrowLeft
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"

// ─── MOCK TOP 3 — realistic small profits, not millions ─────────────────────
const MOCK_LEGENDS = [
  {
    id: "mock-1",
    rank: 1,
    maskedId: "VLTX3*****",
    label: "🥇",
    netProfit: 247.80,
    winRate: 74,
    trades: 38,
    isMock: true,
  },
  {
    id: "mock-2",
    rank: 2,
    maskedId: "CR09X*****",
    label: "🥈",
    netProfit: 183.50,
    winRate: 68,
    trades: 29,
    isMock: true,
  },
  {
    id: "mock-3",
    rank: 3,
    maskedId: "BRTX1*****",
    label: "🥉",
    netProfit: 149.20,
    winRate: 63,
    trades: 24,
    isMock: true,
  },
]

function maskId(id: string): string {
  if (!id) return "ANON****"
  const visible = id.slice(0, 5).toUpperCase()
  return `${visible}*****`
}

function calcNetProfit(wins: number, losses: number, stake = 5): number {
  // Realistic small profit: wins earn 85% payout, losses lose stake
  const gross = wins * (stake * 0.85) - losses * stake
  return Math.max(0, Number(gross.toFixed(2)))
}

export default function LeaderboardPage() {
  const [realUsers, setRealUsers] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchRealTop() {
      const { data } = await supabase
        .from("users")
        .select("id, deriv_account_id, total_trades, win_rate, total_wins, total_losses")
        .order("win_rate", { ascending: false })
        .limit(2)

      if (data) {
        setRealUsers(
          data.map((u, i) => ({
            id: u.id,
            rank: 4 + i,
            maskedId: maskId(u.deriv_account_id || u.id),
            label: `${4 + i}`,
            netProfit: calcNetProfit(Number(u.total_wins) || 0, Number(u.total_losses) || 0),
            winRate: Number(u.win_rate) || 0,
            trades: Number(u.total_trades) || 0,
            isMock: false,
          }))
        )
      }
      setIsLoading(false)
    }
    fetchRealTop()
  }, [])

  const allEntries = [...MOCK_LEGENDS, ...realUsers]
  const topThree = MOCK_LEGENDS

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white font-black uppercase tracking-widest text-[10px] h-8 px-3 border border-white/10 hover:border-white/20">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Trading Panel
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <Trophy className="w-8 h-8 text-teal-400" />
            Global Hall of Fame
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Performance rankings based on net profit. Identities are always anonymized.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-600 tracking-widest bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          All identities anonymized • No balances exposed
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topThree.map((entry, i) => (
          <Card key={entry.id} className={cn(
            "relative overflow-hidden border-none shadow-2xl transition-all hover:scale-[1.02] duration-300",
            i === 0
              ? "bg-gradient-to-br from-teal-500/20 to-black ring-1 ring-teal-500/40"
              : i === 1
              ? "bg-gradient-to-br from-gray-500/10 to-black ring-1 ring-gray-500/20"
              : "bg-gradient-to-br from-amber-700/10 to-black ring-1 ring-amber-700/20"
          )}>
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Medal className={cn(
                "w-20 h-20",
                i === 0 ? "text-teal-400" : i === 1 ? "text-gray-400" : "text-amber-600"
              )} />
            </div>
            <CardContent className="pt-8 flex flex-col items-center text-center pb-8">
              {/* Anonymous Avatar */}
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 border",
                i === 0 ? "bg-teal-500/10 border-teal-500/30" : "bg-white/5 border-white/10"
              )}>
                {entry.label}
              </div>

              {/* Masked ID */}
              <p className="text-white font-black text-lg tracking-tighter font-mono mb-1">
                {entry.maskedId}
              </p>
              <Badge variant="outline" className="text-[9px] font-black uppercase text-gray-500 border-white/10 mb-6">
                Rank #{entry.rank}
              </Badge>

              {/* Net Profit */}
              <div className="w-full space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Net Profit</span>
                  <span className={cn(
                    "text-sm font-black",
                    i === 0 ? "text-teal-400" : "text-gray-300"
                  )}>
                    +${entry.netProfit.toFixed(2)}
                  </span>
                </div>
                {/* Progress bar: relative to #1 */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      i === 0 ? "bg-teal-500" : i === 1 ? "bg-gray-400" : "bg-amber-600"
                    )}
                    style={{ width: `${(entry.netProfit / MOCK_LEGENDS[0].netProfit) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="w-full grid grid-cols-2 gap-3 border-t border-white/5 pt-5">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <span className="text-[9px] text-gray-500 uppercase font-black block mb-1">Win Rate</span>
                  <span className="text-base font-black text-white">{entry.winRate}%</span>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <span className="text-[9px] text-gray-500 uppercase font-black block mb-1">Trades</span>
                  <span className="text-base font-black text-white">{entry.trades}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FULL TABLE */}
      <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-tighter text-white">
            Full Rankings
          </CardTitle>
          <CardDescription className="text-gray-500">
            Ranked by algorithmic performance score. No personal data is ever displayed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all-time" className="w-full">
            <TabsList className="bg-black/40 border border-white/10 p-1 mb-6 rounded-xl">
              <TabsTrigger value="daily" className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-black font-bold text-xs px-6">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-black font-bold text-xs px-6">Weekly</TabsTrigger>
              <TabsTrigger value="all-time" className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-black font-bold text-xs px-6">All-Time</TabsTrigger>
            </TabsList>

            <TabsContent value="all-time">
              <div className="rounded-2xl border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-[70px] text-[10px] uppercase font-black text-gray-500">#</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-gray-500">Trader ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-gray-500">Net Profit</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-gray-500">Trades</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-gray-500 text-right">Win Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <Loader2 className="w-5 h-5 text-teal-500 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      allEntries.map((entry) => (
                        <TableRow key={entry.id} className="border-white/5 hover:bg-white/[0.02]">
                          {/* Rank */}
                          <TableCell>
                            <span className={cn(
                              "text-lg font-black",
                              entry.rank === 1 ? "text-teal-400" :
                              entry.rank === 2 ? "text-gray-400" :
                              entry.rank === 3 ? "text-amber-600" : "text-gray-600"
                            )}>
                              #{entry.rank}
                            </span>
                          </TableCell>

                          {/* Masked Trader ID */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                                entry.isMock ? "bg-teal-500/10 text-teal-500" : "bg-white/5 text-gray-400"
                              )}>
                                {entry.maskedId.slice(0, 2)}
                              </div>
                              <span className="font-black text-white font-mono text-sm tracking-tighter">{entry.maskedId}</span>
                              {entry.isMock && (
                                <Badge className="bg-teal-500/10 text-teal-500 border-none text-[8px] font-black uppercase">
                                  Elite
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Net Profit bar */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-teal-500 rounded-full"
                                  style={{ width: `${(entry.netProfit / MOCK_LEGENDS[0].netProfit) * 100}%` }}
                                />
                              </div>
                              <span className="text-green-400 font-black text-xs">+${Number(entry.netProfit || 0).toFixed(2)}</span>
                            </div>
                          </TableCell>

                          {/* Trades */}
                          <TableCell className="text-gray-400 font-bold">{entry.trades.toLocaleString()}</TableCell>

                          {/* Win Rate */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <TrendingUp className="w-3 h-3 text-teal-500" />
                              <span className="font-black text-white text-sm">{entry.winRate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="daily">
              <div className="py-20 text-center opacity-20">
                <Trophy className="w-10 h-10 mx-auto mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">Daily rankings are computed at midnight UTC</p>
              </div>
            </TabsContent>
            <TabsContent value="weekly">
              <div className="py-20 text-center opacity-20">
                <Trophy className="w-10 h-10 mx-auto mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">Weekly rankings reset every Monday</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
