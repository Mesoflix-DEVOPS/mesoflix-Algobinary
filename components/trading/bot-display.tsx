'use client'

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BotState } from "@/hooks/use-trade-bot"
import { 
  Play, Square, XCircle, TrendingUp, TrendingDown, 
  Activity, Timer, ShieldAlert, CheckCircle2 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BotDisplayProps {
  state: BotState
  stats: any
  currentTrade: any
  cooldownTime: number
  onStart: () => void
  onStop: () => void
  onCloseTrade: () => void
}

export function BotDisplay({ 
  state, stats, currentTrade, cooldownTime, 
  onStart, onStop, onCloseTrade 
}: BotDisplayProps) {
  const [progress, setProgress] = useState(0)

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
      {/* Central P/L Card */}
      <Card className="flex-1 bg-black/40 border-white/5 backdrop-blur-xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className={cn(
            "absolute inset-0 opacity-10 transition-colors duration-1000",
            state === 'IN_TRADE' ? (isProfit ? "bg-green-500" : "bg-red-500") : "bg-teal-500"
        )} />
        
        <div className="z-10 text-center space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Session P/L</span>
            <h2 className={cn(
              "text-7xl font-black font-mono tracking-tighter transition-all duration-500",
              isProfit ? "text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.3)]" : "text-red-400 drop-shadow-[0_0_30px_rgba(248,113,113,0.3)]"
            )}>
              {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)}
            </h2>
          </div>

          <div className="flex items-center gap-6 justify-center">
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground mb-1 uppercase">Win Rate</span>
                <span className="text-xl font-bold font-mono text-white">{stats.winRate}%</span>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground mb-1 uppercase">Trades</span>
                <span className="text-xl font-bold font-mono text-white">{stats.trades}</span>
             </div>
          </div>
        </div>

        {/* State Indicator */}
        <div className="absolute top-4 left-4">
            <Badge variant="outline" className={cn(
                "font-mono px-3 py-1 border-white/10",
                state === 'RUNNING' && "text-teal-400 border-teal-400/20 bg-teal-400/5",
                state === 'IN_TRADE' && "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
                state === 'COOLDOWN' && "text-blue-400 border-blue-400/20 bg-blue-400/5",
                state === 'STOPPED' && "text-red-400 border-red-400/20 bg-red-400/5",
            )}>
                {state === 'IN_TRADE' && <Activity className="w-3 h-3 mr-2 animate-pulse" />}
                {state === 'COOLDOWN' && <Timer className="w-3 h-3 mr-2" />}
                {state}
            </Badge>
        </div>
      </Card>

      {/* Active Trade / Cooldown Card */}
      <Card className="h-48 bg-black/40 border-white/5 backdrop-blur-xl flex flex-col justify-between overflow-hidden">
        <CardContent className="p-6 h-full flex flex-col">
            {state === 'IN_TRADE' && currentTrade ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Active Contract</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{currentTrade.id}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onCloseTrade} className="text-red-400 hover:bg-red-400/10 hover:text-red-400 gap-2 border border-red-400/20">
                            <XCircle className="w-4 h-4" />
                            Close Trade
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-1">
                            <span>ENTRY: ${currentTrade.entryPrice}</span>
                            <span>TIME LEFT: {Math.max(0, Math.floor(120 - (progress * 1.2)))}s</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-white/5" indicatorClassName="bg-yellow-400" />
                    </div>
                </div>
            ) : state === 'COOLDOWN' ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3">
                    <Timer className="w-8 h-8 text-blue-400 animate-spin-slow" />
                    <div className="text-center">
                        <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">Cooldown Active</p>
                        <p className="text-2xl font-black font-mono text-white">{cooldownTime}s</p>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-50">
                    <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white/20" />
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Standing By</p>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Control Actions */}
      <div className="flex gap-4">
        {state === 'IDLE' || state === 'STOPPED' ? (
            <Button onClick={onStart} className="flex-1 bg-teal-500 hover:bg-teal-400 text-black h-14 text-lg font-black uppercase tracking-widest gap-2 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                <Play className="w-5 h-5 fill-current" />
                Initialize Bot
            </Button>
        ) : (
            <Button onClick={onStop} variant="destructive" className="flex-1 h-14 text-lg font-black uppercase tracking-widest gap-2">
                <Square className="w-5 h-5 fill-current" />
                Stop Execution
            </Button>
        )}
      </div>
    </div>
  )
}
