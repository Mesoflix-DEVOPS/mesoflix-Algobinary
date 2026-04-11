"use client"

import * as React from "react"
import { 
  Activity, 
  Zap, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight,
  Filter,
  RefreshCcw,
  Search
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"

export default function GlobalActivityPage() {
  const [activities, setActivities] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchActivity = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("activity_feed")
      .select(`
        *,
        users (
          username
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50)
    
    if (data) setActivities(data)
    setIsLoading(false)
  }

  React.useEffect(() => {
    fetchActivity()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-teal-400" />
            Global Activity Stream
          </h1>
          <p className="text-gray-400 font-medium">
            Real-time feed of all platform trades, system deployments, and tool activations.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input placeholder="Filter events..." className="bg-transparent border-none text-xs text-white h-10 focus-visible:ring-0" />
           </div>
           <Button variant="outline" size="icon" className="border-white/10 text-gray-400 hover:bg-white/5 h-10 w-10" onClick={fetchActivity}>
              <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
           </Button>
        </div>
      </div>

      <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
           <div className="flex items-center gap-4">
              <Badge className="bg-teal-500/10 text-teal-500 border-teal-500/20">All Events</Badge>
              <Badge variant="outline" className="border-white/10 text-gray-500">Trades Only</Badge>
              <Badge variant="outline" className="border-white/10 text-gray-500">System Logs</Badge>
           </div>
           <Button variant="ghost" className="text-xs text-gray-500 font-bold hover:text-white">
              <Filter className="w-3 h-3 mr-2" />
              Advanced Filters
           </Button>
        </CardHeader>
        <CardContent className="p-0">
           <ScrollArea className="h-[700px]">
             <div className="divide-y divide-white/5">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => <div key={i} className="p-8 h-24 bg-white/[0.01] animate-pulse" />)
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0",
                          act.activity_type === "TRADE" ? "bg-teal-500/10 border-teal-500/20 text-teal-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                        )}>
                            {act.activity_type === "TRADE" ? <Zap className="w-6 h-6 fill-current" /> : <ShieldCheck className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                             <span className="text-sm font-bold text-white leading-none">
                                {act.users?.username || "System Engine"}
                             </span>
                             <Badge variant="outline" className="text-[10px] h-4 font-bold border-white/10 text-gray-500 px-1.5 uppercase tracking-tighter">
                                {act.activity_type}
                             </Badge>
                          </div>
                          <p className="text-gray-400 text-sm max-w-xl">
                            {act.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 self-end md:self-auto">
                         <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-none">Timestamp</span>
                            <span className="text-xs font-mono text-gray-400 mt-1 uppercase flex items-center gap-1.5">
                               <Clock className="w-3 h-3" />
                               {new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                         </div>
                         <Button variant="ghost" size="icon" className="text-gray-600 hover:text-white">
                            <ArrowUpRight className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  ))
                )}
                {activities.length === 0 && !isLoading && (
                  <div className="p-20 text-center space-y-4">
                     <Activity className="w-12 h-12 mx-auto text-gray-700 opacity-20" />
                     <p className="text-gray-500 font-medium">The stream is currently quiet. Waiting for new activity...</p>
                  </div>
                )}
             </div>
           </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
