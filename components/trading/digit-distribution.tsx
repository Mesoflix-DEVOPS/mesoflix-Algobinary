"use client"

import * as React from "react"
import { derivAPI } from "@/lib/deriv-api"
import { Loader2, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DigitDistributionProps {
  symbol: string
  isActive: boolean
  onTicksUpdate?: (ticks: number[]) => void
}

const MARKET_PRECISION: Record<string, number> = {
    "R_10": 3, "R_25": 3, "R_50": 4, "R_75": 4, "R_100": 2,
    "1s_10": 3, "1s_25": 3, "1s_50": 4, "1s_75": 4, "1s_100": 2,
    "JD10": 3, "JD50": 3, "JD100": 2
}

export function DigitDistribution({ symbol, isActive, onTicksUpdate }: DigitDistributionProps) {
  const [ticks, setTicks] = React.useState<number[]>([])
  const [latestDigit, setLatestDigit] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const subIdRef = React.useRef<number | null>(null)

  const precision = MARKET_PRECISION[symbol] || 4

  const extractLastDigit = (price: number) => {
    // We use the market precision to keep trailing zeros relevant
    const strVal = price.toFixed(precision)
    const digit = parseInt(strVal.slice(-1))
    return isNaN(digit) ? 0 : digit
  }

  // Load from localStorage initially
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`derivex_ticks_${symbol}`)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTicks(parsed)
            setIsLoading(false)
          }
        } catch (e) {}
      }
    }
  }, [symbol])

  React.useEffect(() => {
    if (!isActive) return

    setIsLoading(true)
    let isMounted = true

    const connect = async () => {
      if (subIdRef.current) {
        await derivAPI.unsubscribe(subIdRef.current)
      }
      
      const subId = await derivAPI.fetchTicksHistoryWithSubscribe(
        symbol,
        1000,
        (historyObj) => {
           if (!isMounted) return
           const prices = historyObj.prices as number[]
           setTicks(prices)
           setIsLoading(false)
           if (typeof window !== "undefined") {
               localStorage.setItem(`derivex_ticks_${symbol}`, JSON.stringify(prices))
           }
           if (onTicksUpdate) onTicksUpdate(prices)
        },
        (tickObj) => {
           if (!isMounted) return
           const price = tickObj.quote as number
           setTicks(prev => {
             const updated = [...prev, price].slice(-1000)
             if (typeof window !== "undefined") {
                 localStorage.setItem(`derivex_ticks_${symbol}`, JSON.stringify(updated))
             }
             if (onTicksUpdate) onTicksUpdate(updated)
             return updated
           })
           setLatestDigit(extractLastDigit(price))
        }
      )
      subIdRef.current = subId
    }

    connect()

    return () => {
      isMounted = false
      if (subIdRef.current) {
        derivAPI.unsubscribe(subIdRef.current)
      }
    }
  }, [symbol, isActive]) // eslint-disable-line

  if (!isActive) return null

  if (isLoading) {
    return (
      <div className="bg-[#121620] rounded-[24px] p-8 border border-white/5 shadow-2xl flex flex-col items-center justify-center min-h-[220px]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
        <p className="text-xs uppercase text-gray-500 font-bold tracking-widest text-center">
            Initializing 1000 Tick Telemetry...
        </p>
      </div>
    )
  }

  // Calculate percentages
  const stats = Array(10).fill(0)
  ticks.forEach(tick => {
    stats[extractLastDigit(tick)]++
  })

  const total = ticks.length || 1
  const percentages = stats.map(count => (count / total) * 100)

  // Determine ranks for coloring
  const sorted = [...percentages].sort((a, b) => b - a)
  const highest = sorted[0]
  const secondHighest = sorted[1]
  const lowest = sorted[9]
  const secondLowest = sorted[8]

  const DigitCircle = ({ digit }: { digit: number }) => {
      const pct = percentages[digit]
      const isLatest = digit === latestDigit

      let ringColor = "stroke-gray-700/50"
      let textColor = "text-gray-400"
      let labelBg = "bg-[#1E2330]"
      let labelText = "text-gray-300"

      if (pct === highest && highest > 0) {
          ringColor = "stroke-green-500"
          textColor = "text-green-500"
          labelBg = "bg-green-500/10 border border-green-500/20"
          labelText = "text-green-400"
      } else if (pct === secondHighest && secondHighest > 0) {
          ringColor = "stroke-blue-500"
          textColor = "text-blue-500"
          labelBg = "bg-blue-500/10 border border-blue-500/20"
          labelText = "text-blue-400"
      } else if (pct === lowest) {
          ringColor = "stroke-red-500"
          textColor = "text-red-500"
          labelBg = "bg-red-500/10 border border-red-500/20"
          labelText = "text-red-400"
      } else if (pct === secondLowest) {
          ringColor = "stroke-amber-500"
          textColor = "text-amber-500"
          labelBg = "bg-amber-500/10 border border-amber-500/20"
          labelText = "text-amber-400"
      }

      return (
        <div className="flex flex-col items-center gap-2 relative flex-1 min-w-0">
          {/* Real-time Pointer Arrow */}
          {isLatest && (
              <div className="absolute -top-6 text-blue-400 animate-bounce z-20">
                  <ArrowDown className="w-4 h-4 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              </div>
          )}

          {/* Circular Ring */}
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center">
              <svg className="w-full h-full rotate-[-90deg] absolute inset-0">
                <circle
                  cx="50%" cy="50%" r="42%"
                  className={cn("fill-none stroke-[2px] sm:stroke-[3px] md:stroke-[4px] transition-all duration-700", ringColor)}
                  strokeDasharray="264"
                  strokeDashoffset={(264 * (100 - pct)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className={cn("text-base sm:text-lg md:text-2xl font-black relative z-10", textColor)}>
                  {digit}
              </span>
          </div>

          {/* Percentage Label */}
          <div className={cn("px-1.5 py-0.5 rounded text-[9px] md:text-xs font-black whitespace-nowrap", labelBg, labelText)}>
              {pct.toFixed(1)}%
          </div>
        </div>
      )
  }

  return (
    <div className="bg-[#151923]/80 backdrop-blur-xl rounded-[32px] p-6 shadow-2xl border border-white/[0.05] space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex flex-col">
            <h2 className="text-lg font-black text-white tracking-tighter uppercase">Digit Distribution</h2>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">1,000 Tick Buffer</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black text-green-400 uppercase">Live Indexing</span>
            </div>
        </div>
      </div>

      <div className="grid gap-6">
          {/* Row 1: Digits 0-4 */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
              {[0, 1, 2, 3, 4].map(d => <DigitCircle key={d} digit={d} />)}
          </div>
          
          {/* Row 2: Digits 5-9 */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
              {[5, 6, 7, 8, 9].map(d => <DigitCircle key={d} digit={d} />)}
          </div>
      </div>

      <div className="flex items-center justify-between text-[10px] sm:text-xs font-black uppercase tracking-widest border-t border-white/5 pt-4">
         <div className="flex items-center gap-2">
            <span className="text-gray-500">Skew:</span>
            <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded">High: {highest.toFixed(1)}%</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Low: {lowest.toFixed(1)}%</span>
         </div>
      </div>
    </div>
  )
}
