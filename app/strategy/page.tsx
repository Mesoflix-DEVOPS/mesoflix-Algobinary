"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MainScene } from "@/components/main-scene"
import { Activity, CheckCircle, AlertCircle, Zap, TrendingUp } from "lucide-react"

export default function StrategyPage() {
  const router = useRouter()

  const activities = [
    {
      id: 1,
      type: "trade_win",
      user: "You",
      action: "Won trade with Golden Cross",
      amount: "+$450",
      time: "2 mins ago",
      icon: CheckCircle,
      color: "green",
    },
    {
      id: 2,
      type: "tool_activated",
      user: "Sarah M.",
      action: "Activated Bollinger Band Bounce",
      amount: null,
      time: "5 mins ago",
      icon: Zap,
      color: "teal",
    },
    {
      id: 3,
      type: "trade_loss",
      user: "You",
      action: "Lost trade with RSI Divergence",
      amount: "-$150",
      time: "12 mins ago",
      icon: AlertCircle,
      color: "red",
    },
    {
      id: 4,
      type: "new_user",
      user: "John D.",
      action: "Joined Derivex and activated MACD Momentum",
      amount: null,
      time: "18 mins ago",
      icon: Activity,
      color: "teal",
    },
    {
      id: 5,
      type: "milestone",
      user: "Emma W.",
      action: "Reached 1000 total trades milestone",
      amount: null,
      time: "25 mins ago",
      icon: TrendingUp,
      color: "yellow",
    },
    {
      id: 6,
      type: "trade_win",
      user: "Michael T.",
      action: "Won trade with Volume Surge",
      amount: "+$580",
      time: "32 mins ago",
      icon: CheckCircle,
      color: "green",
    },
    {
      id: 7,
      type: "tool_activated",
      user: "Lisa K.",
      action: "Activated Advanced Stochastic",
      amount: null,
      time: "38 mins ago",
      icon: Zap,
      color: "teal",
    },
    {
      id: 8,
      type: "trade_win",
      user: "You",
      action: "Won trade with Bollinger Band Bounce",
      amount: "+$320",
      time: "45 mins ago",
      icon: CheckCircle,
      color: "green",
    },
  ]

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-10">
        <MainScene />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-start justify-start p-8 overflow-y-auto pointer-events-none">
        <div className="w-full max-w-4xl mx-auto mb-8">
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/30">
            <Activity className="h-6 w-6 text-teal-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Activity <span className="text-teal-500">Feed</span>
          </h1>
          <p className="text-gray-400 text-lg">Real-time updates from traders on the Derivex platform</p>
        </div>

        {/* Activity Feed */}
        <div className="w-full max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-black/80 border border-teal-500/30 backdrop-blur-md rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-800">
              {activities.map((activity) => {
                const IconComponent = activity.icon
                const colorClasses = {
                  green: "text-green-500 bg-green-500/10",
                  red: "text-red-500 bg-red-500/10",
                  teal: "text-teal-500 bg-teal-500/10",
                  yellow: "text-yellow-500 bg-yellow-500/10",
                }

                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-900/50 transition"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">
                        <span className="font-bold">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-gray-400 text-sm">{activity.time}</p>
                    </div>

                    {activity.amount && (
                      <div className={`text-lg font-bold flex-shrink-0 ${
                        activity.amount.startsWith("+") ? "text-green-500" : "text-red-500"
                      }`}>
                        {activity.amount}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto mt-8 pointer-events-auto">
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
