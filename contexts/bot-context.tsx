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
  ouSide?: 'OVER' | 'UNDER'
  ouTarget?: number
  martingaleMultiplier: number
  martingaleLevel: number
  kMultiplier: number
  volatilityThreshold: number
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
  tickHistogram: number[]
  recentAvg: number
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
  ouSide: 'OVER',
  ouTarget: 1,
  martingaleMultiplier: 2,
  martingaleLevel: 5,
  kMultiplier: 10,
  volatilityThreshold: 0.5,
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

  const balanceSubId = useRef<number | null>(null)
  const stateRef = useRef<BotState>('IDLE')
  const tickSubId = useRef<number | null>(null)
  const tickBuffer = useRef<number[]>([])
  const lastCooldownCount = useRef<number>(0)
  const sessionId = useRef<string | null>(null)
  const lastTradeEndTime = useRef<number>(0)
  const isDemo = settings.activeAcct?.startsWith('VRTC')
  const currentMultiplier = useRef<number>(1)
  const consecutiveLosses = useRef<number>(0)

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

  useEffect(() => {
    let isSubscribed = true
    const setupTickSub = async () => {
        if (tickSubId.current) {
            await derivAPI.unsubscribe(tickSubId.current)
            tickSubId.current = null
        }
        tickSubId.current = await derivAPI.subscribeToTicks(settings.market, (tick) => {
            if (!isSubscribed) return
            const price = Number(tick.quote)
            setLivePrice(price)
            tickBuffer.current.push(price)
            if (tickBuffer.current.length > 500) tickBuffer.current.shift()
            
            const newMetrics = analyzeMarket()
            if (newMetrics) setMetrics(prev => ({ ...prev, ...newMetrics }))
            
            const hist = new Array(10).fill(0)
            tickBuffer.current.forEach(t => {
              const digit = Math.floor(t * 100) % 10
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

  const startBot = async () => {
    if (!settings.activeToken) {
        addLog('ERROR', 'No active account found. Please connect your broker.', 'ERROR')
        return
    }
    try {
        addLog('AUTH', `Synchronizing session for ${settings.activeAcct}...`)
        const authResp = await derivAPI.authorize(settings.activeToken)
        if (authResp.error) {
            addLog('ERROR', `Broker Refused: ${authResp.error.message}`, 'ERROR')
            return
        }
        
        consecutiveLosses.current = 0
        currentMultiplier.current = 1
        addLog('START', `StatEngine Online. Monitoring ${settings.market}...`, 'SUCCESS')
        setState('SCANNING')
        stateRef.current = 'SCANNING'

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
    const now = Date.now()
    if (now - lastTradeEndTime.current < 2000) return 
    if (stateRef.current !== 'SCANNING' || !livePrice) return
    
    try {
      let contractType: string
      let barrier: string
      let duration = 2
      let durationUnit: 'm' | 't' = 'm'

      if (settings.tradeMode === 'OVER_UNDER') {
        contractType = settings.ouSide === 'UNDER' ? 'DIGITUNDER' : 'DIGITOVER'
        barrier = String(settings.ouTarget !== undefined ? settings.ouTarget : (settings.ouSide === 'UNDER' ? 8 : 1))
        duration = 1
        durationUnit = 't'
        addLog('ENTRY', `Digit Strategy: Placing 1-tick ${settings.ouSide} ${barrier} (Stake: ${(settings.stake * currentMultiplier.current).toFixed(2)})`, 'SUCCESS')
      } else {
        contractType = settings.tradeMode === 'TOUCH' ? 'ONETOUCH' : 'NOTOUCH'
        barrier = `+${computedBarrier.toFixed(2)}`
        addLog('ENTRY', `Placing ${contractType} contract at barrier ${barrier}`, 'SUCCESS')
      }
      
      const stakeAmount = Number((settings.stake * currentMultiplier.current).toFixed(2))

      const resp = await derivAPI.buyContract({
        contractType,
        currency: 'USD',
        amount: stakeAmount,
        duration: duration,
        symbol: settings.market,
        barrier,
        duration_unit: durationUnit
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
                  
                  if (isWin) {
                      consecutiveLosses.current = 0
                      currentMultiplier.current = 1
                  } else {
                      consecutiveLosses.current++
                      if (consecutiveLosses.current < settings.martingaleLevel) {
                          currentMultiplier.current *= settings.martingaleMultiplier
                      } else {
                          consecutiveLosses.current = 0
                          currentMultiplier.current = 1
                      }
                  }

                  return { trades: nt, wins: nw, losses: nl, profit: Number(np.toFixed(2)), winRate: Number(((nw / nt) * 100).toFixed(1)) }
              })

              const newTrade: Trade = {
                id: tradeId,
                symbol: settings.market,
                type: settings.tradeMode,
                stake: stakeAmount,
                barrier: contract.barrier || '0',
                entryPrice: Number(contract.entry_tick),
                exitPrice: Number(contract.exit_tick),
                profit: p,
                result: isWin ? 'WIN' : 'LOSS',
                timestamp: new Date().toISOString()
              }
              setTradeHistory(prev => [newTrade, ...prev].slice(0, 50))
              addLog('SETTLED', `Result: ${isWin ? '+' : ''}${p.toFixed(2)} on ${tradeId}`, isWin ? 'SUCCESS' : 'ERROR')
              
              lastTradeEndTime.current = Date.now()
              setCurrentTrade(null)
              setState('SCANNING')
              stateRef.current = 'SCANNING'
          }
      })
      setState('IN_TRADE')
      stateRef.current = 'IN_TRADE'
    } catch (err: any) {
      addLog('ERROR', err.message || 'Execution failed', 'ERROR')
      setState('SCANNING')
      stateRef.current = 'SCANNING'
    }
  }, [settings, livePrice, metrics, addLog])

  useEffect(() => {
    if (state === 'SCANNING') {
        if (stats.trades >= settings.maxTrades) {
            addLog('HALT', `Limit (${settings.maxTrades}) reached.`, 'WARNING')
            stopBot()
            return
        }
        if (stats.profit >= settings.takeProfit) {
            addLog('HALT', `Profit goal achieved.`, 'SUCCESS')
            stopBot()
            return
        }
        if (stats.profit <= -settings.stopLoss) {
            addLog('HALT', `Stop Loss limit hit.`, 'ERROR')
            stopBot()
            return
        }
        if (stats.trades > 0 && stats.trades % settings.cooldownTrigger === 0 && cooldownTime === 0 && lastCooldownCount.current !== stats.trades) {
            lastCooldownCount.current = stats.trades
            setState('COOLDOWN')
            stateRef.current = 'COOLDOWN'
            setCooldownTime(settings.cooldownDuration * 60)
            addLog('COOLDOWN', `Milestone Reached. Cooling down.`, 'WARNING')
            return
        }
        
        if (settings.tradeMode === 'OVER_UNDER') {
            if (livePrice) {
                const digit = parseInt(livePrice.toFixed(4).slice(-1))
                if (settings.ouSide === 'OVER') {
                    if (digit <= 1) executeTrade(0)
                } else if (settings.ouSide === 'UNDER') {
                    if (digit >= 8) executeTrade(0)
                }
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
        setStats({ trades: 0, wins: 0, losses: 0, profit: 0, winRate: 0 })
        setLogs([])
        setTradeHistory([])
        consecutiveLosses.current = 0
        currentMultiplier.current = 1
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
