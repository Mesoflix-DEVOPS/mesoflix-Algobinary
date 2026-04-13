"use client"

import * as React from "react"
import { Bell, Info, CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/db"

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
  const [userId, setUserId] = React.useState<string | null>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // ── Load user from localStorage
  React.useEffect(() => {
    const acct = localStorage.getItem("derivex_acct")
    const stored = localStorage.getItem("derivex_user")
    // Use loginid from user object, or acct as fallback
    const uid = stored ? (JSON.parse(stored)?.loginid || acct) : acct
    setUserId(uid)
  }, [])

  // ── Initial fetch
  const fetchNotifications = React.useCallback(async (uid: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/notifications?userId=${uid}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error("[Notifications] Fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Setup realtime subscription
  React.useEffect(() => {
    if (!userId) return

    fetchNotifications(userId)

    // Subscribe to INSERT events on notifications table for this user
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Prepend new notification immediately — no refresh needed
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (err) {
      console.error("[Notifications] Mark read error:", err)
    }
  }

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    await Promise.all(unread.map(n => handleMarkAsRead(n.id)))
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
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-teal-400 hover:bg-white/5 relative group transition-all duration-300 w-10 h-10"
        >
          <Bell className={cn("w-5 h-5", unreadCount > 0 && "animate-pulse text-teal-400")} />

          {/* ── Numeric badge count ── */}
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full",
              "flex items-center justify-center",
              "text-[9px] font-black text-black bg-teal-500",
              "border-2 border-black",
              "ring-2 ring-teal-500/30",
              "transition-all duration-300"
            )}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-zinc-950 border-white/10 text-white p-0 shadow-2xl overflow-hidden backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="p-0 text-sm font-black uppercase tracking-widest text-gray-400">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-teal-500/20 text-teal-400 text-[9px] font-black flex items-center justify-center border border-teal-500/30">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-3 h-3 text-teal-500 animate-spin" />}
            {/* Realtime indicator */}
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-8 h-8 text-gray-700 mb-3 opacity-20" />
              <p className="text-xs text-gray-500 font-medium">All clear! No alerts.</p>
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
                        <h4 className={cn(
                          "text-xs font-bold truncate",
                          !notif.is_read ? "text-white" : "text-gray-400"
                        )}>
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
                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.some(n => !n.is_read) && (
          <div className="p-2 border-t border-white/5 bg-black/40">
            <Button
              variant="ghost"
              className="w-full h-8 text-[10px] font-bold text-gray-500 hover:text-teal-400 uppercase tracking-tighter rounded-lg"
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
