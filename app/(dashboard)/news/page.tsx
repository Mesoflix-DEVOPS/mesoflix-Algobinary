"use client"

import * as React from "react"
import { 
  Newspaper, 
  Tag, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Info,
  TrendingUp,
  Zap,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/db"

export const dynamic = "force-dynamic"

export default function NewsPage() {
  const [news, setNews] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchNews() {
      const { data, error } = await supabase
        .from("trading_news")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (data && data.length > 0) {
        setNews(data)
      } else {
        // Fallback mock news if DB is empty
        setNews([
          {
            id: 1,
            title: "Derivex Engine v2.4.0 Deployment",
            category: "Update",
            source: "Engineering Team",
            created_at: new Date().toISOString(),
            content: "We have successfully deployed the latest engine update focusing on tick processing latency reduction. Real-time heatmaps should now refresh 15% faster."
          },
          {
            id: 2,
            title: "New Asset: Volatility 100 (1s) Support",
            category: "New Tool",
            source: "Product",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            content: "The Digit Bias tool now supports Volatility 100 (1s) index. Higher frequency ticks provide more data points for short-term prediction strategies."
          }
        ])
      }
      setIsLoading(false)
    }
    fetchNews()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-teal-400" />
          News & Updates
        </h1>
        <p className="text-gray-400 font-medium max-w-2xl">
          Stay updated with tool releases, platform upgrades, and major market shifts affecting your automated strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* FEATURED NEWS */}
        <div className="md:col-span-8 space-y-6">
           {isLoading ? (
             [1, 2].map(i => <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse" />)
           ) : (
             news.map((item) => (
               <Card key={item.id} className="bg-zinc-900/50 border-white/5 overflow-hidden group hover:border-teal-500/30 transition-all">
                  <div className="p-8 space-y-4">
                     <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-teal-500/10 text-teal-500 border-none font-bold uppercase tracking-widest text-[10px]">
                           {item.category}
                        </Badge>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                           <Calendar className="w-3 h-3" />
                           {new Date(item.created_at).toLocaleDateString()}
                        </div>
                     </div>
                     <h2 className="text-2xl font-bold text-white group-hover:text-teal-400 transition-colors leading-tight">
                        {item.title}
                     </h2>
                     <p className="text-gray-400 leading-relaxed font-medium">
                        {item.content}
                     </p>
                     <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                              <Zap className="w-3 h-3 text-teal-500 fill-current" />
                           </div>
                           <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{item.source}</span>
                        </div>
                        <Button variant="ghost" className="text-teal-500 font-bold text-xs hover:bg-teal-500/10 group">
                           Read Full Article
                           <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                     </div>
                  </div>
               </Card>
             ))
           )}
        </div>

        {/* SIDEBAR UPDATES */}
        <div className="md:col-span-4 space-y-6">
           <Card className="bg-zinc-900 border-white/5">
              <CardHeader className="pb-4">
                 <CardTitle className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    Tool Releases
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {[
                   { name: "Digit Bias Pro", status: "Coming Soon", icon: Zap },
                   { name: "Trend Master v2", status: "Internal Alpha", icon: TrendingUp },
                 ].map((tool, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                         <tool.icon className="w-4 h-4 text-gray-500" />
                         <span className="text-xs font-bold text-white">{tool.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] border-teal-500/20 text-teal-500 font-bold uppercase tracking-widest">{tool.status}</Badge>
                   </div>
                 ))}
              </CardContent>
           </Card>

           <div className="rounded-3xl bg-zinc-900 border border-white/5 p-6 relative overflow-hidden group cursor-pointer hover:bg-zinc-800 transition-all">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                 <Info className="w-32 h-32 text-white" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Need Help?</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium mb-4">
                 Join our community server or read the documentation to master your automated tools.
              </p>
              <Button size="sm" className="bg-teal-500 text-black font-bold w-full rounded-xl">
                 Join Discord
                 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  )
}
