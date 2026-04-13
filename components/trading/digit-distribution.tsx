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

export function DigitDistribution({ symbol, isActive, onTicksUpdate }: DigitDistributionProps) {
  const [ticks, setTicks] = React.useState<number[]>([])
  const [latestDigit, setLatestDigit] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const subIdRef = React.useRef<number | null>(null)

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
      // Unsubscribe previous if exists
      if (subIdRef.current) {
        await derivAPI.unsubscribe(subIdRef.current)
      }
      
      const subId = await derivAPI.fetchTicksHistoryWithSubscribe(
        symbol,
        1000,
        (historyObj) => {
           if (!isMounted) return
           // Map prices
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
           // Assuming deriv formats cleanly, we get the last decimal digit
           const strVal = price.toFixed(Math.max(0, (price.toString().split('.')[1] || '').length))
           const lastDigit = parseInt(strVal.slice(-1))
           setLatestDigit(lastDigit)
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
        <p className="text-xs uppercase text-gray-500 font-bold tracking-widest">
            Fetching 1000 Historic Ticks...
        </p>
      </div>
    )
  }

  // Calculate percentages
  const stats = Array(10).fill(0)
  ticks.forEach(tick => {
    const strVal = tick.toFixed(Math.max(0, (tick.toString().split('.')[1] || '').length))
    const lastD = parseInt(strVal.slice(-1))
    if (!isNaN(lastD)) stats[lastD]++
  })

  const total = ticks.length || 1
  const percentages = stats.map(count => (count / total) * 100)

  // Determine ranks
  const sorted = [...percentages].sort((a, b) => b - a)
  const highest = sorted[0]
  const secondHighest = sorted[1]
  const lowest = sorted[9]
  const secondLowest = sorted[8]

  return (
    <div className="bg-[#151923] rounded-3xl p-6 md:p-8 shadow-2xl border border-white/[0.03]">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter shadow-sm mb-1">
            Digit Distribution
        </h2>
        <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
      </div>

      <div className="flex justify-between items-end gap-2 md:gap-4 flex-nowrap overflow-x-auto pb-4 custom-scrollbar">
        {percentages.map((pct, digit) => {
          // Color logic based on screenshot requests
          let ringColor = "border-gray-700/50"
          let textColor = "text-gray-400"
          let labelBg = "bg-[#1E2330]"
          let labelText = "text-gray-300"

          if (pct === highest && highest > 0) {
              ringColor = "border-green-500"
              textColor = "text-green-500"
              labelBg = "bg-green-500/10 border border-green-500/20"
              labelText = "text-green-400"
          } else if (pct === secondHighest && secondHighest > 0) {
              ringColor = "border-blue-500"
              textColor = "text-blue-500"
              labelBg = "bg-blue-500/10 border border-blue-500/20"
              labelText = "text-blue-400"
          } else if (pct === lowest) {
              ringColor = "border-red-500"
              textColor = "text-red-500"
              labelBg = "bg-red-500/10 border border-red-500/20"
              labelText = "text-red-400"
          } else if (pct === secondLowest) {
              ringColor = "border-amber-500"
              textColor = "text-amber-500"
              labelBg = "bg-amber-500/10 border border-amber-500/20"
              labelText = "text-amber-400"
          }

          const isLatest = digit === latestDigit

          return (
            <div key={digit} className="flex flex-col items-center gap-3 relative min-w-[50px] md:min-w-[70px]">
              {/* Real-time Pointer Arrow */}
              {isLatest && (
                  <div className="absolute -top-8 text-blue-400 animate-bounce">
                      <ArrowDown className="w-5 h-5 drop-shadow-md" />
                  </div>
              )}

              {/* Circular Ring */}
              <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                  {/* SVG Circle for Progress (Partial arch visually) */}
                  <svg className="w-full h-full rotate-[-90deg] absolute inset-0">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      className={cn("fill-none stroke-[3px] md:stroke-[4px] transition-all duration-500", ringColor.replace('border-', 'stroke-'))}
                      strokeDasharray="264" // approximation for standard sizes
                      strokeDashoffset={(264 * (100 - pct)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={cn("text-xl md:text-2xl font-black relative z-10 drop-shadow-lg", textColor)}>
                      {digit}
                  </span>
              </div>

              {/* Percentage Label */}
              <div className={cn("px-2 py-0.5 rounded text-[10px] md:text-xs font-black shadow-inner whitespace-nowrap", labelBg, labelText)}>
                  {pct.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex justify-center text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-widest">
         <span className="text-gray-500 mr-2">Highest: <span className="text-white">{highest.toFixed(2)}%</span></span> | 
         <span className="text-gray-500 ml-2">Lowest: <span className="text-red-400">{lowest.toFixed(2)}%</span></span>
      </div>
    </div>
  )
}
