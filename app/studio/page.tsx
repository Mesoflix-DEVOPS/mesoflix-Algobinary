"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MainScene } from "@/components/main-scene"
import { Zap, TrendingUp } from "lucide-react"

export default function StudioPage() {
  const router = useRouter()

  const tools = [
    {
      id: 1,
      name: "Golden Cross",
      description: "Classic moving average crossover strategy for trending markets",
      winRate: "68%",
      users: 2340,
      avgReturn: "+12.5%",
      difficulty: "Beginner",
    },
    {
      id: 2,
      name: "RSI Divergence",
      description: "Advanced oscillator-based strategy using RSI divergence patterns",
      winRate: "64%",
      users: 1860,
      avgReturn: "+9.8%",
      difficulty: "Intermediate",
    },
    {
      id: 3,
      name: "Bollinger Band Bounce",
      description: "Range trading strategy using Bollinger Bands for support/resistance",
      winRate: "72%",
      users: 3120,
      avgReturn: "+14.2%",
      difficulty: "Beginner",
    },
    {
      id: 4,
      name: "Volume Surge",
      description: "Entry confirmation strategy based on volume analysis",
      winRate: "66%",
      users: 1540,
      avgReturn: "+11.3%",
      difficulty: "Intermediate",
    },
    {
      id: 5,
      name: "MACD Momentum",
      description: "Momentum-based strategy using MACD for trend confirmation",
      winRate: "70%",
      users: 2780,
      avgReturn: "+13.1%",
      difficulty: "Beginner",
    },
    {
      id: 6,
      name: "Advanced Stochastic",
      description: "Complex multi-timeframe stochastic oscillator strategy",
      winRate: "62%",
      users: 980,
      avgReturn: "+10.7%",
      difficulty: "Advanced",
    },
  ]

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-10">
        <MainScene />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-start justify-start p-8 overflow-y-auto pointer-events-none">
        <div className="w-full max-w-7xl mx-auto mb-12">
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/30">
            <Zap className="h-6 w-6 text-teal-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Automated <span className="text-teal-500">Trading Tools</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Select from our proven automated trading strategies. One-click activation, instant earnings.
          </p>
        </div>

        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-auto">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg p-6 hover:border-teal-500/60 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{tool.name}</h3>
                  <p className="text-sm text-teal-500">{tool.difficulty}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-teal-500" />
              </div>

              <p className="text-gray-400 text-sm mb-4">{tool.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-900/50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                  <p className="text-lg font-bold text-green-500">{tool.winRate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Users</p>
                  <p className="text-lg font-bold text-white">{tool.users.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Avg Return</p>
                  <p className="text-lg font-bold text-teal-500">{tool.avgReturn}</p>
                </div>
              </div>

              <Button className="w-full bg-teal-500 hover:bg-teal-600 text-black font-bold">
                Activate Tool
              </Button>
            </div>
          ))}
        </div>

        <div className="w-full max-w-7xl mx-auto mt-12 pointer-events-auto">
          <Button
            variant="outline"
            className="border-teal-500 text-teal-500 hover:bg-teal-900/20"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </main>
  )
}
