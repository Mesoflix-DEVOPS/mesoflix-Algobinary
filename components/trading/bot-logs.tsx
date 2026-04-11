'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardList, Info, CheckCircle2, 
  AlertTriangle, XCircle, BarChart3, 
  TrendingUp, TrendingDown, DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BotLogsProps {
  logs: any[]
  stats: any
}

export function BotLogs({ logs, stats }: BotLogsProps) {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Session Stats Card */}
      <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-400" />
                Session Stats
            </CardTitle>
            <CardDescription className="text-[10px]">Real-time performance metrics</CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] bg-teal-400/5 text-teal-400 border-teal-400/20">
            AUTO
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white/5 rounded-lg p-3 space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    Wins
                </span>
                <span className="text-xl font-bold font-mono text-green-400">{stats.wins}</span>
             </div>
             <div className="bg-white/5 rounded-lg p-3 space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    Losses
                </span>
                <span className="text-xl font-bold font-mono text-red-400">{stats.losses}</span>
             </div>
             <div className="bg-white/5 rounded-lg p-3 space-y-1 col-span-2">
                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-teal-400" />
                    Total ROI
                </span>
                <div className="flex items-center justify-between">
                    <span className={cn(
                        "text-xl font-bold font-mono",
                        stats.profit >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                        {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)} USD
                    </span>
                    <span className="text-xs text-muted-foreground">Est. +12.4%</span>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Card */}
      <Card className="flex-1 bg-black/40 border-white/5 backdrop-blur-xl flex flex-col overflow-hidden">
        <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-400" />
                Bot Activity
            </CardTitle>
            <CardDescription className="text-[10px]">Log of execution & events</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-540px)] px-4">
                <div className="space-y-3 pb-4">
                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-3 text-[11px] animate-in fade-in slide-in-from-left-2 duration-300">
                             <div className="mt-0.5">
                                {log.level === 'SUCCESS' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                                {log.level === 'INFO' && <Info className="w-3 h-3 text-blue-400" />}
                                {log.level === 'WARNING' && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                                {log.level === 'ERROR' && <XCircle className="w-3 h-3 text-red-400" />}
                             </div>
                             <div className="flex flex-col gap-1 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "font-black uppercase tracking-widest text-[9px]",
                                        log.level === 'SUCCESS' && "text-green-400",
                                        log.level === 'INFO' && "text-blue-400",
                                        log.level === 'WARNING' && "text-yellow-400",
                                        log.level === 'ERROR' && "text-red-400",
                                    )}>{log.action}</span>
                                    <span className="text-[9px] text-muted-foreground font-mono">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">{log.details}</p>
                             </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="h-40 flex flex-col items-center justify-center space-y-2 opacity-20">
                            <ClipboardList className="w-8 h-8" />
                            <p className="text-[10px] uppercase font-bold tracking-widest">No Activity Yet</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
