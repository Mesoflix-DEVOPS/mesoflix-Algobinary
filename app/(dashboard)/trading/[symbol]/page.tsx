"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Signal,
  Clock,
  Zap,
  Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { derivAPI } from "@/lib/deriv-api"

export default function MarketAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = params.symbol as string
  
  const [marketInfo, setMarketInfo] = React.useState<any>(null)
  const [lastTick, setLastTick] = React.useState<any>(null)
  const [tickHistory, setTickHistory] = React.useState<number[]>([])
  const [digitDist, setDigitDist] = React.useState<number[]>(new Array(10).fill(0))
  const [totalTicks, setTotalTicks] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)

  const subIdRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    async function init() {
      try {
        const symbols = await derivAPI.getActiveSymbols("synthetic_index")
        const info = symbols.find(s => s.symbol === symbol)
        if (info) {
          setMarketInfo(info)
        }
        
        setIsLoading(false)

        // Subscribe to ticks
        const subId = await derivAPI.subscribeToTicks(symbol, (tick) => {
          setLastTick(tick)
          const quote = tick.quote
          const lastDigit = parseInt(quote.toString().slice(-1))
          
          setDigitDist(prev => {
            const next = [...prev]
            next[lastDigit]++
            return next
          })
          setTotalTicks(prev => prev + 1)
          setTickHistory(prev => [...prev, quote].slice(-100))
        })
        subIdRef.current = subId
      } catch (err) {
        console.error("Failed to init market analysis:", err)
      }
    }

    init()

    return () => {
      if (subIdRef.current) derivAPI.unsubscribe(subIdRef.current)
    }
  }, [symbol])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <Zap className="w-10 h-10 text-teal-500 animate-pulse" />
      </div>
    )
  }

  const maxDist = Math.max(...digitDist, 1)

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumbs / Back */}
      <Button 
        variant="ghost" 
        className="text-gray-500 hover:text-white gap-2 p-0 h-auto"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Markets
      </Button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#080808] border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full -mr-10 -mt-10" />
        
        <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-teal-500" />
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                        {marketInfo?.display_name || symbol}
                    </h1>
                    <Badge className="bg-teal-500/10 text-teal-500 border-none uppercase text-[10px] font-black tracking-widest px-3 py-1">
                        Node {symbol}
                    </Badge>
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    {marketInfo?.submarket_display_name || "Synthetic Index"} | Global Streaming
                </p>
            </div>
        </div>

        <div className="relative z-10 flex flex-col items-end gap-2">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Institutional Telemetry</span>
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-3xl font-mono font-black text-white tracking-tighter">
                        {lastTick?.quote?.toLocaleString(undefined, { minimumFractionDigits: marketInfo?.pip_size === 0.01 ? 2 : 4 }) || "---"}
                    </span>
                    <span className="text-[10px] font-bold text-teal-500 uppercase flex items-center gap-1">
                        <Signal className="w-3 h-3 animate-pulse" />
                        Live Feed
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <Card className="lg:col-span-2 bg-[#050505] border-white/5 shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
            <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-500" />
                        High-Fidelity Tick Stream
                    </CardTitle>
                    <Badge variant="outline" className="border-white/10 text-gray-500 text-[9px] uppercase font-bold">100ms Frequency</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex items-end justify-center gap-1 px-4 py-8">
                {tickHistory.length > 0 ? (
                    tickHistory.map((val, i) => {
                        const min = Math.min(...tickHistory)
                        const max = Math.max(...tickHistory)
                        const range = max - min || 1
                        const heightPercent = Math.max(5, ((val - min) / range) * 90)
                        
                        return (
                            <div 
                                key={i} 
                                className={cn(
                                    "flex-1 rounded-t-[1px] transition-all duration-300",
                                    i === tickHistory.length - 1 ? "bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]" : "bg-teal-500/20"
                                )}
                                style={{ height: `${heightPercent}%` }}
                            />
                        )
                    })
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Digit Analysis Card */}
        <Card className="bg-[#050505] border-white/5 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-500" />
                    Digit Distribution
                </CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                    Last {totalTicks} ticks processed
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {digitDist.map((count, digit) => {
                        const percentage = totalTicks > 0 ? (count / totalTicks) * 100 : 0
                        return (
                            <div key={digit} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-white">{digit}</span>
                                    <span className="text-[9px] font-black text-teal-500">{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                                        style={{ width: `${(count / maxDist) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                <div className="mt-8 p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 space-y-2">
                    <div className="flex items-center gap-2">
                        <Info className="w-3 h-3 text-teal-500" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Statistical Insight</span>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed font-bold italic">
                        Node analysis suggests digit {digitDist.indexOf(Math.max(...digitDist))} has the highest frequency in the current session cycle.
                    </p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
