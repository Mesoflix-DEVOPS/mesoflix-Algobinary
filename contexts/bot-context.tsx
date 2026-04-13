'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { derivAPI } from '@/lib/deriv-api'
import { supabase } from '@/lib/db'

export type BotState = 'IDLE' | 'SCANNING' | 'IN_TRADE' | 'COOLDOWN' | 'STOPPED'
export type TradeMode = 'TOUCH' | 'NO_TOUCH' | 'OVER_UNDER'

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
  kMultiplier: number
  volatilityThreshold: number
  overBarrier: number
  underBarrier: number
  recoveryStrategy: 'martingale' | 'fixed'
  recoveryStep: number
  activeToken?: string
  activeAcct?: string
  toolId: string
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
  barrier?: string
}

interface StrategicMetrics {
  volatility: number
  trendStrength: number 
  trendDirection: 'sideways' | 'bullish' | 'bearish'
  barrierDistance: number
  tickHistogram: number[] // length 10, frequency of last digit
  recentAvg: number // average of last 1000 ticks
}

export interface Trade {
  id: string
  symbol: string
  type: string
  stake: number
  barrier: string
  entryPrice: number
  exitPrice: number
  profit: number
  result: 'WIN' | 'LOSS'
  timestamp: string
}

interface BotContextType {
  state: BotState
  stats: SessionStats
  currentTrade: CurrentTrade | null
  logs: any[]
  cooldownTime: number
  livePrice: number | null
  metrics: StrategicMetrics
  settings: TradeSettings
  balance: number | null
  currency: string
  tradeHistory: Trade[]
  setSettings: React.Dispatch<React.SetStateAction<TradeSettings>>
  startBot: () => Promise<void>
  stopBot: () => Promise<void>
  resetStats: () => void
  closeTrade: () => void
}

const DEFAULT_SETTINGS: TradeSettings = {
  stake: 10,
  takeProfit: 50,
  stopLoss: 30,
  maxTrades: 10,
  cooldownTrigger: 5,
  cooldownDuration: 1,
  market: 'R_100',
  autoSwitch: true,
  tradeMode: 'NO_TOUCH',
  kMultiplier: 10,
  volatilityThreshold: 0.5,
  overBarrier: 2,
  underBarrier: 8,
  recoveryStrategy: 'martingale',
  recoveryStep: 10,
  toolId: ''
}

const BotContext = createContext<BotContextType | undefined>(undefined)

