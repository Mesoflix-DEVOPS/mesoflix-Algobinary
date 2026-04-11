'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { derivAPI } from '@/lib/deriv-api'

export type BotState = 'IDLE' | 'RUNNING' | 'IN_TRADE' | 'COOLDOWN' | 'STOPPED'
export type TradeMode = 'TOUCH' | 'NO_TOUCH'

interface TradeSettings {
  stake: number
  takeProfit: number
  stopLoss: number
  maxTrades: number
  cooldownTrigger: number
  cooldownDuration: number
  market: string
  autoSwitch: boolean
  tradeMode: TradeMode
  barrierOffset: number
}

interface SessionStats {
  trades: number
  wins: number
  losses: number
  profit: number
  winRate: number
}

interface CurrentTrade {
  id: string
  symbol: string
  entryPrice: number
  currentPrice: number
  profit: number
  startTime: number
}

export function useTradeBot(settings: TradeSettings) {
  const [state, setState] = useState<BotState>('IDLE')
  const [stats, setStats] = useState<SessionStats>({
    trades: 0,
    wins: 0,
    losses: 0,
    profit: 0,
    winRate: 0
  })
  const [currentTrade, setCurrentTrade] = useState<CurrentTrade | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [cooldownTime, setCooldownTime] = useState(0)
  const [livePrice, setLivePrice] = useState<number | null>(null)
  
  const stateRef = useRef<BotState>('IDLE')
  const tickSubId = useRef<number | null>(null)

  const addLog = useCallback((action: string, details: string, level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') => {
    setLogs(prev => [{
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      action,
      details,
      level
    }, ...prev].slice(0, 50))
  }, [])

  // Subscribe to Ticks for Live Price
  useEffect(() => {
    let isSubscribed = true
    
    const setupTickSub = async () => {
        if (tickSubId.current) {
            await derivAPI.unsubscribe(tickSubId.current)
        }
        
        tickSubId.current = await derivAPI.subscribeToTicks(settings.market, (tick) => {
            if (isSubscribed) {
                setLivePrice(Number(tick.quote))
            }
        })
    }

    setupTickSub()

    return () => {
        isSubscribed = false
        if (tickSubId.current) {
            derivAPI.unsubscribe(tickSubId.current)
            tickSubId.current = null
        }
    }
  }, [settings.market])

  const startBot = async () => {
    addLog('START', `Starting bot on ${settings.market} (${settings.tradeMode} Mode)...`, 'SUCCESS')
    setState('RUNNING')
    stateRef.current = 'RUNNING'
  }

  const stopBot = () => {
    addLog('STOP', 'Stopping bot...', 'WARNING')
    setState('STOPPED')
    stateRef.current = 'STOPPED'
  }

  const executeTrade = useCallback(async () => {
    if (stateRef.current !== 'RUNNING' || !livePrice) return
    
    try {
      const type = settings.tradeMode === 'TOUCH' ? 'ONETOUCH' : 'NOTOUCH'
      // Barrier logic: For Touch, usually trend following. For No Touch, usually stable.
      // We'll use a + offset for simplicity in this version
      const barrier = `+${settings.barrierOffset}`
      
      addLog('BUY_ORDER', `Placing 2-min ${settings.tradeMode} on ${settings.market} (Barrier: ${barrier})...`)
      
      const resp = await derivAPI.buyContract({
        contractType: type,
        currency: 'USD',
        amount: settings.stake,
        duration: 2,
        symbol: settings.market,
        barrier: barrier
      })

      if (resp.error) {
        addLog('ERROR', resp.error.message, 'ERROR')
        setState('RUNNING')
        stateRef.current = 'RUNNING'
        return
      }

      const tradeId = resp.buy.contract_id
      
      // Subscribe to real-time updates
      derivAPI.subscribeToOpenContract(tradeId, (contract) => {
          setCurrentTrade({
              id: tradeId,
              symbol: settings.market,
              entryPrice: Number(contract.entry_tick || livePrice),
              currentPrice: Number(contract.current_spot || livePrice),
              profit: Number(contract.profit || 0),
              startTime: (contract.purchase_time || Date.now() / 1000) * 1000
          })

          if (contract.is_sold) {
              const p = Number(contract.profit)
              const isWin = p > 0
              
              setStats(prev => {
                  const newTrades = prev.trades + 1
                  const newWins = isWin ? prev.wins + 1 : prev.wins
                  const newLosses = isWin ? prev.losses : prev.losses + 1
                  const newProfit = prev.profit + p
                  return {
                      trades: newTrades,
                      wins: newWins,
                      losses: newLosses,
                      profit: Number(newProfit.toFixed(2)),
                      winRate: Number(((newWins / newTrades) * 100).toFixed(1))
                  }
              })
              
              addLog(isWin ? 'TRADE_WON' : 'TRADE_LOST', `Result: ${isWin ? '+' : ''}${p.toFixed(2)} on ${tradeId}`, isWin ? 'SUCCESS' : 'ERROR')
              setCurrentTrade(null)
              setState('RUNNING')
              stateRef.current = 'RUNNING'
          }
      })
      
      setState('IN_TRADE')
      stateRef.current = 'IN_TRADE'
      
    } catch (err: any) {
      addLog('ERROR', err.message || 'Trade execution failed', 'ERROR')
      setState('RUNNING')
      stateRef.current = 'RUNNING'
    }
  }, [settings, livePrice, addLog])

  // Bot Loop Logic
  useEffect(() => {
    if (state === 'RUNNING') {
        // Enforce Session Stop Conditions
        if (stats.trades >= settings.maxTrades) {
            addLog('SYSTEM', 'Max trades reached. Ending session.', 'INFO')
            stopBot()
            return
        }
        if (stats.profit >= settings.takeProfit) {
            addLog('SYSTEM', 'Take profit reached! Ending session.', 'SUCCESS')
            stopBot()
            return
        }
        if (stats.profit <= -settings.stopLoss) {
            addLog('SYSTEM', 'Stop loss hit. Ending session.', 'ERROR')
            stopBot()
            return
        }

        // Check for Cooldown
        if (stats.trades > 0 && stats.trades % settings.cooldownTrigger === 0 && cooldownTime === 0) {
            addLog('COOLDOWN', `Entering cooldown for ${settings.cooldownDuration} minute...`, 'WARNING')
            setState('COOLDOWN')
            stateRef.current = 'COOLDOWN'
            setCooldownTime(60)
            return
        }

        // Logic to enter trade (Wait for a signal or pulse)
        // For Week 1: Basic frequency based execution
        executeTrade()
    }
  }, [state, stats, settings, cooldownTime, executeTrade, addLog])

  // Cooldown Countdown
  useEffect(() => {
    let timer: any
    if (state === 'COOLDOWN' && cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            setState('RUNNING')
            stateRef.current = 'RUNNING'
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [state, cooldownTime])

  return {
    state,
    stats,
    currentTrade,
    logs,
    cooldownTime,
    livePrice,
    startBot,
    stopBot,
    closeTrade: () => {
        addLog('MANUAL_CLOSE', 'Manually closing trade...', 'WARNING')
    }
  }
}
