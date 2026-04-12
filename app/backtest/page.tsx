"use client"

import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { TrendingUp, BarChart3 } from "lucide-react"

const MainScene = dynamic(() => import("@/components/main-scene").then(mod => mod.MainScene), {
  ssr: false,
})

export default function BacktestPage() {
  const router = useRouter()

  const performanceMetrics = [
    { label: "Total Traders", value: "12,450", icon: "👥" },
    { label: "Avg Monthly Return", value: "+18.7%", icon: "📈" },
    { label: "Top Win Rate", value: "74%", icon: "✅" },
    { label: "Total Trades", value: "2.3M+", icon: "📊" },
  ]

  const topTools = [
    { name: "Golden Cross", winRate: "68%", avgReturn: "+12.5%", trades: "345K" },
    { name: "Bollinger Bounce", winRate: "72%", avgReturn: "+14.2%", trades: "289K" },
    { name: "MACD Momentum", winRate: "70%", avgReturn: "+13.1%", trades: "312K" },
  ]

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-10">
        <MainScene />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-start justify-start p-8 overflow-y-auto pointer-events-none">
        <div className="w-full max-w-7xl mx-auto mb-12">
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/30">
            <BarChart3 className="h-6 w-6 text-teal-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Platform <span className="text-teal-500">Performance</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Proven results from thousands of active traders using our automated tools.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 pointer-events-auto">
          {performanceMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg p-6"
            >
              <div className="text-3xl mb-2">{metric.icon}</div>
              <p className="text-gray-400 text-sm mb-2">{metric.label}</p>
              <p className="text-3xl font-bold text-teal-500">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Top Performing Tools */}
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Top Performing Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-auto">
            {topTools.map((tool, idx) => (
              <div
                key={idx}
                className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-teal-500 mr-2" />
                  {tool.name}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate</span>
                    <span className="text-green-500 font-bold">{tool.winRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Return</span>
                    <span className="text-teal-500 font-bold">{tool.avgReturn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Trades</span>
                    <span className="text-white font-bold">{tool.trades}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
