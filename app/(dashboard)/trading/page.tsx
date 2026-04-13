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
  Signal
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const MARKETS = [
  { id: "R_10", name: "Volatility 10 Index", base: 6420.50, volatility: 2 },
  { id: "R_25", name: "Volatility 25 Index", base: 1250.75, volatility: 5 },
  { id: "R_50", name: "Volatility 50 Index", base: 310.20, volatility: 8 },
  { id: "R_75", name: "Volatility 75 Index", base: 284050.00, volatility: 15 },
  { id: "R_100", name: "Volatility 100 Index", base: 1950.40, volatility: 10 },
  { id: "1s_10", name: "Vol 10 (1s) Index", base: 8400.10, volatility: 3 },
  { id: "1s_25", name: "Vol 25 (1s) Index", base: 450.80, volatility: 6 },
  { id: "1s_50", name: "Vol 50 (1s) Index", base: 210.50, volatility: 9 },
  { id: "1s_75", name: "Vol 75 (1s) Index", base: 154200.00, volatility: 20 },
  { id: "1s_100", name: "Vol 100 (1s) Index", base: 4800.60, volatility: 12 },
  { id: "JD10", name: "Jump 10 Index", base: 6540.20, volatility: 25 },
  { id: "JD50", name: "Jump 50 Index", base: 45100.90, volatility: 35 },
  { id: "JD100", name: "Jump 100 Index", base: 89050.40, volatility: 45 },
]

export default function ChartingPage() {
  const [marketData, setMarketData] = React.useState<Record<string, { value: number, change: number, isUp: boolean, history: number[] }>>({})
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Initial State Setup
    const initial: any = {}
    MARKETS.forEach(m => {
      initial[m.id] = {
        value: m.base,
        change: 0,
        isUp: true,
        history: Array.from({ length: 20 }, () => m.base + (Math.random() - 0.5) * m.volatility * 10)
      }
    })
    setMarketData(initial)
    setIsLoading(false)

    // Simulate real-time high frequency ticks
    const interval = setInterval(() => {
      setMarketData(prev => {
        const next = { ...prev }
        MARKETS.forEach(m => {
          const current = next[m.id]
          const delta = (Math.random() - 0.48) * m.volatility
          const newValue = Math.max(0, current.value + delta)
          const isUp = newValue >= current.value
          
          next[m.id] = {
            value: newValue,
            change: Math.abs(delta),
            isUp,
            history: [...current.history.slice(1), newValue]
          }
        })
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
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
            Live Analytics
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Institutional-grade telemetry for 13 global Deriv Synthetic Indices.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
             <Signal className="w-4 h-4 text-green-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Websocket Active</span>
          </div>
          <Badge className="bg-teal-500/10 text-teal-500 border-none font-black text-[10px] uppercase h-8 px-3">
             13 Markets Streaming
          </Badge>
        </div>
      </div>

      {/* Grid of Markets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MARKETS.map(market => {
          const data = marketData[market.id]
          if (!data) return null
          
          return (
            <Card key={market.id} className="bg-white/5 border-white/10 hover:border-teal-500/30 transition-all hover:bg-white/[0.07] overflow-hidden group">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{market.name}</span>
                    <span className="text-[9px] font-bold text-gray-500">Vol Factor: {market.volatility}x</span>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                    data.isUp ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    {data.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                </div>

                <div className="flex flex-col gap-1 mb-6">
                  <span className={cn(
                    "text-3xl font-mono font-black tracking-tighter truncate transition-colors",
                    data.isUp ? "text-white" : "text-gray-300"
                  )}>
                    {data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={cn(
                    "text-xs font-bold font-mono tracking-tight flex items-center gap-1",
                    data.isUp ? "text-green-400" : "text-red-400"
                  )}>
                    {data.isUp ? "+" : "-"}{data.change.toFixed(2)}
                  </span>
                </div>

                {/* Micro Chart (Sparkline) using simple divs */}
                <div className="w-full h-12 flex items-end justify-between gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                  {data.history.map((val, i) => {
                    const min = Math.min(...data.history)
                    const max = Math.max(...data.history)
                    const range = max - min || 1
                    const heightPercent = Math.max(10, ((val - min) / range) * 100)
                    
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "flex-1 rounded-t-sm",
                          i === data.history.length - 1 
                            ? (data.isUp ? "bg-green-500" : "bg-red-500") 
                            : "bg-teal-500/30"
                        )}
                        style={{ height: \`\${heightPercent}%\` }}
                      />
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
