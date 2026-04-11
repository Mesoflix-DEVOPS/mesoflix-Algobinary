"use client"

import * as React from "react"
import { 
  User, 
  Shield, 
  Bell, 
  Monitor, 
  ExternalLink,
  LogOut,
  ChevronRight,
  BadgeCheck,
  Smartphone,
  CreditCard,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const [user, setUser] = React.useState<any>(null)
  const [avatars, setAvatars] = React.useState<any[]>([])
  const [sessions, setSessions] = React.useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    const storedUser = localStorage.getItem("derivex_user")
    const storedSessionId = localStorage.getItem("derivex_session_id")
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      fetchSessions(parsedUser.loginid)
    }
    
    if (storedSessionId) {
      setCurrentSessionId(storedSessionId)
    }

    async function fetchAvatars() {
      const { data } = await supabase.from("available_avatars").select("*").order("name")
      if (data) setAvatars(data)
    }

    async function fetchSessions(loginId: string) {
        const { data } = await supabase
            .from("user_sessions")
            .select("*")
            .eq("user_id", loginId)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
        
        if (data) setSessions(data)
    }

    fetchAvatars()
  }, [])

  const handleUpdateAvatar = async (url: string) => {
    if (!user) return
    setIsSaving(true)
    
    // Identify via Deriv Account ID or internal ID as fallback
    const identifier = user.loginid || user.deriv_account_id || user.id
    const filterColumn = (user.loginid || user.deriv_account_id) ? "deriv_account_id" : "id"

    try {
        const { error } = await supabase
            .from("users")
            .update({ avatar_url: url })
            .eq(filterColumn, identifier)

        if (!error) {
            const updatedUser = { ...user, avatar_url: url }
            localStorage.setItem("derivex_user", JSON.stringify(updatedUser))
            setUser(updatedUser)
            window.dispatchEvent(new Event('storage')) // Force navbar sync
        } else {
            console.error("Supabase update error:", error)
        }
    } catch (err) {
        console.error("Failed to update avatar:", err)
    } finally {
        setIsSaving(false)
    }
  }

  const handleRevokeSession = async (sessionToken: string) => {
    const { error } = await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("session_token", sessionToken)
    
    if (!error) {
        setSessions(prev => prev.filter(s => s.session_token !== sessionToken))
        if (sessionToken === currentSessionId) {
            handleLogout()
        }
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    document.cookie = "derivex_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/"
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white uppercase tracking-wider">System Settings</h1>
        <p className="text-gray-500 font-medium">Manage your trading cockpit and account synchronization.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Identity & Avatar Section */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">Identity Console</h3>
              </div>
              <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/20">
                Lvl 1 Verified
              </Badge>
            </div>
            <div className="p-6 space-y-8">
              {/* CURRENT PROFILE */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-teal-500/20 border-2 border-teal-500/30 overflow-hidden shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-black text-teal-500">
                                {user?.fullname?.[0] || user?.loginid?.[0] || "?"}
                            </div>
                        )}
                    </div>
                    {isSaving && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                        </div>
                    )}
                </div>
                <div>
                   <h4 className="text-xl font-bold text-white leading-tight">{user?.fullname || "Guest Trader"}</h4>
                   <p className="text-sm text-gray-500 font-mono mt-1">{user?.loginid || "---"}</p>
                   <p className="text-xs text-teal-500/70 font-bold uppercase tracking-widest mt-2">Active Deployment Identity</p>
                </div>
              </div>

              <Separator className="bg-white/5" />

              {/* AVATAR LIBRARY */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Avatar Selection Library</h4>
                        <p className="text-xs text-gray-500 mt-1">Select an institutional identity from the 50-unit collection.</p>
                    </div>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[300px] overflow-y-auto p-4 bg-black/40 rounded-2xl border border-white/5 custom-scrollbar">
                    {avatars.map((av) => (
                        <button 
                            key={av.id}
                            className={cn(
                                "aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-110 active:scale-95",
                                user?.avatar_url === av.url ? "border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)] bg-teal-500/10" : "border-white/10 hover:border-white/30 bg-white/5"
                            )}
                            onClick={() => handleUpdateAvatar(av.url)}
                            disabled={isSaving}
                        >
                            <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        </button>
                    ))}
                    {avatars.length === 0 && Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white uppercase tracking-widest text-sm">System Notifications</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-white">Trade Execution Alerts</p>
                  <p className="text-xs text-gray-500">Receive real-time popups when a tool places a trade.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-white/5" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-white">Profit Threshold reached</p>
                  <p className="text-xs text-gray-500">Notify when daily take-profit or stop-loss hits.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Connection Status */}
          <div className="p-6 bg-teal-500/5 border border-teal-500/10 rounded-2xl space-y-4 shadow-[0_0_50px_rgba(20,184,166,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Active Connection</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              Your Command Center is successfully authenticated via Deriv OAuth. Your tokens are encrypted and managed locally.
            </p>
            <div className="pt-2">
              <Button 
                variant="destructive" 
                className="w-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 font-bold uppercase tracking-widest text-xs h-12"
                onClick={handleLogout}
              >
                Disconnect & Logout
              </Button>
            </div>
          </div>

          {/* Device Security */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-6 shadow-2xl">
             <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Active Sessions</h4>
                <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-500 border-teal-500/20">
                    {sessions.length} Live
                </Badge>
             </div>
             
             <div className="space-y-4">
                {sessions.map((svc) => (
                    <div key={svc.id} className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        svc.session_token === currentSessionId ? "bg-teal-500/[0.03] border-teal-500/20" : "bg-white/[0.02] border-white/5"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                svc.device_type === "Mobile" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"
                            )}>
                                {svc.device_type === "Mobile" ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-white">{svc.device_name}</p>
                                    {svc.session_token === currentSessionId && (
                                        <Badge className="bg-teal-500 text-black text-[9px] font-black uppercase px-1.5 h-4">Current</Badge>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                    {svc.location || "Remote Connection"} • {new Date(svc.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        {svc.session_token !== currentSessionId && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[10px] font-bold text-red-500 hover:bg-red-500/10 uppercase tracking-tight"
                                onClick={() => handleRevokeSession(svc.session_token)}
                            >
                                Revoke
                            </Button>
                        )}
                    </div>
                ))}
                
                {sessions.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl">
                        <p className="text-xs text-gray-600 italic">Searching for active pulses...</p>
                    </div>
                )}
             </div>
             
             <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] text-gray-600 leading-relaxed font-medium">
                    Revoking a session will immediately terminate access for that device. If you don't recognize a device, revoke it and change your Deriv password immediately.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
