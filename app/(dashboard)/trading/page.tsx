"use client"

import * as React from "react"
import { 
  LineChart, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Globe,
  Loader2,
  BarChart3,
  Signal,
  ArrowRight
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { derivAPI } from "@/lib/deriv-api"
import Link from "next/link"

interface Market {
  symbol: string
  display_name: string
  submarket_display_name: string
  last_tick?: number
  change?: number
  isUp?: boolean
  history: number[]
}

export default function ChartingPage() {
  const [markets, setMarkets] = React.useState<Market[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const subscriptions = React.useRef<Record<string, number | null>>({})

  React.useEffect(() => {
    async function initMarkets() {
      try {
        const symbols = await derivAPI.getActiveSymbols("synthetic_index")
        // Limit to 12 popular indices for the grid
        const topSymbols = symbols
          .filter(s => s.symbol) // Ensure symbol exists
          .slice(0, 12)
          .map(s => ({
            symbol: s.symbol,
            display_name: s.display_name,
            submarket_display_name: s.submarket_display_name,
            history: []
          }))

        setMarkets(topSymbols)
        setIsLoading(false)

        // Subscribe to ticks for each symbol
        topSymbols.forEach(async (m) => {
          const subId = await derivAPI.subscribeToTicks(m.symbol, (tick) => {
            setMarkets(prev => prev.map(p => {
              if (p.symbol === tick.symbol) {
                const prevPrice = p.last_tick || tick.quote
                const change = tick.quote - prevPrice
                const newHistory = [...p.history, tick.quote].slice(-20)
                return {
                  ...p,
                  last_tick: tick.quote,
                  change: Math.abs(change),
                  isUp: tick.quote >= prevPrice,
                  history: newHistory
                }
              }
              return p
            }))
          })
          subscriptions.current[m.symbol] = subId
        })
      } catch (err) {
        console.error("Failed to init markets:", err)
      }
    }

    initMarkets()

    return () => {
      // Cleanup subscriptions
      Object.values(subscriptions.current).forEach(id => {
        if (id) derivAPI.unsubscribe(id)
      })
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Initializing Telemetry...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-teal-400" />
            Market Pulse
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Live high-fidelity telemetry from Deriv V2 WebSocket infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
             <Signal className="w-4 h-4 text-teal-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Low Latency Sync</span>
          </div>
          <Badge className="bg-teal-500/10 text-teal-500 border-none font-black text-[10px] uppercase h-8 px-3">
             {markets.length} Nodes Active
          </Badge>
        </div>
      </div>

      {/* Grid of Markets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {markets.map(market => {
          const isUp = market.isUp ?? true
          
          return (
            <Link key={market.symbol} href={`/trading/${market.symbol}`}>
                <Card className="bg-[#0a0a0a] border-white/5 hover:border-teal-500/30 transition-all hover:bg-[#0f0f0f] overflow-hidden group cursor-pointer relative shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                        <BarChart3 className="w-32 h-32 text-white" />
                    </div>
                    <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
                        <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-teal-500 uppercase tracking-[0.1em]">{market.display_name}</span>
                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">{market.submarket_display_name}</span>
                        </div>
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-500",
                            isUp ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                        )}>
                            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        </div>

                        <div className="flex flex-col gap-1 mb-8">
                        <span className={cn(
                            "text-3xl font-mono font-black tracking-tighter truncate transition-colors",
                            isUp ? "text-white" : "text-gray-300"
                        )}>
                            {market.last_tick ? market.last_tick.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] font-black font-mono tracking-tight flex items-center gap-1",
                                isUp ? "text-green-400" : "text-red-400"
                            )}>
                                {isUp ? "▲" : "▼"} {market.change?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-[8px] text-gray-700 font-bold uppercase">Update Live</span>
                        </div>
                        </div>

                        {/* Sparkline */}
                        <div className="w-full h-10 flex items-end justify-between gap-[2px] opacity-30 group-hover:opacity-70 transition-all duration-700">
                        {market.history.length > 0 ? (
                            market.history.map((val, i) => {
                                const min = Math.min(...market.history)
                                const max = Math.max(...market.history)
                                const range = max - min || 1
                                const heightPercent = Math.max(10, ((val - min) / range) * 100)
                                
                                return (
                                <div 
                                    key={i} 
                                    className={cn(
                                    "flex-1 rounded-t-[1px] transition-all duration-500",
                                    i === market.history.length - 1 
                                        ? (isUp ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]") 
                                        : "bg-teal-500/20"
                                    )}
                                    style={{ height: `${heightPercent}%` }}
                                />
                                )
                            })
                        ) : (
                            <div className="w-full h-[1px] bg-white/5" />
                        )}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest">Deep Analysis</span>
                            <ArrowRight className="w-3 h-3 text-teal-500" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