export function BotProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<TradeSettings>(DEFAULT_SETTINGS)
  const [state, setState] = useState<BotState>('IDLE')
  const [stats, setStats] = useState<SessionStats>({
    trades: 0, wins: 0, losses: 0, profit: 0, winRate: 0
  })
  const [currentTrade, setCurrentTrade] = useState<CurrentTrade | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [cooldownTime, setCooldownTime] = useState(0)
  const [livePrice, setLivePrice] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [currency, setCurrency] = useState<string>("USD")
  const [metrics, setMetrics] = useState<StrategicMetrics>({
    volatility: 0, trendStrength: 0, trendDirection: 'sideways', barrierDistance: 0, tickHistogram: [], recentAvg: 0
  })
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])

  // Internal Refs
  const balanceSubId = useRef<number | null>(null)
  const stateRef = useRef<BotState>('IDLE')
  const tickSubId = useRef<number | null>(null)
  const tickBuffer = useRef<number[]>([])
  const lastCooldownCount = useRef<number>(0)
  const sessionId = useRef<string | null>(null)
  const lastTradeEndTime = useRef<number>(0)
  const isRestored = useRef(false)
  const isDemo = settings.activeAcct?.startsWith('VRTC')

  // Log Engine
  const addLog = useCallback(async (action: string, details: string, level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') => {
    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      action, details, level
    }
    setLogs(prev => [newLog, ...prev].slice(0, 50))

    if (!isDemo && sessionId.current) {
        await supabase.from('bot_logs').insert({
            session_id: sessionId.current,
            tool_id: settings.toolId,
            action, details, level
        })
    }
  }, [isDemo, settings.toolId])

  // Market Intelligence
  const analyzeMarket = useCallback(() => {
    if (tickBuffer.current.length < 20) return null
    const buffer = tickBuffer.current
    const last20 = buffer.slice(-20)
    const last10 = buffer.slice(-10)

    let totalChange = 0
    for (let i = 1; i < last20.length; i++) {
        totalChange += Math.abs(last20[i] - last20[i-1])
    }
    const volatility = totalChange / (last20.length - 1)
    const startPrice = last10[0]
    const endPrice = last10[last10.length - 1]
    const priceChange = endPrice - startPrice
    const trendStrength = Math.min(Math.max((priceChange / volatility) * 10, -100), 100)
    
    let trendDirection: 'sideways' | 'bullish' | 'bearish' = 'sideways'
    if (trendStrength > 30) trendDirection = 'bullish'
    else if (trendStrength < -30) trendDirection = 'bearish'

    const barrierDistance = volatility * settings.kMultiplier
    return {
        volatility: Number(volatility.toFixed(4)),
        trendStrength: Math.round(trendStrength),
        trendDirection,
        barrierDistance: Number(barrierDistance.toFixed(2))
    }
  }, [settings.kMultiplier])

  // Global Tick Stream
  useEffect(() => {
    let isSubscribed = true
    const setupTickSub = async () => {
        if (tickSubId.current) {
            await derivAPI.unsubscribe(tickSubId.current)
            tickSubId.current = null
        }
        tickSubId.current = await derivAPI.subscribeToTicks(settings.market, async (tick) => {
            if (!isSubscribed) return
            const price = Number(tick.quote)
            setLivePrice(price)
            // Update tick buffer (max 1000)
            tickBuffer.current.push(price)
            if (tickBuffer.current.length > 1000) tickBuffer.current.shift()
            // Persist to localStorage
            try {
              localStorage.setItem(`derivex_ticks_${settings.market}`, JSON.stringify(tickBuffer.current))
            } catch (e) { console.error('Failed to persist ticks', e) }
            const newMetrics = analyzeMarket()
            if (newMetrics) setMetrics(prev => ({ ...prev, ...newMetrics }))
            // Also compute histogram and recent average
            const hist = new Array(10).fill(0)
            tickBuffer.current.forEach(t => {
              const digit = Math.floor(t) % 10
              hist[digit]++
            })
            const avg = tickBuffer.current.reduce((a, b) => a + b, 0) / tickBuffer.current.length
            setMetrics(prev => ({ ...prev, tickHistogram: hist, recentAvg: avg }))
        })
    }
    setupTickSub()
    return () => {
        isSubscribed = false
        if (tickSubId.current) derivAPI.unsubscribe(tickSubId.current)
    }
  }, [settings.market, analyzeMarket])

  // Global Balance Stream
  useEffect(() => {
    let isSubscribed = true
    const setupBalanceSub = async () => {
        if (balanceSubId.current) {
            await derivAPI.unsubscribe(balanceSubId.current)
            balanceSubId.current = null
        }
        balanceSubId.current = await derivAPI.subscribeToBalance((data) => {
            if (!isSubscribed) return
            setBalance(Number(data.balance))
            setCurrency(data.currency || "USD")
        })
    }
    setupBalanceSub()
    return () => {
        isSubscribed = false
        if (balanceSubId.current) derivAPI.unsubscribe(balanceSubId.current)
    }
  }, [settings.activeAcct])

  // Persistence Restoration Engine (Anti-Refresh Loss)
  useEffect(() => {
    const acct = localStorage.getItem("derivex_acct") || ""
    if (acct.startsWith('VRTC')) {
        const savedStats = localStorage.getItem(`derivex_stats_${acct}`)
        const savedLogs = localStorage.getItem(`derivex_logs_${acct}`)
        const savedHistory = localStorage.getItem(`derivex_history_${acct}`)
        if (savedStats) setStats(JSON.parse(savedStats))
        if (savedLogs) setLogs(JSON.parse(savedLogs))
        if (savedHistory) setTradeHistory(JSON.parse(savedHistory))
    }
    isRestored.current = true
  }, [])

  // LocalStorage Sentinel (Demo Saving)
  useEffect(() => {
    if (isRestored.current && isDemo && stats.trades > 0) {
        localStorage.setItem(`derivex_stats_${settings.activeAcct}`, JSON.stringify(stats))
        localStorage.setItem(`derivex_logs_${settings.activeAcct}`, JSON.stringify(logs))
        localStorage.setItem(`derivex_history_${settings.activeAcct}`, JSON.stringify(tradeHistory))
    }
  }, [isDemo, stats, logs, tradeHistory, settings.activeAcct])

  // Authorization & Settings Synchronization
  useEffect(() => {
     const token = localStorage.getItem("derivex_token")
     const acct = localStorage.getItem("derivex_acct")
     const savedSettings = localStorage.getItem("derivex_bot_settings")
     
     if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings)
            setSettings(prev => ({ ...prev, ...parsed, activeToken: token || "", activeAcct: acct || "" }))
        } catch (e) { console.error("Failed to restore settings", e) }
     } else if (token && acct) {
        setSettings(prev => ({ ...prev, activeToken: token, activeAcct: acct }))
     }
  }, [])

  // Settings Saver
  useEffect(() => {
     if (settings.toolId) {
        const { activeToken, activeAcct, ...rest } = settings
        localStorage.setItem("derivex_bot_settings", JSON.stringify(rest))
     }
  }, [settings])

  const startBot = async () => {
    if (!settings.activeToken) {
        addLog('ERROR', 'No active account found. Please connect your broker.', 'ERROR')
        return
    }
    try {
        addLog('AUTH', `Synchronizing and Authorizing ${settings.activeAcct}...`)
        const authResp = await derivAPI.authorize(settings.activeToken)
        if (authResp.error) {
            addLog('ERROR', `Broker Refused: ${authResp.error.message}`, 'ERROR')
            return
        }
        addLog('START', `StatEngine Online. Monitoring ${settings.market}...`, 'SUCCESS')
        setState('SCANNING')
        stateRef.current = 'SCANNING'

        // Real Session Archival
        if (!isDemo) {
            const { data: userData } = await supabase.auth.getUser()
            if (userData.user) {
                const { data: session } = await supabase.from('bot_sessions').insert({
                    user_id: userData.user.id,
                    tool_id: settings.toolId,
                    settings: settings,
                    status: 'ACTIVE'
                }).select().single()
                if (session) sessionId.current = session.id
            }
        }
    } catch (err: any) {
        addLog('ERROR', `Startup Aborted: ${err.message}`, 'ERROR')
    }
  }

  const stopBot = async () => {
    addLog('STOP', 'Algorithm halted by user.', 'WARNING')
    if (!isDemo && sessionId.current) {
        await supabase.from('bot_sessions').update({
            status: 'STOPPED',
            total_trades: stats.trades,
            total_wins: stats.wins,
            total_losses: stats.losses,
            total_profit: stats.profit,
            win_rate: stats.winRate,
            ended_at: new Date().toISOString()
        }).eq('id', sessionId.current)
        sessionId.current = null
    }
    setState('STOPPED')
    stateRef.current = 'STOPPED'
  }

  const executeTrade = useCallback(async (computedBarrier: number) => {
    // Anti-Rapid-Fire Guard (30s spacing)
    const now = Date.now()
    if (now - lastTradeEndTime.current < 30000) return
    if (stateRef.current !== 'SCANNING' || !livePrice) return
    
    try {
      // Determine contract type based on mode
      let contractType: string
      let barrier: string
      if (settings.tradeMode === 'OVER_UNDER') {
        if (livePrice > settings.overBarrier) {
          contractType = 'CALL'
          barrier = `${settings.overBarrier}`
        } else if (livePrice < settings.underBarrier) {
          contractType = 'PUT'
          barrier = `${settings.underBarrier}`
        } else {
          // Price not beyond barriers, skip trade
          return
        }
      } else {
        contractType = settings.tradeMode === 'TOUCH' ? 'ONETOUCH' : 'NOTOUCH'
        barrier = `+${computedBarrier.toFixed(2)}`
      }
      
      addLog('ENTRY', `Placing ${contractType} contract at barrier ${barrier}`, 'SUCCESS')
      
      const resp = await derivAPI.buyContract({
        contractType,
        currency: 'USD',
        amount: settings.stake,
        duration: 2,
        symbol: settings.market,
        barrier,
        duration_unit: 'm'
      })

      if (resp.error) {
        addLog('ERROR', resp.error.message, 'ERROR')
        setState('SCANNING')
        stateRef.current = 'SCANNING'
        return
      }

      const tradeId = resp.buy.contract_id
      derivAPI.subscribeToOpenContract(tradeId, (contract) => {
          if (!stateRef.current) return
          setCurrentTrade({
              id: tradeId, symbol: settings.market,
              entryPrice: Number(contract.entry_tick || livePrice),
              currentPrice: Number(contract.current_spot || livePrice),
              profit: Number(contract.profit || 0),
              startTime: (contract.purchase_time || Date.now() / 1000) * 1000,
              barrier: contract.barrier
          })

          if (contract.is_sold) {
              const p = Number(contract.profit)
              const isWin = p > 0
              setStats(prev => {
                  const nt = prev.trades + 1
                  const nw = isWin ? prev.wins + 1 : prev.wins
                  const nl = isWin ? prev.losses : prev.losses + 1
                  const np = prev.profit + p
                  return { trades: nt, wins: nw, losses: nl, profit: Number(np.toFixed(2)), winRate: Number(((nw / nt) * 100).toFixed(1)) }
              })

              // Add to Detailed History
              const newTrade: Trade = {
                id: tradeId,
                symbol: settings.market,
                type: settings.tradeMode,
                stake: settings.stake,
                barrier: contract.barrier || '0',
                entryPrice: Number(contract.entry_tick),
                exitPrice: Number(contract.exit_tick),
                profit: p,
                result: isWin ? 'WIN' : 'LOSS',
                timestamp: new Date().toISOString()
              }
              setTradeHistory(prev => [newTrade, ...prev].slice(0, 50)) // Keep last 50

              addLog('SETTLED', `Result: ${isWin ? '+' : ''}${p.toFixed(2)} on ${tradeId}`, isWin ? 'SUCCESS' : 'ERROR')
              
              // Spacing reset
              lastTradeEndTime.current = Date.now()
              setCurrentTrade(null)
              setState('SCANNING')
              stateRef.current = 'SCANNING'

              // Institutional Detailed Record-Keeping
              if (!isDemo) {
                  // Push to public social archive here if required
              }
          }
      })
      setState('IN_TRADE')
      stateRef.current = 'IN_TRADE'
    } catch (err: any) {
      addLog('ERROR', err.message || 'Execution failed', 'ERROR')
      // Apply recovery strategy
      if (settings.recoveryStrategy === 'martingale') {
        setSettings(prev => ({ ...prev, stake: prev.stake * 2 }))
      } else if (settings.recoveryStrategy === 'fixed') {
        setSettings(prev => ({ ...prev, stake: prev.stake + settings.recoveryStep }))
      }
      setState('SCANNING')
      stateRef.current = 'SCANNING'
    }
  }, [settings, livePrice, metrics, addLog, isDemo])

  // Intelligence Loop
  useEffect(() => {
    if (state === 'SCANNING') {
        if (stats.trades >= settings.maxTrades) {
            addLog('HALT', `Max trade limit (${settings.maxTrades}) reached for this session.`, 'WARNING')
            stopBot()
            return
        }
        if (stats.profit >= settings.takeProfit) {
            addLog('HALT', `Take Profit goal of $${settings.takeProfit} achieved.`, 'SUCCESS')
            stopBot()
            return
        }
        if (stats.profit <= -settings.stopLoss) {
            addLog('HALT', `Stop Loss limit of -$${settings.stopLoss} hit.`, 'ERROR')
            stopBot()
            return
        }
        if (stats.trades > 0 && stats.trades % settings.cooldownTrigger === 0 && cooldownTime === 0 && lastCooldownCount.current !== stats.trades) {
            lastCooldownCount.current = stats.trades
            setState('COOLDOWN')
            stateRef.current = 'COOLDOWN'
            setCooldownTime(settings.cooldownDuration * 60)
            addLog('COOLDOWN', `Milestone Reached. Cooling down for ${settings.cooldownDuration} minute(s).`, 'WARNING')
            return
        }
        // Over/Under logic
        if (settings.tradeMode === 'OVER_UNDER') {
            if (livePrice && livePrice > settings.overBarrier) {
                executeTrade(settings.overBarrier)
            } else if (livePrice && livePrice < settings.underBarrier) {
                executeTrade(settings.underBarrier)
            }
        } else if (metrics.volatility > 0) {
            const isSafe = metrics.volatility < settings.volatilityThreshold
            const isSideways = metrics.trendDirection === 'sideways'
            if (settings.tradeMode === 'NO_TOUCH' && isSafe && isSideways) {
                executeTrade(metrics.barrierDistance)
            } else if (settings.tradeMode === 'TOUCH' && !isSideways && metrics.volatility > settings.volatilityThreshold * 0.5) {
                executeTrade(metrics.barrierDistance * 0.5)
            }
        }
    }
  }, [state, stats, settings, cooldownTime, metrics, executeTrade, addLog, livePrice])

  // Cooldown Timer
  useEffect(() => {
    let timer: any
    if (state === 'COOLDOWN' && cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) { 
            setState('SCANNING'); stateRef.current = 'SCANNING'; 
            return 0 
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [state, cooldownTime])

  return (
    <BotContext.Provider value={{
      state, stats, currentTrade, logs, tradeHistory, cooldownTime, livePrice, metrics, settings,
      balance, currency,
      setSettings, startBot, stopBot, resetStats: () => {
        if (isDemo) {
           localStorage.removeItem(`derivex_stats_${settings.activeAcct}`)
           localStorage.removeItem(`derivex_logs_${settings.activeAcct}`)
           localStorage.removeItem(`derivex_history_${settings.activeAcct}`)
           setStats({ trades: 0, wins: 0, losses: 0, profit: 0, winRate: 0 })
           setLogs([])
           setTradeHistory([])
        }
      },
      closeTrade: () => addLog('HALT', 'Manual closure disabled for strategy integrity.', 'WARNING')
    }}>
      {children}
    </BotContext.Provider>
  )
}

export function useBot() {
  const context = useContext(BotContext)
  if (!context) throw new Error('useBot must be used within a BotProvider')
  return context
}
