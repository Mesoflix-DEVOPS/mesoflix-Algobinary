'use client'

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BotState } from "@/hooks/use-trade-bot"
import { 
  Activity, Timer, CheckCircle2,
  Zap, BarChart3, Fingerprint, Radar, Square, Play, XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Eye, RefreshCw, History, Info } from "lucide-react"
import { TradeHistoryModal } from "./trade-history-modal"
import { Trade } from "@/contexts/bot-context"
import { DigitDistribution } from "./digit-distribution"

interface BotDisplayProps {
  state: BotState
  stats: any
  currentTrade: any
  cooldownTime: number
  livePrice: number | null
  metrics: any
  activeAcct?: string
  tradeMode?: string
  market?: string
  onStart: () => void
  onStop: () => void
  onReset: () => void
  onCloseTrade: () => void
  tradeHistory: Trade[]
}

export function BotDisplay({ 
  state, stats, currentTrade, cooldownTime, livePrice, metrics, activeAcct,
  tradeMode, market,
  onStart, onStop, onReset, onCloseTrade, tradeHistory 
}: BotDisplayProps) {
  const [progress, setProgress] = useState(0)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [priceColor, setPriceColor] = useState("text-white")
  const [flash, setFlash] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

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
    <div className="flex flex-col bg-black/20 rounded-3xl border border-white/5 relative min-h-fit">
      {/* Header Diagnostic Strip */}
      <div className="px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-20 rounded-t-3xl flex flex-wrap items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Protocol</span>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                    <span className="text-xs font-black text-white font-mono">{activeAcct || "DETACHED"}</span>
                    {activeAcct?.startsWith('VRTC') && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onReset}
                            className="h-6 w-6 ml-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-full"
                            title="Reset Local Statistics"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
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

      {/* Main Analysis Sections */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/[0.02] border-white/5 p-4 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Win Rate</span>
                    <span className="text-xl font-black text-white">{stats.winRate}%</span>
                </div>
                <BarChart3 className="w-5 h-5 text-teal-500/30" />
            </Card>
            <Card className="bg-white/[0.02] border-white/5 p-4 flex items-center justify-between group/card relative">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Trades</span>
                    <span className="text-xl font-black text-white">{stats.trades}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsHistoryOpen(true)}
                        className="h-8 w-8 rounded-lg hover:bg-teal-500/10 hover:text-teal-400 text-white/20 transition-all"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <CheckCircle2 className="w-5 h-5 text-teal-500/30" />
                </div>
            </Card>
        </div>

        {/* Digit Distribution (Exclusive to Over/Under Mode) */}
        {tradeMode === 'OVER_UNDER' && market && (
           <DigitDistribution symbol={market} isActive={true} />
        )}

        {/* Central ROI Counter */}
        <div className="relative flex flex-col items-center justify-center min-h-[240px] overflow-hidden rounded-2xl bg-black/40 border border-white/5 group">
            {/* Dynamic Barrier Background Chart */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <svg className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="barrierGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={isProfit ? "#2dd4bf" : "#fb7185"} stopOpacity="0.2" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    {/* Horizontal Axis (Static Barrier Target) */}
                    <line 
                        x1="0" y1="50%" x2="100%" y2="50%" 
                        stroke="white" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.2" 
                    />

                    {/* Proximity Waveform (Synthetic Dist-Graph) */}
                    {state === 'IN_TRADE' && (
                        <path
                            d={`M 0 120 Q 50 ${120 - (metrics.barrierDistance * 10)} 100 120`}
                            fill="url(#barrierGradient)"
                            className="animate-pulse"
                        />
                    )}

                    {/* Live Spot Pulse Marker */}
                    {livePrice && (
                        <circle 
                            cx="50%" 
                            cy={`${50 + (metrics.trendStrength / 5)}%`} 
                            r="4" 
                            className={cn(
                                "fill-current transition-all duration-500",
                                isProfit ? "text-teal-400" : "text-red-400"
                            )} 
                        />
                    )}
                </svg>
            </div>

            {state === 'SCANNING' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                    <Radar className="w-48 h-48 text-teal-400/20 animate-spin-slow" />
                </div>
            )}
            <div className="relative z-10 text-center space-y-2">
                <div className="h-4" /> {/* Spacer instead of label */}
                <h2 className={cn(
                    "text-7xl sm:text-9xl font-black font-mono tracking-tighter transition-all duration-1000",
                    (state === 'IN_TRADE' ? currentTrade?.profit >= 0 : stats.profit >= 0) 
                        ? "text-green-400 drop-shadow-[0_0_35px_rgba(74,222,128,0.3)]" 
                        : "text-red-400 drop-shadow-[0_0_35px_rgba(248,113,113,0.3)]"
                )}>
                    {(state === 'IN_TRADE' ? currentTrade?.profit ?? 0 : stats.profit) >= 0 ? '+' : ''}
                    {(state === 'IN_TRADE' ? currentTrade?.profit ?? 0 : stats.profit).toFixed(2)}
                </h2>
                <Badge variant="outline" className="border-teal-500/20 text-teal-400 text-[10px] font-black uppercase px-4 py-1">
                    {state} • {metrics.trendDirection}
                </Badge>
            </div>

            {/* Bottom Right Reset Control */}
            <div className="absolute bottom-4 right-4 z-20">
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onReset}
                    className="h-9 px-3 bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 text-red-500/40 hover:text-red-500 rounded-xl transition-all group/reset"
                >
                    <RefreshCw className="w-3.5 h-3.5 mr-2 group-hover/reset:rotate-180 transition-transform duration-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Reset Session</span>
                </Button>
            </div>
        </div>

        {/* Status Hub */}
        <Card className="bg-black/40 border-white/5 p-6 min-h-[140px] flex flex-col justify-center">
            {state === 'IN_TRADE' && currentTrade ? (
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                            <span className="text-sm font-black text-white uppercase tracking-wider">Active Execution</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onCloseTrade} className="h-7 text-[9px] font-black uppercase tracking-widest border border-white/10 hover:bg-red-500/10">Halt Trade</Button>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono font-black text-muted-foreground uppercase">
                            <span>In: ${currentTrade.entryPrice.toFixed(2)}</span>
                            <span>Exp: {Math.max(0, Math.floor(120 - (progress * 1.2)))}s</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-white/5" indicatorClassName="bg-teal-500" />
                    </div>
                </div>
            ) : state === 'SCANNING' ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    <Radar className="w-8 h-8 text-teal-500 animate-spin-slow" />
                    <p className="text-[10px] font-black text-teal-500 uppercase tracking-[0.3em] animate-pulse text-center">Engine Scanning Barriers...</p>
                </div>
            ) : state === 'COOLDOWN' ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-2 text-center">
                   <Timer className="w-8 h-8 text-blue-400 animate-pulse" />
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Algorithm Restoring</p>
                   <p className="text-3xl font-black font-mono text-white">{cooldownTime}s</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-4 opacity-30 grayscale gap-2">
                    <Fingerprint className="w-10 h-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">System Ready</p>
                </div>
            )}
        </Card>
      </div>

      {/* Control Actions - STICKY BOTTOM FOR MOBILE */}
      <div className="p-4 sm:p-6 sticky bottom-0 z-30 bg-black/80 backdrop-blur-xl border-t border-white/10 mt-auto rounded-b-3xl">
        {state === 'IDLE' || state === 'STOPPED' ? (
            <Button 
                onClick={onStart} 
                className="w-full bg-teal-500 hover:bg-teal-400 text-black h-16 text-lg sm:text-xl font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(20,184,166,0.4)] transition-all active:scale-95"
            >
                <Play className="w-5 h-5 mr-3 fill-current" />
                Initialize Engine
            </Button>
        ) : (
            <Button 
                onClick={onStop} 
                variant="outline" 
                className="w-full h-16 text-lg sm:text-xl font-black uppercase tracking-[0.2em] border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
            >
                <Square className="w-5 h-5 mr-3 fill-current" />
                Kill Process
            </Button>
        )}
      </div>

      {/* Audit Modal Integration */}
      <TradeHistoryModal 
        isOpen={isHistoryOpen} 
        onOpenChange={setIsHistoryOpen} 
        history={tradeHistory} 
      />
    </div>
  )
}
