'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BotSettings } from '@/components/trading/bot-settings'
import { BotDisplay } from '@/components/trading/bot-display'
import { BotLogs } from '@/components/trading/bot-logs'
import { useTradeBot } from '@/hooks/use-trade-bot'
import { supabase } from '@/lib/db'
import { derivAPI } from '@/lib/deriv-api'

export default function SessionTraderPage() {
  const params = useParams()
  const toolId = params.id as string
  
  const [toolName, setToolName] = useState('Session Trader')
  const [settings, setSettings] = useState({
    stake: 10,
    takeProfit: 50,
    stopLoss: 30,
    maxTrades: 10,
    cooldownTrigger: 5,
    cooldownDuration: 1,
    market: 'R_100',
    autoSwitch: true
  })

  const bot = useTradeBot(settings)

  useEffect(() => {
    async function fetchTool() {
      const { data, error } = await supabase
        .from('trading_tools')
        .select('name')
        .eq('id', toolId)
        .single()
      
      if (!error && data) {
        setToolName(data.name)
      }
    }
    fetchTool()
  }, [toolId])

  return (
    <div className="flex flex-col gap-6 h-full max-h-[calc(100vh-100px)] overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            {toolName}
            <div className="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-400 font-black tracking-widest">
                v1.2.0-STABLE
            </div>
        </h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            Institutional Algorithm • 120s Execution Cycle
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-3 h-full">
            <BotSettings 
                settings={settings} 
                setSettings={setSettings} 
                disabled={bot.state !== 'IDLE' && bot.state !== 'STOPPED'} 
            />
        </div>

        {/* Center Column - Display */}
        <div className="lg:col-span-6 h-full">
            <BotDisplay 
                state={bot.state}
                stats={bot.stats}
                currentTrade={bot.currentTrade}
                cooldownTime={bot.cooldownTime}
                onStart={bot.startBot}
                onStop={bot.stopBot}
                onCloseTrade={bot.closeTrade}
            />
        </div>

        {/* Right Column - Logs & Stats */}
        <div className="lg:col-span-3 h-full">
            <BotLogs 
                logs={bot.logs} 
                stats={bot.stats} 
            />
        </div>
      </div>
    </div>
  )
}
