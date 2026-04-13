"use client"

import * as React from "react"
import { MessageSquare, Send, Loader2, LifeBuoy, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/db"

interface SupportMsg {
  id: string
  user_id: string
  sender: string
  text: string
  created_at: string
}

export default function SupportPage() {
  const [messages, setMessages] = React.useState<SupportMsg[]>([])
  const [inputText, setInputText] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSending, setIsSending] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const acct = localStorage.getItem("derivex_acct")
    setUserId(acct)

    if (!acct) return

    async function fetchMessages() {
      setIsLoading(true)
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", acct)
        .order("created_at", { ascending: true })
      
      if (data) setMessages(data)
      setIsLoading(false)
    }

    fetchMessages()

    // Realtime subscription
    const channel = supabase
      .channel(`support_${acct}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
        filter: `user_id=eq.${acct}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as SupportMsg])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!inputText.trim() || !userId) return
    setIsSending(true)

    const newMsg = {
      user_id: userId,
      sender: "user",
      text: inputText.trim(),
    }

    await supabase.from("support_messages").insert(newMsg)
    setInputText("")
    setIsSending(false)
  }

  return (
    <div className="flex flex-col gap-6 min-h-full pb-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <LifeBuoy className="w-6 h-6 text-teal-500" />
          Support Center
          <Badge className="bg-green-500/10 text-green-500 border-none text-[9px] font-black uppercase tracking-widest">
            Live
          </Badge>
        </h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
          Direct line to the Derivex support team • Avg. response under 2 hours
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-4 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10">
        <CheckCircle2 className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-white">Your messages are private and encrypted</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Only you and the Derivex team can see this conversation. Admin replies appear here in real-time.
          </p>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex flex-col bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex-1" style={{ minHeight: "500px" }}>
        <div className="px-6 py-4 border-b border-white/5 bg-zinc-900/40 flex items-center gap-3">
          <MessageSquare className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-black uppercase tracking-widest">Support Thread</span>
          <div className="ml-auto flex items-center gap-2">
            <Clock className="w-3 h-3 text-gray-600" />
            <span className="text-[9px] text-gray-600 font-bold uppercase">Response within 2 hrs</span>
          </div>
        </div>

        <ScrollArea ref={scrollRef} className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
              <LifeBuoy className="w-12 h-12 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">No messages yet</p>
              <p className="text-[10px] text-gray-500 mt-1">Start the conversation below</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${
                    msg.sender === "admin" ? "bg-teal-500/20 text-teal-500" : "bg-white/10 text-white"
                  }`}>
                    {msg.sender === "admin" ? "DX" : "ME"}
                  </div>
                  <div className="flex flex-col gap-1 max-w-xs">
                    <span className="text-[9px] font-black uppercase text-gray-600 tracking-wider px-1">
                      {msg.sender === "admin" ? "Derivex Support" : "You"}
                    </span>
                    <div className={`p-3 rounded-2xl text-sm font-medium ${
                      msg.sender === "user"
                        ? "bg-teal-600 text-white rounded-tr-none"
                        : "bg-white/5 text-gray-100 border border-white/5 rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-700 font-bold px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-zinc-950/80">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-2 flex items-center gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Describe your issue or question..."
              className="bg-transparent border-none focus-visible:ring-0 text-white font-bold h-11 flex-1 px-3 placeholder:text-gray-700"
            />
            <Button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className="h-11 w-11 rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center p-0 shrink-0 transition-transform active:scale-95"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
