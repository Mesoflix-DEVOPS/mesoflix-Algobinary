"use client"

import * as React from "react"
import { Bell, Info, CheckCircle2, AlertTriangle, AlertCircle, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  is_read: boolean
  created_at: string
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [user, setUser] = React.useState<any>(null)

  const fetchNotifications = React.useCallback(async () => {
    if (!user?.loginid) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/notifications?userId=${user.loginid}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.is_read).length || 0)
      }
    } catch (err) {
      console.error("[Notifications] Fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.loginid])

  React.useEffect(() => {
    const storedUser = localStorage.getItem("derivex_user")
    if (storedUser) {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
    }
  }, [])

  React.useEffect(() => {
    if (user?.loginid) {
      fetchNotifications()
      // Poll every 30 seconds for new alerts
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.loginid, fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error("[Notifications] Mark read error:", err)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-orange-400" />
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return <Info className="w-4 h-4 text-blue-400" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-teal-400 hover:bg-white/5 relative group transition-all duration-300">
          <Bell className={cn("w-5 h-5", unreadCount > 0 && "animate-pulse")} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-black group-hover:scale-125 transition-transform" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-zinc-950 border-white/10 text-white p-0 shadow-2xl overflow-hidden backdrop-blur-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="p-0 text-sm font-black uppercase tracking-widest text-gray-400">System Alerts</DropdownMenuLabel>
            {unreadCount > 0 && (
                <Badge variant="outline" className="h-5 px-1.5 bg-teal-500/10 text-teal-500 border-teal-500/20 font-black text-[9px] uppercase">
                    {unreadCount} New
                </Badge>
            )}
          </div>
          {isLoading && <Loader2 className="w-3 h-3 text-teal-500 animate-spin" />}
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-8 h-8 text-gray-700 mb-3 opacity-20" />
              <p className="text-xs text-gray-500 font-medium">All clear! No current notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={cn(
                    "p-4 hover:bg-white/[0.03] transition-colors cursor-pointer relative group",
                    !notif.is_read && "bg-teal-500/[0.02]"
                  )}
                  onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        notif.type === "success" ? "bg-green-500/10" : 
                        notif.type === "warning" ? "bg-orange-500/10" :
                        notif.type === "error" ? "bg-red-500/10" : "bg-blue-500/10"
                    )}>
                        {getTypeIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={cn("text-xs font-bold truncate", !notif.is_read ? "text-white" : "text-gray-400")}>
                          {notif.title}
                        </h4>
                        <span className="text-[9px] text-gray-600 font-medium whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 italic">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                  {!notif.is_read && (
                      <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-2 border-t border-white/5 bg-black/40">
            <Button variant="ghost" className="w-full h-8 text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-tighter rounded-lg">
                Mark all as read
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
