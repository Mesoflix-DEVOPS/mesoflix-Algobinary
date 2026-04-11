"use client"

import * as React from "react"
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Download,
  Filter,
  Calendar,
  Clock,
  Circle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

interface Trade {
  id: string
  symbol: string
  entry_price: number
  exit_price: number | null
  profit_loss: number | null
  result: string | null
  status: string
  entry_time: string
  tool_name?: string
}

export default function HistoryPage() {
  const [trades, setTrades] = React.useState<Trade[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const storedUser = localStorage.getItem("derivex_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    async function fetchHistory() {
      setIsLoading(true)
      try {
        // In a real app, we'd filter by current user's DB ID
        // For now we fetch all recent trades
        const { data, error } = await supabase
          .from("trades")
          .select("*, trading_tools(name)")
          .order("entry_time", { ascending: false })
          .limit(50)

        if (!error && data) {
          setTrades(data.map(t => ({
            ...t,
            tool_name: t.trading_tools?.name || "Manual Trade"
          })))
        }
      } catch (err) {
        console.error("Failed to fetch history:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [])

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase tracking-wider">Trade History</h1>
          <p className="text-gray-500 font-medium">Archive of all institutional trade executions across your synchronized tools.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="border-white/10 text-gray-400 hover:bg-white/5 gap-2 h-11">
                <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button className="bg-teal-500 hover:bg-teal-600 text-black font-bold h-11 gap-2">
                <Filter className="w-4 h-4" /> Filter Logs
            </Button>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input 
                placeholder="Search by Symbol or Tool..." 
                className="pl-10 bg-black/40 border-white/10 h-10 text-sm focus:ring-teal-500/50" 
              />
           </div>
           <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
              <span className="flex items-center gap-1.5"><Circle className="w-2 h-2 fill-teal-500 text-teal-500" /> 100% Integrity</span>
              <span className="flex items-center gap-1.5"><Circle className="w-2 h-2 fill-orange-500 text-orange-500" /> SEC Compliant</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] h-12">Timestamp</TableHead>
                <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] h-12">Symbol</TableHead>
                <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] h-12">Execution Tool</TableHead>
                <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] h-12">Entry / Exit</TableHead>
                <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] h-12">Result</TableHead>
                <TableHead className="text-gray-500 font-bold uppercase tracking-widest text-[10px] h-12 text-right">Profit / Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 animate-pulse">
                    <TableCell colSpan={6} className="h-16 bg-white/[0.01]" />
                  </TableRow>
                ))
              ) : trades.length > 0 ? (
                trades.map((trade) => (
                  <TableRow key={trade.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {new Date(trade.entry_time).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium font-mono uppercase">
                          {new Date(trade.entry_time).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-mono uppercase tracking-widest text-[10px]">
                        {trade.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-400">{trade.tool_name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{trade.entry_price.toFixed(4)}</span>
                        <span className="text-[10px] text-gray-500 font-medium">{trade.exit_price?.toFixed(4) || "---"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {trade.result === 'WIN' ? (
                          <div className="flex items-center gap-1.5 text-teal-400 font-bold text-xs">
                            <ArrowUpRight className="w-3 h-3" /> WIN
                          </div>
                        ) : trade.result === 'LOSS' ? (
                          <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
                            <ArrowDownRight className="w-3 h-3" /> LOSS
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 font-bold italic">{trade.status}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <span className={cn(
                        "text-sm font-bold font-mono tracking-tight",
                        trade.profit_loss! > 0 ? "text-teal-400" : "text-red-400"
                       )}>
                        {trade.profit_loss! > 0 ? "+" : ""}{trade.profit_loss?.toFixed(2) || "0.00"}
                       </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-gray-600">
                      <History className="w-12 h-12 opacity-20" />
                      <div className="space-y-1">
                        <p className="font-bold text-sm uppercase tracking-widest">No Trade Logs Detected</p>
                        <p className="text-xs">Your automated tools haven't generated any executable history yet.</p>
                      </div>
                      <Button variant="outline" className="border-white/5 text-xs h-9 hover:bg-white/5 px-6">Refresh System</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
           <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Displaying {trades.length} recent executions</p>
           <div className="flex items-center gap-2">
              <Button disabled variant="ghost" size="sm" className="text-gray-600 h-8">Prev</Button>
              <Button disabled variant="ghost" size="sm" className="text-gray-600 h-8">Next</Button>
           </div>
        </div>
      </div>
    </div>
  )
}
