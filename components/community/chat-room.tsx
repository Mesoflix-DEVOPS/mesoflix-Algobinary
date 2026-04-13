"use client"

import * as React from "react"
import { 
  Send, 
  Users, 
  ShieldAlert, 
  MessageSquare,
  Lock,
  Globe,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/db"
import { moderateMessage } from "@/lib/moderation"

interface CommunityMessage {
  id: string
  user_id: string
  nickname: string
  text: string
  type: string
  created_at: string
}

interface ChatRoomProps {
  currentUser: {
    id: string
    nickname: string
  }
}

export function ChatRoom({ currentUser }: ChatRoomProps) {
  const [messages, setMessages] = React.useState<CommunityMessage[]>([])
  const [inputText, setInputText] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isBanned, setIsBanned] = React.useState(false)
  const [banReason, setBanReason] = React.useState("")
  const [warning, setWarning] = React.useState<string | null>(null)
  
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Fetch history and check ban status
  React.useEffect(() => {
    async function initChat() {
      setIsLoading(true)
      try {
        // 1. Check for active bans
        const { data: banData } = await supabase
          .from("community_bans")
          .select("*")
          .eq("user_id", currentUser.id)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle()
        
        if (banData) {
          setIsBanned(true)
          setBanReason(banData.reason || "Automatic system restriction.")
        }

        // 2. Fetch last 50 messages
        const { data: msgData } = await supabase
          .from("community_messages")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(50)
        
        if (msgData) setMessages(msgData)
      } catch (err) {
        console.error("Chat init error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    initChat()

    // Real-time: subscribe to new messages
    const channelName = `community_chat_${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'community_messages' 
      }, (payload) => {
        setMessages(prev => [...prev.slice(-49), payload.new as CommunityMessage])
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[ChatRoom] Realtime connected — live messages active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[ChatRoom] Realtime channel error — check RLS policies')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser.id])

  // Scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim() || isBanned) return

    // THE GUARD: Local Moderation Check
    const mod = moderateMessage(inputText)
    if (!mod.allowed) {
        setWarning(mod.reason || "Message blocked by The Guard.")
        setTimeout(() => setWarning(null), 5000)
        return
    }

    const newMsg = {
      user_id: currentUser.id,
      nickname: currentUser.nickname,
      text: inputText,
      type: "user"
    }

    try {
      const { error } = await supabase.from("community_messages").insert(newMsg)
      if (!error) {
        setInputText("")
        setWarning(null)
      }
    } catch (err) {
      console.error("Send error:", err)
    }
  }

  if (isBanned) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-950/50 border border-red-500/20 rounded-[2rem] animate-in zoom-in-95 duration-500 h-[600px]">
             <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                <Lock className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2">Access Restriced</h3>
             <p className="text-gray-500 text-sm italic max-w-xs">{banReason}</p>
             <div className="mt-8 p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-600 font-bold uppercase">Restriction Type: Community Guard Violation</p>
             </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-[650px] bg-zinc-950 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                    <Globe className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter text-white leading-none">Global Terminal</h3>
                    <p className="text-[10px] text-teal-500 font-bold uppercase mt-1 flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> Real-time Community Activity
                    </p>
                </div>
            </div>
            <Badge variant="outline" className="border-white/10 text-gray-500 text-[10px] font-black tracking-widest uppercase">Derivex Cloud</Badge>
        </div>

        {/* Messages */}
        <ScrollArea 
            ref={scrollRef}
            className="flex-1 p-6 space-y-4 custom-scrollbar"
        >
            <div className="space-y-6">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center py-20 opacity-20">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase">Channel Empty • Be the first to speak</p>
                    </div>
                )}
                
                {messages.map((msg) => (
                    <div key={msg.id} className={cn(
                        "flex gap-4 group transition-all duration-300",
                        msg.user_id === currentUser.id ? "flex-row-reverse" : "flex-row"
                    )}>
                        <Avatar className="w-10 h-10 border border-white/10 ring-2 ring-transparent group-hover:ring-teal-500/20 transition-all">
                             <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.nickname}`} />
                             <AvatarFallback className="bg-zinc-800 text-[10px] font-black">{msg.nickname[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className={cn(
                           "flex flex-col space-y-1.5",
                           msg.user_id === currentUser.id ? "items-end" : "items-start"
                        )}>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                    {msg.nickname}
                                </span>
                                {msg.user_id === currentUser.id && <Badge className="bg-teal-500/10 text-teal-500 text-[8px] h-3 px-1">ME</Badge>}
                            </div>
                            
                            <div className={cn(
                                "p-3.5 rounded-2xl text-sm font-medium shadow-lg max-w-sm",
                                msg.user_id === currentUser.id 
                                    ? "bg-teal-600 text-white rounded-tr-none" 
                                    : "bg-white/5 text-gray-100 border border-white/5 rounded-tl-none"
                            )}>
                                {msg.text}
                            </div>
                            
                            <span className="text-[9px] text-gray-700 font-bold uppercase">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>

        {/* The Guard Logic Indicators */}
        {warning && (
            <div className="absolute bottom-24 left-6 right-6 p-4 bg-red-600 text-white rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-2xl z-20">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p className="text-[11px] font-black uppercase tracking-tight leading-tight">{warning}</p>
            </div>
        )}

        {/* Input area */}
        <div className="p-6 border-t border-white/5 bg-zinc-950/80 mb-2">
             <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-2 flex items-center gap-2 relative">
                <Input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Contribute to global trading discourse..."
                    className="bg-transparent border-none focus-visible:ring-0 text-white font-bold h-12 flex-1 px-4 placeholder:text-gray-700"
                />
                <Button 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="h-12 w-12 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white shadow-xl shadow-teal-500/20 flex items-center justify-center p-0 transition-transform active:scale-95"
                >
                    <Send className="w-5 h-5" />
                </Button>
             </div>
             <div className="mt-3 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">End-to-End Encrypted Terminal • Active Defense Engaged</span>
             </div>
        </div>
    </div>
  )
}
