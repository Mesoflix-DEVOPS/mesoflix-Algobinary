'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, User, Globe, TrendingUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/db'

interface ActivityItem {
  id: string
  timestamp: string
  action: string
  details: string
  traderName: string
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  isSynthetic?: boolean
}

const DUMMY_NAMES = ["Trader GT", "SwiftScalper", "BinaryKing", "MatrixTrade", "QuantNova", "ShadowTrader", "NovaX", "DerivPro"]
const DUMMY_ACTIONS = [
    { action: "INIT", details: "Initialized Session Trader on R_100", level: "INFO" },
    { action: "WIN", details: "Secured +$5.40 on Volatility 100 (1s) Index", level: "SUCCESS" },
    { action: "JOIN", details: "Synchronized account with Mesoflix Node", level: "INFO" },
    { action: "TP", details: "Daily Take Profit milestone achieved ($20.00)", level: "SUCCESS" },
    { action: "SCAN", details: "Scanning for high-probability barriers...", level: "INFO" }
]

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Real-time Supabase Subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:bot_logs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bot_logs' 
      }, (payload) => {
        const newLog = payload.new
        setActivities(prev => [{
            id: newLog.id,
            timestamp: newLog.created_at,
            action: newLog.action,
            details: newLog.details,
            traderName: "Active Node", // Hide real names if needed
            level: (newLog.level as any) || 'INFO'
        }, ...prev].slice(0, 50))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Synthetic Message Heartbeat (Keep site live)
  useEffect(() => {
    const interval = setInterval(() => {
        // 40% chance to generate a synthetic message every 8-12 seconds
        if (Math.random() > 0.6) {
            const name = DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)]
            const actionInfo = DUMMY_ACTIONS[Math.floor(Math.random() * DUMMY_ACTIONS.length)] || DUMMY_ACTIONS[0]
            
            const syntheticItem: ActivityItem = {
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toISOString(),
                action: actionInfo.action,
                details: actionInfo.details,
                traderName: name,
                level: actionInfo.level as any,
                isSynthetic: true
            }

            setActivities(prev => [syntheticItem, ...prev].slice(0, 50))
        }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-black/40 border-white/5 overflow-hidden flex flex-col h-[700px]">
      <div className="p-4 border-b border-white/5 bg-black/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Global Activity Node</span>
        </div>
        <Badge variant="outline" className="text-[9px] border-teal-500/20 text-teal-400">LIVE FEED</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={containerRef}>
        {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20 gap-3 grayscale">
                <Globe className="w-8 h-8 animate-spin-slow" />
                <p className="text-[10px] uppercase font-black tracking-widest">Listening for signals...</p>
            </div>
        ) : (
            activities.map((item) => (
                <div 
                    key={item.id} 
                    className={cn(
                        "flex flex-col gap-2 p-3 rounded-xl border border-white/5 transition-all animate-in slide-in-from-right duration-500",
                        item.level === 'SUCCESS' ? "bg-green-500/5 group" : "bg-white/[0.02]"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                <User className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span className="text-[11px] font-black text-white">{item.traderName}</span>
                            {item.isSynthetic && (
                                <Badge className="text-[8px] h-3 px-1 bg-white/5 text-muted-foreground border-none">SIM</Badge>
                            )}
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                        <div className={cn(
                            "w-1 h-3 rounded-full mt-1",
                            item.level === 'SUCCESS' ? "bg-green-500" :
                            item.level === 'ERROR' ? "bg-red-500" :
                            item.level === 'WARNING' ? "bg-yellow-500" : "bg-teal-500"
                        )} />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">{item.action}</span>
                            <p className="text-[11px] text-white/80 leading-relaxed">{item.details}</p>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/60">
        <div className="flex items-center gap-2 grayscale opacity-40">
            <Zap className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Protocol V2.2.0 Active</span>
        </div>
      </div>
    </Card>
  )
}
