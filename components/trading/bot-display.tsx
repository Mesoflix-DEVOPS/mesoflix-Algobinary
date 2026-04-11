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
  Zap, Globe
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BotDisplayProps {
  state: BotState
  stats: any
  currentTrade: any
  cooldownTime: number
  livePrice: number | null
  onStart: () => void
  onStop: () => void
  onCloseTrade: () => void
}

export function BotDisplay({ 
  state, stats, currentTrade, cooldownTime, livePrice,
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
    <div className="flex flex-col gap-6 h-full">
      {/* Live Market Price & Status Header */}
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                <Globe className="w-4 h-4 text-teal-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Market Feed</span>
                <span className={cn(
                    "text-xl font-black font-mono transition-colors duration-200",
                    priceColor
                )}>
                    {livePrice ? livePrice.toFixed(4) : "Connecting..."}
                </span>
            </div>
         </div>

         <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Execution Status</span>
            <Badge variant="outline" className={cn(
                "mt-1 font-mono px-3 py-0.5 border-white/10 uppercase tracking-widest text-[9px]",
                state === 'RUNNING' && "text-teal-400 border-teal-400/20 bg-teal-400/5",
                state === 'IN_TRADE' && "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
                state === 'COOLDOWN' && "text-blue-400 border-blue-400/20 bg-blue-400/5",
                state === 'STOPPED' && "text-red-400 border-red-400/20 bg-red-400/5",
            )}>
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full mr-2",
                    state === 'RUNNING' && "bg-teal-400 animate-pulse",
                    state === 'IN_TRADE' && "bg-yellow-400 animate-ping",
                    state === 'COOLDOWN' && "bg-blue-400",
                    state === 'STOPPED' && "bg-red-400",
                )} />
                {state}
            </Badge>
         </div>
      </div>

      {/* Central P/L Card */}
      <Card className="flex-1 bg-black/40 border-white/5 backdrop-blur-xl flex flex-col items-center justify-center p-8 relative overflow-hidden group">
        <div className={cn(
            "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-1000",
            state === 'IN_TRADE' ? (isProfit ? "bg-green-500" : "bg-red-500") : "bg-teal-500"
        )} />
        
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

        <div className="z-10 text-center space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Session Performance</span>
            <h2 className={cn(
              "text-8xl font-black font-mono tracking-tighter transition-all duration-500",
              isProfit ? "text-green-400 drop-shadow-[0_0_35px_rgba(74,222,128,0.4)]" : "text-red-400 drop-shadow-[0_0_35px_rgba(248,113,113,0.4)]"
            )}>
              {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)}
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.3em]">Net Profit USD</p>
          </div>

          <div className="flex items-center gap-10 justify-center pt-2">
             <div className="flex flex-col items-center">
                <span className="text-[11px] font-black text-muted-foreground mb-1 uppercase tracking-widest">Efficiency</span>
                <span className="text-2xl font-black font-mono text-white">{stats.winRate}%</span>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex flex-col items-center">
                <span className="text-[11px] font-black text-muted-foreground mb-1 uppercase tracking-widest">Volume</span>
                <span className="text-2xl font-black font-mono text-white">{stats.trades}</span>
             </div>
          </div>
        </div>
      </Card>

      {/* Active Trade / Cooldown Card */}
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
                                    "text-[11px] font-black font-mono",
                                    currentTrade.profit >= 0 ? "text-green-400" : "text-red-400"
                                )}>
                                    ROI: {currentTrade.profit >= 0 ? '+' : ''}{currentTrade.profit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onCloseTrade} className="text-red-400 hover:bg-red-400/10 hover:text-red-400 gap-2 border border-red-400/20 text-[10px] font-black uppercase tracking-widest px-4">
                            <XCircle className="w-3.5 h-3.5" />
                            Emergency Halt
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black font-mono text-muted-foreground px-1 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                Entry: ${currentTrade.entryPrice.toFixed(4)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Timer className="w-3 h-3" />
                                Settlement: {Math.max(0, Math.floor(120 - (progress * 1.2)))}s
                            </span>
                        </div>
                        <Progress value={progress} className="h-2 bg-white/5" indicatorClassName="bg-gradient-to-r from-teal-500 to-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)]" />
                    </div>
                </div>
            ) : state === 'COOLDOWN' ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <Timer className="w-10 h-10 text-blue-400 animate-spin-slow" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Algorithmic Cooldown</p>
                        <p className="text-3xl font-black font-mono text-white">{cooldownTime}s</p>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white/50" />
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-[0.4em]">Engine Standby</p>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Control Actions */}
      <div className="flex gap-4">
        {state === 'IDLE' || state === 'STOPPED' ? (
            <Button onClick={onStart} className="flex-1 bg-teal-500 hover:bg-teal-400 text-black h-16 text-xl font-black uppercase tracking-[0.2em] gap-3 shadow-[0_0_30px_rgba(20,184,166,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Play className="w-6 h-6 fill-current" />
                Initialize Session
            </Button>
        ) : (
            <Button onClick={onStop} variant="outline" className="flex-1 h-16 text-xl font-black uppercase tracking-[0.2em] gap-3 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                <Square className="w-6 h-6 fill-current" />
                Kill Execution
            </Button>
        )}
      </div>
    </div>
  )
}
