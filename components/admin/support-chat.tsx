"use client"

import * as React from "react"
import { 
  Search, 
  Send, 
  Image as ImageIcon, 
  User, 
  MoreVertical,
  Circle,
  Loader2,
  Paperclip,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/db"

interface Message {
  id: string
  user_id: string
  text: string
  image_url: string | null
  is_from_admin: boolean
  created_at: string
}

interface ChatUser {
  id: string
  username: string
  avatar_url: string
  last_message?: string
  last_time?: string
  unread_count?: number
}

export function SupportChat() {
  const [selectedUser, setSelectedUser] = React.useState<ChatUser | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [inputText, setInputText] = React.useState("")
  const [chatUsers, setChatUsers] = React.useState<ChatUser[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Fetch unique users from support_messages
  React.useEffect(() => {
    async function fetchChatUsers() {
      setIsLoading(true)
      try {
        // In a real app, this would be a more complex joined query
        // For now, we'll fetch users that have messages
        const { data: msgData } = await supabase
          .from("support_messages")
          .select("user_id, text, created_at")
          .order("created_at", { ascending: false })

        if (msgData) {
          const uniqueUserIds = Array.from(new Set(msgData.map(m => m.user_id)))
          
          const { data: userData } = await supabase
            .from("users")
            .select("deriv_account_id, username, avatar_url")
            .in("deriv_account_id", uniqueUserIds)

          if (userData) {
            const usersWithLastMsg = userData.map(u => {
              const lastMsg = msgData.find(m => m.user_id === u.deriv_account_id)
              return {
                id: u.deriv_account_id,
                username: u.username || "Anonymous Trader",
                avatar_url: u.avatar_url || "",
                last_message: lastMsg?.text || "",
                last_time: lastMsg?.created_at || ""
              }
            })
            setChatUsers(usersWithLastMsg)
          }
        }
      } catch (err) {
        console.error("Error fetching chat users:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChatUsers()
  }, [])

  // Subscribe to new messages for selected user
  React.useEffect(() => {
    if (!selectedUser) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", selectedUser.id)
        .order("created_at", { ascending: true })
      if (data) setMessages(data)
    }

    fetchMessages()

    const channel = supabase
      .channel(`support_${selectedUser.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages',
        filter: `user_id=eq.${selectedUser.id}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUser])

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedUser) return

    const newMsg = {
      user_id: selectedUser.id,
      sender_id: "ADMIN_ROOT", // Placeholder for actual admin session
      text: inputText,
      is_from_admin: true
    }

    try {
      const { error } = await supabase.from("support_messages").insert(newMsg)
      if (!error) setInputText("")
    } catch (err) {
      console.error("Error sending message:", err)
    }
  }

  return (
    <div className="flex h-[600px] bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar - User List */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-black/40">
        <div className="p-6 border-b border-white/5 bg-zinc-900/40">
            <h3 className="font-black uppercase tracking-tighter text-sm mb-4">Support Queue</h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <Input 
                    placeholder="Search traders..." 
                    className="bg-white/5 border-white/5 pl-9 h-9 text-xs font-bold rounded-lg"
                />
            </div>
        </div>
        <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
                        <span className="text-[10px] font-black uppercase text-gray-600">Syncing Chats...</span>
                    </div>
                ) : chatUsers.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <p className="text-[10px] font-black uppercase text-gray-500 italic leading-relaxed">No active support tickets found in the system.</p>
                    </div>
                ) : chatUsers.map(user => (
                    <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group",
                            selectedUser?.id === user.id ? "bg-teal-600/10 border border-teal-500/20" : "hover:bg-white/5"
                        )}
                    >
                        <div className="relative">
                            <Avatar className="w-10 h-10 border border-white/10">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="bg-teal-500/10 text-teal-500 text-xs font-black">
                                    {user.username[0]}
                                </AvatarFallback>
                            </Avatar>
                            <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 fill-green-500 border-2 border-zinc-950" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className={cn(
                                    "text-xs font-black truncate",
                                    selectedUser?.id === user.id ? "text-teal-400" : "text-white group-hover:text-teal-400"
                                )}>
                                    {user.username}
                                </span>
                                <span className="text-[9px] text-gray-600 font-bold">{user.last_time ? new Date(user.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 truncate italic font-medium">
                                {user.last_message || "No messages yet"}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-black/20">
        {selectedUser ? (
            <>
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-white/10">
                            <AvatarImage src={selectedUser.avatar_url} />
                            <AvatarFallback className="bg-teal-500/10 text-teal-500 text-xs font-black">
                                {selectedUser.username[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="text-sm font-black text-white leading-none">{selectedUser.username}</h4>
                            <p className="text-[10px] text-teal-500 font-bold uppercase mt-1">Online • Session ID: {selectedUser.id.slice(0, 8)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white"><MoreVertical className="w-4 h-4" /></Button>
                    </div>
                </div>

                {/* Messages */}
                <div 
                    ref={scrollRef}
                    className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col custom-scrollbar"
                >
                    {messages.map((msg) => (
                        <div 
                            key={msg.id}
                            className={cn(
                                "flex flex-col max-w-[80%]",
                                msg.is_from_admin ? "self-end items-end" : "self-start items-start"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-2xl text-sm font-medium shadow-lg",
                                msg.is_from_admin 
                                    ? "bg-teal-600 text-white rounded-tr-none" 
                                    : "bg-zinc-800 text-white rounded-tl-none"
                            )}>
                                {msg.text}
                                {msg.image_url && (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                                        <img src={msg.image_url} alt="Attached" className="max-w-full h-auto grayscale-[0.3] hover:grayscale-0 transition-all" />
                                    </div>
                                )}
                            </div>
                            <span className="text-[9px] text-gray-500 uppercase font-black mt-1.5 tracking-widest">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Footer - Input Area */}
                <div className="p-4 border-t border-white/5 bg-zinc-950/80">
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                        <Button variant="ghost" size="icon" className="text-teal-500 hover:bg-white/5 hover:text-teal-400">
                            <Paperclip className="w-4 h-4" />
                        </Button>
                        <Input 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type an institutional response..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-white h-10"
                        />
                        <Button 
                            onClick={handleSendMessage}
                            className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl px-5 h-10 font-black uppercase tracking-widest text-[10px]"
                        >
                            Send <Send className="w-3 h-3 ml-2" />
                        </Button>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                <MessageSquare className="w-20 h-20 text-teal-800 mb-6" />
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Command Center Messaging</h3>
                <p className="text-xs text-gray-500 max-w-xs italic leading-relaxed">Select a trader from the queue to initiate a secure, encrypted support session.</p>
                <div className="mt-8 flex gap-3">
                    <Badge variant="outline" className="text-[9px] border-white/10 uppercase font-black">256-Bit SSL</Badge>
                    <Badge variant="outline" className="text-[9px] border-white/10 uppercase font-black">Live Monitor</Badge>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}
