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
  Zap, Globe, BarChart3, Fingerprint, Radar, Unplug
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BotDisplayProps {
  state: BotState
  stats: any
  currentTrade: any
  cooldownTime: number
  livePrice: number | null
  metrics: any
  activeAcct?: string
  onStart: () => void
  onStop: () => void
  onCloseTrade: () => void
}

export function BotDisplay({ 
  state, stats, currentTrade, cooldownTime, livePrice, metrics, activeAcct,
  onStart, onStop, onCloseTrade 
}: BotDisplayProps) {
  const [progress, setProgress] = useState(0)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [priceColor, setPriceColor] = useState("text-white")
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (livePrice !== null) {
        setFlash(true)
        const flashTimer = setTimeout(() => setFlash(false), 200)

        if (lastPrice !== null) {
            if (livePrice > lastPrice) setPriceColor("text-green-400")
            else if (livePrice < lastPrice) setPriceColor("text-red-400")
            
            const timer = setTimeout(() => setPriceColor("text-white"), 300)
            return () => {
                clearTimeout(timer)
                clearTimeout(flashTimer)
            }
        }
        setLastPrice(livePrice)
    }
  }, [livePrice])

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
    <div className="flex flex-col h-full bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
      {/* Header Diagnostic Strip - FIXED */}
      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Protocol</span>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                    <span className="text-xs font-black text-white font-mono">{activeAcct || "DETACHED"}</span>
                </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Market Feed</span>
                <div className="flex items-center gap-2">
                    <Activity className={cn("w-3 h-3 transition-colors", livePrice ? "text-teal-500" : "text-red-500")} />
                    <span className={cn("text-xs font-black font-mono", livePrice ? "text-white" : "text-red-500")}>
                        {livePrice ? "SYNCED" : "INTERRUPTED"}
                    </span>
                </div>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Volatility</span>
                <span className={cn("text-sm font-black font-mono", metrics.volatility > 0.5 ? "text-red-400" : "text-teal-400")}>
                    {metrics.volatility.toFixed(4)}
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Live Price</span>
                <span className={cn(
                    "text-sm font-black font-mono transition-all duration-200",
                    flash && "scale-110 brightness-150",
                    priceColor
                )}>
                    {livePrice ? livePrice.toFixed(2) : "0.00"}
                </span>
            </div>
         </div>
      </div>

      {/* Main Analysis Container - SCROLLABLE IF NEEDED */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
        {/* Statistics Bench */}
        <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/[0.02] border-white/5 p-4 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Win Rate</span>
                    <span className="text-xl font-black text-white">{stats.winRate}%</span>
                </div>
                <BarChart3 className="w-5 h-5 text-teal-500/30" />
            </Card>
            <Card className="bg-white/[0.02] border-white/5 p-4 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Trades</span>
                    <span className="text-xl font-black text-white">{stats.trades}</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-teal-500/30" />
            </Card>
        </div>

        {/* Central ROI Terminal */}
        <Card className={cn(
            "relative aspect-video flex flex-col items-center justify-center border-none shadow-none bg-transparent overflow-hidden group transition-all duration-700",
            state === 'IN_TRADE' ? (isProfit ? "scale-[1.02]" : "scale-[0.98]") : ""
        )}>
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/[0.02] to-transparent pointer-events-none" />
            {state === 'SCANNING' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full border border-teal-500/10 rounded-full animate-ping-slow" />
                    <Radar className="w-32 h-32 text-teal-400/5 animate-spin-slow" />
                </div>
            )}

            <div className="relative z-10 text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Profit/Loss Monitor</span>
                <h2 className={cn(
                    "text-9xl font-black font-mono tracking-tighter transition-all duration-1000",
                    isProfit ? "text-green-400 drop-shadow-[0_0_35px_rgba(74,222,128,0.3)]" : "text-red-400 drop-shadow-[0_0_35px_rgba(248,113,113,0.3)]"
                )}>
                    {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)}
                </h2>
                <div className="flex items-center justify-center gap-4 pt-4">
                    <Badge variant="outline" className="border-teal-500/20 text-teal-500 text-[10px] font-black uppercase tracking-widest px-4 py-1">
                        SIDELINED {metrics.trendDirection}
                    </Badge>
                </div>
            </div>
        </Card>

        {/* Active Operation Panel */}
        <Card className="bg-black/40 border-white/5 p-6 min-h-[160px] flex flex-col justify-center relative overflow-hidden">
            {state === 'IN_TRADE' && currentTrade ? (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                <Zap className="w-5 h-5 text-teal-400 animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-white uppercase tracking-wider">Market Engagement</span>
                                <span className="text-[10px] font-mono font-bold text-muted-foreground capitalize">
                                    Targeting: SIDELINED {metrics.trendDirection}
                                </span>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={onCloseTrade} 
                            className="h-8 border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-[10px] font-black uppercase tracking-widest px-4"
                        >
                            Emergency Halt
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase font-black">
                            <span>Entry: ${currentTrade.entryPrice.toFixed(2)}</span>
                            <span>Settle: {Math.max(0, Math.floor(120 - (progress * 1.2)))}s</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-white/5" indicatorClassName="bg-teal-500" />
                    </div>
                </div>
            ) : state === 'SCANNING' ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <Radar className="w-8 h-8 text-teal-500 animate-spin-slow" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] animate-pulse">Scanning Frequency Barriers...</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Watching for Sideways Convergence</p>
                    </div>
                </div>
            ) : state === 'COOLDOWN' ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <Timer className="w-8 h-8 text-blue-400 animate-pulse" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Institutional Cooldown</p>
                        <p className="text-3xl font-black font-mono text-white mt-1">{cooldownTime}s</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-6 space-y-3 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Fingerprint className="w-10 h-10 text-white" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">System Dormant</p>
                </div>
            )}
        </Card>
      </div>

      {/* Footer Controls - FIXED PINNED */}
      <div className="p-6 border-t border-white/5 bg-white/[0.02] backdrop-blur-md">
        {state === 'IDLE' || state === 'STOPPED' ? (
            <Button 
                onClick={onStart} 
                className="w-full bg-teal-500 hover:bg-teal-400 text-black h-16 text-xl font-black uppercase tracking-[0.2em] gap-3 shadow-[0_0_30px_rgba(20,184,166,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
                <Activity className="w-6 h-6" />
                Initialize Engine
            </Button>
        ) : (
            <Button 
                onClick={onStop} 
                variant="outline" 
                className="w-full h-16 text-xl font-black uppercase tracking-[0.2em] gap-3 border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all font-mono"
            >
                <Square className="w-6 h-6 fill-current" />
                Kill Process
            </Button>
        )}
      </div>
    </div>
  )
}
