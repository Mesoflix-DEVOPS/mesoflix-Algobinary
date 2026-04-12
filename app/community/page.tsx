"use client"

import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Users, Trophy, TrendingUp } from "lucide-react"

const MainScene = dynamic(() => import("@/components/main-scene").then(mod => mod.MainScene), {
  ssr: false,
})

export default function CommunityPage() {
  const router = useRouter()

  const leaderboard = [
    { rank: 1, name: "Alexander T.", profit: "+$48,250", winRate: "74%", trades: 456, medal: "🥇" },
    { rank: 2, name: "Maria S.", profit: "+$42,890", winRate: "71%", trades: 398, medal: "🥈" },
    { rank: 3, name: "John D.", profit: "+$39,450", winRate: "69%", trades: 367, medal: "🥉" },
    { rank: 4, name: "Lisa K.", profit: "+$35,670", winRate: "67%", trades: 342, medal: "4" },
    { rank: 5, name: "Robert M.", profit: "+$33,210", winRate: "66%", trades: 320, medal: "5" },
    { rank: 6, name: "Emma W.", profit: "+$31,540", winRate: "65%", trades: 298, medal: "6" },
    { rank: 7, name: "David H.", profit: "+$28,790", winRate: "63%", trades: 275, medal: "7" },
    { rank: 8, name: "Sarah C.", profit: "+$26,340", winRate: "62%", trades: 254, medal: "8" },
    { rank: 9, name: "Michael P.", profit: "+$24,560", winRate: "61%", trades: 235, medal: "9" },
    { rank: 10, name: "Jennifer R.", profit: "+$22,450", winRate: "60%", trades: 218, medal: "10" },
  ]

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-10">
        <MainScene />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-start justify-start p-8 overflow-y-auto pointer-events-none">
        <div className="w-full max-w-7xl mx-auto mb-8">
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/30">
            <Trophy className="h-6 w-6 text-teal-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Global <span className="text-teal-500">Leaderboard</span>
          </h1>
          <p className="text-gray-400 text-lg">Top traders making the most profit with Derivex automated tools</p>
        </div>

        {/* Top 3 Showcase */}
        <div className="w-full max-w-7xl mx-auto mb-8 pointer-events-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboard.slice(0, 3).map((trader) => (
              <div
                key={trader.rank}
                className={`border backdrop-blur-md rounded-lg p-6 ${
                  trader.rank === 1
                    ? "bg-yellow-500/10 border-yellow-500/50"
                    : trader.rank === 2
                      ? "bg-gray-500/10 border-gray-500/50"
                      : "bg-orange-500/10 border-orange-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl mb-2">{trader.medal}</p>
                    <h3 className="text-xl font-bold text-white">{trader.name}</h3>
                  </div>
                  <TrendingUp
                    className={`h-6 w-6 ${
                      trader.rank === 1
                        ? "text-yellow-500"
                        : trader.rank === 2
                          ? "text-gray-400"
                          : "text-orange-500"
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Profit</span>
                    <span className="text-green-500 font-bold">{trader.profit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate</span>
                    <span className="text-teal-500 font-bold">{trader.winRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trades</span>
                    <span className="text-white font-bold">{trader.trades}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Leaderboard Table */}
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Rankings</h2>
          <div className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg overflow-hidden pointer-events-auto">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th className="px-6 py-4 text-left text-gray-400 font-medium">Rank</th>
                    <th className="px-6 py-4 text-left text-gray-400 font-medium">Trader</th>
                    <th className="px-6 py-4 text-right text-gray-400 font-medium">Total Profit</th>
                    <th className="px-6 py-4 text-right text-gray-400 font-medium">Win Rate</th>
                    <th className="px-6 py-4 text-right text-gray-400 font-medium">Trades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {leaderboard.slice(3).map((trader) => (
                    <tr
                      key={trader.rank}
                      className="hover:bg-gray-900/50 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-white">{trader.rank}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{trader.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-500 font-bold">{trader.profit}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-teal-500">{trader.winRate}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white">{trader.trades}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
