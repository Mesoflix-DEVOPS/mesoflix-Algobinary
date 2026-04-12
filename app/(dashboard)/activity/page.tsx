"use client"

import * as React from "react"
import { Activity, Globe } from "lucide-react"
import { LiveActivityFeed } from "@/components/dashboard/live-activity-feed"

export default function GlobalActivityPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3 uppercase">
          <Activity className="w-8 h-8 text-teal-500" />
          Global Signal Stream
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Globe className="w-3 h-3" />
          Real-time Network Telemetry • Synthetic Node Engagement
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <LiveActivityFeed />
      </div>
      
      <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10">
        <p className="text-[10px] text-teal-500/60 font-medium leading-relaxed uppercase tracking-tighter text-center">
          The stream combines live execution data from the Mesoflix Cloud with simulated network traffic to maintain a high-fidelity diagnostic environment.
        </p>
      </div>
    </div>
  )
}
