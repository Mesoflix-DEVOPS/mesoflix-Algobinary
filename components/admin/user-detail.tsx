"use client"

import * as React from "react"
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  UserX, 
  UserCheck, 
  MessageSquare,
  ChevronRight,
  Loader2,
  Calendar,
  Wallet
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"

interface UserDetailProps {
  user: any | null
  isOpen: boolean
  onClose: () => void
  onStatusToggle: (userId: string, currentStatus: string) => void
}

export function UserDetailDrawer({ user, isOpen, onClose, onStatusToggle }: UserDetailProps) {
  const [trades, setTrades] = React.useState<any[]>([])
  const [performanceData, setPerformanceData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!user || !isOpen) return

    async function fetchUserData() {
      setIsLoading(true)
      try {
        const { data: tradesData } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id) // Assuming user.id corresponds to uuid in trades
          .order("entry_time", { ascending: false })

        if (tradesData) {
          setTrades(tradesData)
          
          // Generate performance data for chart
          let cumulative = Number(user.balance) || 0
          const chartData = tradesData
            .slice(0, 20) // last 20 trades
            .reverse()
            .map((t, i) => {
              cumulative += Number(t.profit_loss || 0)
              return {
                index: i,
                pnl: cumulative,
                time: new Date(t.entry_time).toLocaleDateString()
              }
            })
          setPerformanceData(chartData)
        }
      } catch (err) {
        console.error("Error fetching user details:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user, isOpen])

  if (!user) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-zinc-950 border-white/5 p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-6 border-b border-white/5 bg-zinc-900/40">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 text-2xl font-black uppercase overflow-hidden">
                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user.username[0]}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <SheetTitle className="text-xl font-black text-white uppercase tracking-tighter">{user.username}</SheetTitle>
                        <Badge className={user.status === 'blocked' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}>
                            {user.status || 'Active'}
                        </Badge>
                    </div>
                    <SheetDescription className="text-xs text-gray-500 italic font-mono lowercase">
                        {user.deriv_account_id} • Joined {new Date(user.created_at).toLocaleDateString()}
                    </SheetDescription>
                </div>
            </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total PNL</span>
                        <div className="flex items-center gap-2">
                             <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                             <span className="text-lg font-black text-white">$1,240</span>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Win Rate</span>
                        <span className="text-lg font-black text-white">{user.win_rate || "0"}%</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Active Bot</span>
                        <Badge variant="outline" className="text-[9px] uppercase border-teal-500/30 text-teal-500 h-5 mt-1">SESSION_X</Badge>
                    </div>
                </div>

                {/* Account Movement Chart */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-teal-500" /> Equity Curve
                        </h5>
                    </div>
                    <div className="h-64 w-full bg-white/[0.01] rounded-3xl border border-white/5 p-4 flex items-center justify-center">
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                        ) : performanceData.length > 0 ? (
                            <ChartContainer config={{ pnl: { label: "Profit", color: "#0d9488" } }} className="h-full w-full">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="index" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="pnl" 
                                        stroke="#0d9488" 
                                        strokeWidth={3} 
                                        dot={false}
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ChartContainer>
                        ) : (
                            <p className="text-[10px] text-gray-600 uppercase font-black italic">Insufficient trade history for analytics</p>
                        )}
                    </div>
                </div>

                {/* Detail Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <Wallet className="w-3 h-3" /> Financial Details
                        </h5>
                        <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-gray-500">Current Balance</span>
                                <span className="text-white">${Number(user.balance).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-gray-500">Withdrawal Limit</span>
                                <span className="text-white">UNRESTRICTED</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-gray-500">Security Multi-factor</span>
                                <Badge className="bg-teal-500/10 text-teal-500 text-[8px] h-4">ENABLED</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trade History Terminal */}
                <div className="space-y-4 pb-12">
                     <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-3 h-3" /> Institutional Record
                    </h5>
                    <div className="space-y-2">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)
                        ) : trades.length === 0 ? (
                            <p className="text-[10px] text-center py-8 text-gray-600 uppercase font-black italic">No trades recorded for this identity.</p>
                        ) : trades.map((trade) => (
                            <div key={trade.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        trade.result === 'WIN' ? "bg-teal-500/10 text-teal-500" : "bg-red-500/10 text-red-500"
                                    )}>
                                        {trade.result === 'WIN' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white uppercase">{trade.symbol}</p>
                                        <p className="text-[9px] text-gray-500 font-bold">{new Date(trade.entry_time).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-xs font-black",
                                        trade.result === 'WIN' ? "text-teal-500" : "text-red-500"
                                    )}>
                                        {trade.profit_loss > 0 ? '+' : ''}{trade.profit_loss}
                                    </p>
                                    <Badge variant="outline" className="text-[8px] h-4 border-white/10 text-gray-500">{trade.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>

        {/* Action Panel */}
        <div className="p-6 border-t border-white/5 bg-zinc-950 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
                <Button 
                    variant="outline" 
                    className="border-white/10 text-white hover:bg-white/5 rounded-xl h-12 font-black uppercase text-[10px] tracking-widest"
                    onClick={() => onStatusToggle(user.deriv_account_id, user.status)}
                >
                    {user.status === 'blocked' ? (
                        <>Unblock Account <UserCheck className="w-3 h-3 ml-2" /></>
                    ) : (
                        <>Freeze Account <UserX className="w-3 h-3 ml-2" /></>
                    )}
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl h-12 font-black uppercase text-[10px] tracking-widest border-none">
                    Send Direct Message <MessageSquare className="w-3 h-3 ml-2" />
                </Button>
            </div>
            <Button variant="ghost" className="text-red-500 text-[10px] font-black uppercase opacity-60 hover:opacity-100 italic">
                Hard System Purge (Session Clear)
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
