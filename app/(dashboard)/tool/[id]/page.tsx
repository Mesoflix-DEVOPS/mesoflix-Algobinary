"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { 
  Zap, 
  Play, 
  Square, 
  Settings2, 
  BarChart3, 
  History, 
  ChevronRight,
  TrendingUp,
  Signal,
  ArrowRightLeft,
  Timer,
  Activity
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"

export default function ToolCockpitPage() {
  const params = useParams()
  const [tool, setTool] = React.useState<any>(null)
  const [isRunning, setIsRunning] = React.useState(false)
  const [trades, setTrades] = React.useState<any[]>([])
  const [stats, setStats] = React.useState({
    total: 0,
    wins: 0,
    losses: 0,
    profit: 0
  })

  React.useEffect(() => {
    async function fetchTool() {
      const { data, error } = await supabase
        .from("trading_tools")
        .select("*")
        .eq("id", params.id)
        .single()
      
      if (data) setTool(data)
    }
    fetchTool()
  }, [params.id])

  const toggleBot = () => {
    setIsRunning(!isRunning)
    if (!isRunning) {
      // Simulate live activity
      const mockTrade = {
        id: Math.random().toString(36).substr(2, 9),
        symbol: "Vol 75",
        entry: "154,230.12",
        exit: "154,235.80",
        profit: 4.50,
        result: "WIN",
        time: new Date().toLocaleTimeString()
      }
      setTrades(prev => [mockTrade, ...prev])
      setStats(prev => ({
        total: prev.total + 1,
        wins: prev.wins + 1,
        losses: prev.losses,
        profit: prev.profit + 4.50
      }))
    }
  }

  if (!tool) return <div className="p-8 text-white">Loading cockpit...</div>

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* COCKPIT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">Tools</Link>
             <ChevronRight className="w-4 h-4 text-gray-700" />
             <span className="text-teal-400 font-bold">{tool.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            {tool.name}
            <Badge className={cn(
               "ml-2 text-[10px] uppercase font-bold px-2 py-0.5",
               isRunning ? "bg-teal-500 text-black shadow-[0_0_15px_rgba(20,184,166,0.5)]" : "bg-zinc-800 text-gray-500"
            )}>
              {isRunning ? "Live & Running" : "Standby Mode"}
            </Badge>
          </h1>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-2 flex gap-2">
            <Button 
                onClick={toggleBot}
                className={cn(
                    "h-12 px-8 font-bold transition-all duration-300 rounded-xl shadow-xl",
                    isRunning 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white" 
                        : "bg-teal-500 text-black shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-105"
                )}
            >
                {isRunning ? (
                    <><Square className="mr-2 w-4 h-4 fill-current" /> Stop Bot</>
                ) : (
                    <><Play className="mr-2 w-4 h-4 fill-current" /> Start Bot</>
                )}
            </Button>
            <Button variant="outline" className="h-12 w-12 p-0 border-white/10 text-gray-400 hover:bg-white/5 rounded-xl">
               <Settings2 className="w-5 h-5" />
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TOOL INFO & SETTINGS */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-zinc-900/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-widest">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {[
                 { label: "Stake", value: "$10.00" },
                 { label: "Prediction", value: "Over 5" },
                 { label: "Interval", value: "1 Tick" },
                 { label: "Market", value: "Volatility 75" },
               ].map((item) => (
                 <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                    <span className="text-xs text-white font-bold">{item.value}</span>
                 </div>
               ))}
               <Button variant="link" className="p-0 text-teal-500 text-xs font-bold hover:no-underline">Reset to Defaults</Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500/5 to-transparent border-teal-500/10">
             <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-teal-400" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-white">Heatmap Status</h4>
                      <p className="text-[10px] text-gray-500">Last 100 ticks analysis</p>
                   </div>
                </div>
                {/* Simulated Heatmap */}
                <div className="grid grid-cols-10 gap-1 mt-4">
                   {[...Array(10)].map((_, i) => (
                     <div key={i} className="space-y-1">
                        <div 
                          className="w-full bg-teal-500/20 rounded-sm transition-all duration-1000"
                          style={{ height: `${Math.random() * 40 + 10}px`, opacity: i % 3 === 0 ? 0.8 : 0.3 }}
                        />
                        <span className="text-[8px] text-gray-600 block text-center">{i}</span>
                     </div>
                   ))}
                </div>
             </CardContent>
          </Card>
        </div>

        {/* CENTER COLUMN: LIVE FEED & PERFORMANCE */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem label="Profit" value={`$${stats.profit.toFixed(2)}`} color="text-green-500" icon={<TrendingUp className="w-4 h-4" />} />
              <StatItem label="Trades" value={stats.total.toString()} color="text-white" icon={<ArrowRightLeft className="w-4 h-4" />} />
              <StatItem label="Win Rate" value={`${stats.total ? Math.round((stats.wins/stats.total)*100) : 0}%`} color="text-teal-400" icon={<Zap className="w-4 h-4" />} />
              <StatItem label="Runtime" value="00:12:45" color="text-gray-400" icon={<Timer className="w-4 h-4" />} />
          </div>

          <Card className="bg-black/40 border-white/5 h-[500px] flex flex-col">
            <CardHeader className="border-b border-white/5 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Signal className="w-4 h-4 text-teal-500" />
                  Live Trade Log
                </CardTitle>
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                   <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Feed Active</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
               <ScrollArea className="h-full px-4">
                 <div className="space-y-2 py-4">
                    {trades.map((trade) => (
                      <div key={trade.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center gap-4">
                          <Badge className={cn(
                             "w-10 h-10 rounded-lg p-0 flex items-center justify-center font-bold text-xs",
                             trade.result === "WIN" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                          )}>
                             {trade.result}
                          </Badge>
                          <div>
                            <div className="text-xs font-bold text-white">{trade.symbol}</div>
                            <div className="text-[10px] text-gray-500">{trade.time}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="hidden sm:block text-right">
                              <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Exit Price</div>
                              <div className="text-xs font-mono text-gray-300">{trade.exit}</div>
                           </div>
                           <div className="text-right">
                              <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Profit</div>
                              <div className={cn("text-sm font-bold", trade.result === "WIN" ? "text-green-400" : "text-red-400")}>
                                +${trade.profit.toFixed(2)}
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                    {!isRunning && trades.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-20">
                         <Activity className="w-12 h-12 mb-4" />
                         <span className="text-sm font-bold uppercase tracking-widest">Connect to live stream</span>
                      </div>
                    )}
                 </div>
               </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: RECENT HISTORY & TIPS */}
        <div className="lg:col-span-3 space-y-6">
           <Card className="bg-zinc-900 border-white/5 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Performance Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {[
                   { date: "Yesterday", profit: "+$120.45", trades: 42, win: "65%" },
                   { date: "10 Apr 2026", profit: "+$85.20", trades: 30, win: "70%" },
                   { date: "09 Apr 2026", profit: "-$12.30", trades: 15, win: "45%" },
                 ].map((log, i) => (
                   <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{log.date}</span>
                        <span className={cn("text-xs font-bold", log.profit.startsWith("+") ? "text-green-400" : "text-red-400")}>{log.profit}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                         <span>{log.trades} Trades</span>
                         <span>{log.win} Win rate</span>
                      </div>
                   </div>
                 ))}
              </CardContent>
           </Card>
           
           <div className="p-6 rounded-3xl bg-teal-500/5 border border-teal-500/10 space-y-3">
              <h4 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                 <Zap className="w-4 h-4 fill-current" />
                 Pro Tip
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                 Digit bias is strongest during high volatility. Consider increasing stake when the heatmap shows a single digit index {" > "} 15%.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value, color, icon }: any) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 shadow-lg border-b-2 border-b-white/10">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1 px-1.5 rounded bg-white/5 text-gray-500">
           {icon}
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={cn("text-xl font-black tracking-tight", color)}>{value}</div>
    </div>
  )
}
