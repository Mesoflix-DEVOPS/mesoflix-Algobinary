"use client"

import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Activity, DollarSign, TrendingUp, Zap } from "lucide-react"

const MainScene = dynamic(() => import("@/components/main-scene").then(mod => mod.MainScene), {
  ssr: false,
})

export default function TradingPage() {
  const router = useRouter()

  const userAccount = {
    balance: "$24,850",
    todayProfit: "+$1,250",
    monthlyProfit: "+$8,450",
    totalTrades: 342,
  }

  const activeTools = [
    { name: "Golden Cross", status: "Active", profit: "+$2,450", trades: 45 },
    { name: "RSI Divergence", status: "Active", profit: "+$1,890", trades: 32 },
    { name: "MACD Momentum", status: "Paused", profit: "+$1,200", trades: 28 },
  ]

  const recentTrades = [
    { symbol: "BTC/USD", type: "WIN", amount: "+$450", time: "2 mins ago" },
    { symbol: "EUR/USD", type: "WIN", amount: "+$320", time: "15 mins ago" },
    { symbol: "GBP/USD", type: "LOSS", amount: "-$150", time: "32 mins ago" },
    { symbol: "BTC/USD", type: "WIN", amount: "+$580", time: "1 hour ago" },
  ]

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-10">
        <MainScene />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-start justify-start p-8 overflow-y-auto pointer-events-none">
        <div className="w-full max-w-7xl mx-auto mb-8">
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/30">
            <Activity className="h-6 w-6 text-teal-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Your <span className="text-teal-500">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-lg">Monitor your active tools and earnings in real-time</p>
        </div>

        {/* Account Overview */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 pointer-events-auto">
          <div className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Balance</p>
              <DollarSign className="h-5 w-5 text-teal-500" />
            </div>
            <p className="text-3xl font-bold text-white">{userAccount.balance}</p>
          </div>

          <div className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Today</p>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-500">{userAccount.todayProfit}</p>
          </div>

          <div className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">This Month</p>
              <TrendingUp className="h-5 w-5 text-teal-500" />
            </div>
            <p className="text-3xl font-bold text-teal-500">{userAccount.monthlyProfit}</p>
          </div>

          <div className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Trades</p>
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-white">{userAccount.totalTrades}</p>
          </div>
        </div>

        {/* Active Tools */}
        <div className="w-full max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Active Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-auto">
            {activeTools.map((tool, idx) => (
              <div
                key={idx}
                className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{tool.name}</h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      tool.status === "Active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {tool.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Profit</span>
                    <span className="text-teal-500 font-bold">{tool.profit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Trades</span>
                    <span className="text-white font-bold">{tool.trades}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Trades</h2>
          <div className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg overflow-hidden pointer-events-auto">
            <div className="divide-y divide-gray-800">
              {recentTrades.map((trade, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 hover:bg-gray-900/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <span className="text-teal-500 font-bold text-sm">{trade.symbol.split("/")[0]}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{trade.symbol}</p>
                      <p className="text-gray-400 text-sm">{trade.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded text-sm font-bold ${
                        trade.type === "WIN"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {trade.type}
                    </span>
                    <p
                      className={`font-bold text-lg ${
                        trade.type === "WIN" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {trade.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto mt-8 pointer-events-auto">
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
