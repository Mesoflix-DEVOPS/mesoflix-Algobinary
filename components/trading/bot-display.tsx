'use client'

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BotState } from "@/hooks/use-trade-bot"
import { 
  Play, Square, XCircle, TrendingUp, TrendingDown, 
  Activity, Timer, ShieldAlert, CheckCircle2,
  Zap, Globe, BarChart3, Fingerprint, Radar
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BotDisplayProps {
  state: BotState
  stats: any
  currentTrade: any
  cooldownTime: number
  livePrice: number | null
  metrics: any
  onStart: () => void
  onStop: () => void
  onCloseTrade: () => void
}

export function BotDisplay({ 
  state, stats, currentTrade, cooldownTime, livePrice, metrics,
  onStart, onStop, onCloseTrade 
}: BotDisplayProps) {
  const [progress, setProgress] = useState(0)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [priceColor, setPriceColor] = useState("text-white")

  useEffect(() => {
    if (livePrice !== null && lastPrice !== null) {
        if (livePrice > lastPrice) setPriceColor("text-green-400")
        else if (livePrice < lastPrice) setPriceColor("text-red-400")
        
        const timer = setTimeout(() => setPriceColor("text-white"), 300)
        return () => clearTimeout(timer)
    }
    setLastPrice(livePrice)
  }, [livePrice, lastPrice])

  useEffect(() => {
    let interval: any
    if (state === 'IN_TRADE' && currentTrade) {
      const duration = 120000 // 2 minutes
      interval = setInterval(() => {
        const elapsed = Date.now() - currentTrade.startTime
        const p = Math.min((elapsed / duration) * 100, 100)
        setProgress(p)
      }, 1000)
    } else {
      setProgress(0)
    }
    return () => clearInterval(interval)
  }, [state, currentTrade])

  const isProfit = stats.profit >= 0

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
      {/* Live Market Analysis Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="bg-black/60 border-white/5 p-3 flex flex-col gap-1 items-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Market Price</span>
            <span className={cn("text-xl font-black font-mono transition-colors duration-200", priceColor)}>
                {livePrice ? livePrice.toFixed(4) : "---"}
            </span>
         </Card>
         <Card className="bg-black/60 border-white/5 p-3 flex flex-col gap-1 items-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Volatility</span>
            <span className={cn(
                "text-xl font-black font-mono",
                metrics.volatility > 0.5 ? "text-red-400" : "text-teal-400"
            )}>
                {metrics.volatility || "0.0000"}
            </span>
         </Card>
         <Card className="bg-black/60 border-white/5 p-3 flex flex-col gap-1 items-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Trend</span>
            <Badge variant="ghost" className={cn(
                "text-[10px] uppercase font-black tracking-tighter",
                metrics.trendDirection === 'bullish' && "text-green-400",
                metrics.trendDirection === 'bearish' && "text-red-400",
                metrics.trendDirection === 'sideways' && "text-teal-400"
            )}>
                {metrics.trendDirection}
            </Badge>
         </Card>
         <Card className="bg-black/60 border-white/5 p-3 flex flex-col gap-1 items-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Barrier Calc</span>
            <span className="text-[14px] font-black font-mono text-yellow-400">
                ±{metrics.barrierDistance || "0.0000"}
            </span>
         </Card>
      </div>

      {/* Main Terminal */}
      <Card className="flex-1 bg-black/40 border-white/5 backdrop-blur-xl flex flex-col items-center justify-center p-8 relative overflow-hidden group min-h-[300px]">
        {/* Radar Scanner Background (Active during scanning) */}
        {state === 'SCANNING' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-[400px] h-[400px] border border-teal-500/30 rounded-full animate-ping-slow" />
                <div className="w-[300px] h-[300px] border border-teal-500/20 rounded-full animate-ping-slow delay-75" />
                <Radar className="w-48 h-48 text-teal-400/10 animate-spin-slow" />
            </div>
        )}

        <div className="z-10 text-center space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground underline decoration-teal-500/50 underline-offset-4">Net Session ROI</span>
            <h2 className={cn(
              "text-8xl font-black font-mono tracking-tighter transition-all duration-500",
              isProfit ? "text-green-400 drop-shadow-[0_0_40px_rgba(74,222,128,0.4)]" : "text-red-400 drop-shadow-[0_0_40px_rgba(248,113,113,0.4)]"
            )}>
              {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)}
            </h2>
            <div className="flex items-center justify-center gap-2">
                <Fingerprint className="w-3 h-3 text-white/20" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Verified Statistical Edge</span>
            </div>
          </div>

          <div className="flex items-center gap-10 justify-center h-16">
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-white/40 mb-1 uppercase tracking-widest">Algorithmic Efficiency</span>
                <span className="text-2xl font-black font-mono text-white">{stats.winRate}%</span>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-white/40 mb-1 uppercase tracking-widest">Trade Volume</span>
                <span className="text-2xl font-black font-mono text-white">{stats.trades}</span>
             </div>
          </div>
        </div>

        {/* Diagnostic Status */}
        <div className="absolute top-4 left-4">
            <Badge variant="outline" className={cn(
                "font-mono px-3 py-1 border-white/10 uppercase tracking-widest text-[10px] backdrop-blur-md",
                state === 'SCANNING' && "text-teal-400 border-teal-400/20 bg-teal-400/5",
                state === 'IN_TRADE' && "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
                state === 'COOLDOWN' && "text-blue-400 border-blue-400/20 bg-blue-400/5",
                state === 'STOPPED' && "text-red-400 border-red-400/20 bg-red-400/5",
            )}>
                {state === 'SCANNING' && <Radar className="w-3 h-3 mr-2 animate-spin-slow" />}
                {state === 'IN_TRADE' && <Activity className="w-3 h-3 mr-2 animate-pulse" />}
                {state === 'COOLDOWN' && <Timer className="w-3 h-3 mr-2" />}
                {state === 'IDLE' && <Globe className="w-3 h-3 mr-2" />}
                {state}
            </Badge>
        </div>
      </Card>

      {/* Active Selection / Cooldown */}
      <Card className="h-44 bg-black/40 border-white/5 backdrop-blur-xl flex flex-col justify-between overflow-hidden relative">
        <CardContent className="p-6 h-full flex flex-col z-10">
            {state === 'IN_TRADE' && currentTrade ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                                <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-white uppercase tracking-wider">Live Execution</span>
                                <span className={cn(
                                    "text-[10px] font-black font-mono",
                                    currentTrade.profit >= 0 ? "text-green-400" : "text-red-400"
                                )}>
                                    P/L: {currentTrade.profit >= 0 ? '+' : ''}${currentTrade.profit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black font-mono text-muted-foreground px-1 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                Entry: ${currentTrade.entryPrice.toFixed(4)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Timer className="w-3 h-3" />
                                Expiry: {Math.max(0, Math.floor(120 - (progress * 1.2)))}s
                            </span>
                        </div>
                        <Progress value={progress} className="h-2 bg-white/5" indicatorClassName="bg-teal-500" />
                    </div>
                </div>
            ) : state === 'SCANNING' ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2">
                    <div className="flex items-center gap-4">
                         <div className="flex flex-col items-center gap-1">
                            <span className="text-[8px] uppercase text-muted-foreground">Vol-Level</span>
                            <div className={cn("w-12 h-1 rounded-full", metrics.volatility < 0.5 ? "bg-green-500" : "bg-red-500")} />
                         </div>
                         <div className="flex flex-col items-center gap-1">
                            <span className="text-[8px] uppercase text-muted-foreground">Trend-Stab</span>
                            <div className={cn("w-12 h-1 rounded-full", metrics.trendDirection === 'sideways' ? "bg-green-500" : "bg-yellow-500")} />
                         </div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-teal-400 animate-pulse tracking-[0.2em] pt-4">Searching for Sideways Market...</p>
                </div>
            ) : state === 'COOLDOWN' ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <Timer className="w-10 h-10 text-blue-400 animate-spin-slow" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Restoring Algorithm Integrity</p>
                        <p className="text-3xl font-black font-mono text-white">{cooldownTime}s</p>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                    <Play className="w-8 h-8 mb-2" />
                    <p className="text-[10px] uppercase font-black tracking-[0.2em]">Engine Dormant</p>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Primary Actions */}
      <div className="flex gap-4 p-1 rounded-xl bg-white/5">
        {state === 'IDLE' || state === 'STOPPED' ? (
            <Button onClick={onStart} className="flex-1 bg-teal-500 hover:bg-teal-400 text-black h-16 text-xl font-black uppercase tracking-[0.2em] gap-3 shadow-[0_0_40px_rgba(20,184,166,0.3)] transition-all">
                <Activity className="w-6 h-6" />
                Initialize Engine
            </Button>
        ) : (
            <Button onClick={onStop} variant="outline" className="flex-1 h-16 text-xl font-black uppercase tracking-[0.2em] gap-3 border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all">
                <Square className="w-6 h-6 fill-current" />
                Kill Session
            </Button>
        )}
      </div>
    </div>
  )
}
