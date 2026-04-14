'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BotSettings } from '@/components/trading/bot-settings'
import { BotDisplay } from '@/components/trading/bot-display'
import { BotLogs } from '@/components/trading/bot-logs'
import { useBot } from '@/contexts/bot-context'
import { supabase } from '@/lib/db'


export default function SessionTraderPage() {
  const params = useParams()
  const toolId = params.id as string
  const { settings, setSettings, ...bot } = useBot()
  const [toolName, setToolName] = useState('Session Trader')

  // Update toolId in settings if not already set
  useEffect(() => {
    if (settings.toolId !== toolId) {
       setSettings(prev => ({ ...prev, toolId }))
    }
  }, [toolId, settings.toolId, setSettings])


  useEffect(() => {
    async function fetchTool() {
      const { data, error } = await supabase
        .from('trading_tools')
        .select('name')
        .eq('id', toolId)
        .single()
      
      if (!error && data) {
        setToolName(data.name)
        const isOverUnder = data.name.toLowerCase().includes('over') || data.name.toLowerCase().includes('under')
        if (isOverUnder && settings.tradeMode !== 'OVER_UNDER') {
            setSettings(prev => ({ ...prev, tradeMode: 'OVER_UNDER' }))
        } else if (!isOverUnder && settings.tradeMode === 'OVER_UNDER') {
            setSettings(prev => ({ ...prev, tradeMode: 'NO_TOUCH' }))
        }
      }
    }
    fetchTool()
  }, [toolId, setSettings, settings.tradeMode])

  return (
    <div className="flex flex-col gap-6 min-h-full pb-10">
      {/* Header Info */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            {toolName}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-3">
            <BotSettings 
                toolName={toolName}
                settings={settings} 
                setSettings={setSettings} 
                disabled={bot.state === 'IN_TRADE'} 
            />
        </div>

        {/* Center Column - Display */}
        <div className="lg:col-span-6">
            <BotDisplay 
                state={bot.state}
                stats={bot.stats}
                currentTrade={bot.currentTrade}
                tradeHistory={bot.tradeHistory}
                cooldownTime={bot.cooldownTime}
                livePrice={bot.livePrice}
                metrics={bot.metrics}
                activeAcct={settings.activeAcct}
                tradeMode={settings.tradeMode}
                market={settings.market}
                onStart={bot.startBot}
                onStop={bot.stopBot}
                onReset={bot.resetStats}
                onCloseTrade={bot.closeTrade}
            />
        </div>

        {/* Right Column - Logs & Stats */}
        <div className="lg:col-span-3">
            <BotLogs 
                logs={bot.logs} 
                stats={bot.stats} 
            />
        </div>
      </div>
    </div>
  )
}
