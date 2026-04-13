"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Users, Trophy, TrendingUp, Globe, MessageSquare, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChatRoom } from "@/components/community/chat-room"
import { NicknameDialog } from "@/components/community/nickname-dialog"
import { supabase } from "@/lib/db"

const MainScene = dynamic(() => import("@/components/main-scene").then(mod => mod.MainScene), {
  ssr: false,
})

export default function CommunityPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState("chat")
  const [user, setUser] = React.useState<any>(null)
  const [isNicknameOpen, setIsNicknameOpen] = React.useState(false)

  React.useEffect(() => {
    async function checkUserIdentity() {
        const localId = localStorage.getItem("deriv_account_id")
        if (!localId) {
            router.push("/login")
            return
        }

        const { data } = await supabase
            .from("users")
            .select("*")
            .eq("deriv_account_id", localId)
            .maybeSingle()

        if (data) {
            setUser(data)
            if (!data.nickname) {
                setIsNicknameOpen(true)
            }
        }
    }
    checkUserIdentity()
  }, [router])

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
    <main className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-teal-500/30">
      <div className="absolute inset-0 z-10 pointer-events-none opacity-40">
        <MainScene />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-none">
          <div className="pointer-events-auto">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20">
              <Users className="h-6 w-6 text-teal-500" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-2 uppercase tracking-tighter">
                Global <span className="text-teal-500">Terminal</span>
            </h1>
            <p className="text-gray-500 text-lg italic font-medium">Performance monitoring and institutional discourse hub</p>
          </div>
          
          <div className="pointer-events-auto flex items-center gap-4 bg-zinc-950 border border-white/5 p-4 rounded-3xl shadow-2xl">
                <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-gray-500 block">Identity Claimed</span>
                    <span className="text-sm font-bold text-teal-500">{user?.nickname || "Syncing..."}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center font-black text-teal-500 uppercase">
                    {user?.nickname?.[0] || "?"}
                </div>
          </div>
        </div>

        <Tabs defaultValue="chat" className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 pointer-events-auto">
            <TabsList className="bg-zinc-950 border border-white/5 rounded-[2rem] p-1 w-full max-w-md mx-auto mb-10 shadow-2xl backdrop-blur-md">
                <TabsTrigger value="chat" className="flex-1 rounded-[1.5rem] py-3 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                    <MessageSquare className="w-3.5 h-3.5 mr-2" /> Community Chat
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1 rounded-[1.5rem] py-3 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                    <Trophy className="w-3.5 h-3.5 mr-2" /> Leaderboard
                </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="relative flex-1 focus-visible:ring-0 outline-none">
                {user?.nickname ? (
                    <ChatRoom currentUser={{ id: user.deriv_account_id, nickname: user.nickname }} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
                        <p className="text-xs font-black uppercase text-gray-400">Loading Community Feed...</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="leaderboard" className="focus-visible:ring-0 outline-none">
                {/* Top 3 Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {leaderboard.slice(0, 3).map((trader) => (
                    <div
                        key={trader.rank}
                        className={cn(
                        "relative border backdrop-blur-3xl rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] duration-500 shadow-2xl group",
                        trader.rank === 1 ? "bg-teal-500/[0.03] border-teal-500/30" : "bg-white/[0.02] border-white/5"
                        )}
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy className={cn("w-20 h-20", trader.rank === 1 ? "text-teal-500" : "text-gray-500")} />
                        </div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="text-3xl">{trader.medal}</div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{trader.name}</h3>
                                <Badge className="bg-teal-500/10 text-teal-500 border-none text-[8px] h-4">ELITE TRADER</Badge>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                <span className="text-[10px] font-black text-gray-500 uppercase">Profit Record</span>
                                <span className="text-lg font-black text-teal-500">{trader.profit}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Win Rate</span>
                                    <span className="text-sm font-black text-white">{trader.winRate}</span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Trades</span>
                                    <span className="text-sm font-black text-white">{trader.trades}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>

                <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-500 tracking-widest">Rank</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-500 tracking-widest">Trader Identity</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-500 tracking-widest">Net Profit</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-500 tracking-widest">Accuracy</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-500 tracking-widest">Volume</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                            {leaderboard.slice(3).map((trader) => (
                                <tr key={trader.rank} className="hover:bg-teal-500/[0.02] transition-colors group">
                                    <td className="px-8 py-5">
                                        <span className="text-lg font-black text-white/40 group-hover:text-teal-500 transition-colors">#{trader.rank}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-[10px] uppercase text-gray-500">
                                                {trader.name[0]}
                                            </div>
                                            <span className="text-sm font-bold text-white uppercase">{trader.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-teal-400 text-sm">{trader.profit}</td>
                                    <td className="px-8 py-5 text-right font-bold text-gray-100 text-sm">{trader.winRate}</td>
                                    <td className="px-8 py-5 text-right font-bold text-gray-500 text-sm">{trader.trades}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </TabsContent>
        </Tabs>

        <div className="w-full max-w-7xl mx-auto mt-auto pb-12 pointer-events-auto flex items-center justify-between border-t border-white/5 pt-8">
          <Button
            variant="ghost"
            className="text-gray-500 hover:text-white font-black uppercase tracking-widest text-[10px]"
            onClick={() => router.push("/")}
          >
            ← Back to Terminal
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-gray-600 font-black uppercase">Community Engine Active • SECURED</span>
          </div>
        </div>
      </div>

      <NicknameDialog 
        isOpen={isNicknameOpen} 
        userId={user?.deriv_account_id} 
        onComplete={(name) => {
            setUser((prev: any) => ({ ...prev, nickname: name }))
            setIsNicknameOpen(false)
        }}
      />
    </main>
  )
}
