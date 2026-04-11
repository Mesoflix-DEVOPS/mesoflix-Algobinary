'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { derivAPI } from '@/lib/deriv-api'

export type BotState = 'IDLE' | 'SCANNING' | 'IN_TRADE' | 'COOLDOWN' | 'STOPPED'
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
  kMultiplier: number
  volatilityThreshold: number
  activeToken?: string
  activeAcct?: string
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

interface StrategicMetrics {
  volatility: number
  trendStrength: number // -100 to 100
  trendDirection: 'sideways' | 'bullish' | 'bearish'
  barrierDistance: number
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
  
  const [metrics, setMetrics] = useState<StrategicMetrics>({
    volatility: 0,
    trendStrength: 0,
    trendDirection: 'sideways',
    barrierDistance: 0
  })

  const stateRef = useRef<BotState>('IDLE')
  const tickSubId = useRef<number | null>(null)
  const tickBuffer = useRef<number[]>([])

  const addLog = useCallback((action: string, details: string, level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') => {
    setLogs(prev => [{
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      action,
      details,
      level
    }, ...prev].slice(0, 50))
  }, [])

  // Strategy Analysis
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
        barrierDistance: Number(barrierDistance.toFixed(4))
    }
  }, [settings.kMultiplier])

  // Process Ticks
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
            if (tickBuffer.current.length > 50) {
                tickBuffer.current.shift()
            }

            const newMetrics = analyzeMarket()
            if (newMetrics) {
                setMetrics(newMetrics)
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
  }, [settings.market, analyzeMarket])

  const startBot = async () => {
    if (!settings.activeToken) {
        addLog('ERROR', 'No active account token found. Please connect your account.', 'ERROR')
        return
    }

    try {
        addLog('AUTH', `Authorizing session for account ${settings.activeAcct}...`)
        const authResp = await derivAPI.authorize(settings.activeToken)
        
        if (authResp.error) {
            addLog('ERROR', `Authorization failed: ${authResp.error.message}`, 'ERROR')
            return
        }

        addLog('START', `StatEngine Initializing on ${settings.market}...`, 'SUCCESS')
        setState('SCANNING')
        stateRef.current = 'SCANNING'
    } catch (err: any) {
        addLog('ERROR', `Bot startup failed: ${err.message}`, 'ERROR')
    }
  }

  const stopBot = () => {
    addLog('STOP', 'Bot stopped manually.', 'WARNING')
    setState('STOPPED')
    stateRef.current = 'STOPPED'
  }

  const executeTrade = useCallback(async (computedBarrier: number) => {
    if (stateRef.current !== 'SCANNING' || !livePrice) return
    
    try {
      const type = settings.tradeMode === 'TOUCH' ? 'ONETOUCH' : 'NOTOUCH'
      const barrier = `+${computedBarrier}`
      
      addLog('ENTRY', `Strategy Met: Placing 2-min ${settings.tradeMode} (Vol: ${metrics.volatility}, Trend: ${metrics.trendDirection})`, 'SUCCESS')
      
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
        setState('SCANNING')
        stateRef.current = 'SCANNING'
        return
      }

      const tradeId = resp.buy.contract_id
      
      derivAPI.subscribeToOpenContract(tradeId, (contract) => {
          if (!stateRef.current) return

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
              
              addLog('SETTLED', `Result: ${isWin ? '+' : ''}${p.toFixed(2)} on ${tradeId}`, isWin ? 'SUCCESS' : 'ERROR')
              setCurrentTrade(null)
              setState('SCANNING')
              stateRef.current = 'SCANNING'
          }
      })
      
      setState('IN_TRADE')
      stateRef.current = 'IN_TRADE'
      
    } catch (err: any) {
      addLog('ERROR', err.message || 'Trade execution failed', 'ERROR')
      setState('SCANNING')
      stateRef.current = 'SCANNING'
    }
  }, [settings, livePrice, metrics, addLog])

  // Decision Engine Loop
  useEffect(() => {
    if (state === 'SCANNING') {
        if (stats.trades >= settings.maxTrades) {
            addLog('IDLE', 'Max trades reached. Ending session.', 'INFO')
            stopBot()
            return
        }
        if (stats.profit >= settings.takeProfit) {
            addLog('IDLE', 'Take profit reached! Ending session.', 'SUCCESS')
            stopBot()
            return
        }
        if (stats.profit <= -settings.stopLoss) {
            addLog('IDLE', 'Stop loss hit. Ending session.', 'ERROR')
            stopBot()
            return
        }

        if (stats.trades > 0 && stats.trades % settings.cooldownTrigger === 0 && cooldownTime === 0) {
            addLog('COOLDOWN', `Session Cooldown: Resting for ${settings.cooldownDuration} minute...`, 'WARNING')
            setState('COOLDOWN')
            stateRef.current = 'COOLDOWN'
            setCooldownTime(60)
            return
        }

        if (metrics.volatility > 0) {
            const isVolatilitySafe = metrics.volatility < settings.volatilityThreshold
            const isSideways = metrics.trendDirection === 'sideways'
            
            if (settings.tradeMode === 'NO_TOUCH') {
                if (isVolatilitySafe && isSideways) {
                    executeTrade(metrics.barrierDistance)
                }
            } else if (settings.tradeMode === 'TOUCH') {
                if (!isSideways && metrics.volatility > settings.volatilityThreshold * 0.5) {
                    executeTrade(metrics.barrierDistance * 0.5)
                }
            }
        }
    }
  }, [state, stats, settings, cooldownTime, metrics, executeTrade, addLog])

  useEffect(() => {
    let timer: any
    if (state === 'COOLDOWN' && cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            setState('SCANNING')
            stateRef.current = 'SCANNING'
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
    metrics,
    startBot,
    stopBot,
    closeTrade: () => {
        addLog('HALT', 'Manual trade closure ignored for strategy integrity.', 'WARNING')
    }
  }
}
