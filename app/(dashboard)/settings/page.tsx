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
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const storedUser = localStorage.getItem("derivex_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

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
          {/* Profile Section */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">Account Identity</h3>
              </div>
              <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/20">
                Authorized
              </Badge>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</span>
                  <p className="text-white font-medium">{user?.fullname || "Guest Trader"}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Login ID</span>
                  <p className="text-white font-mono font-medium">{user?.loginid || "CR1000000"}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</span>
                  <p className="text-white font-medium">{user?.email || "guest@mesoflix.com"}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verification Status</span>
                  <div className="flex items-center gap-1.5 text-teal-400">
                    <BadgeCheck className="w-4 h-4" />
                    <span className="text-sm font-bold">Verified Level 1</span>
                  </div>
                </div>
              </div>
              <Separator className="bg-white/5" />
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500 max-w-sm">
                  These details are provided by your Deriv account. To change them, visit the Deriv portal.
                </p>
                <Button variant="outline" className="border-white/10 text-gray-400 hover:bg-white/5 gap-2" asChild>
                  <a href="https://app.deriv.com/account/personal-details" target="_blank" rel="noopener noreferrer">
                    Visit Deriv <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
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
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Active Session</h4>
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                    <Smartphone className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white">iPhone 14 (Mobile Web)</p>
                    <p className="text-[10px] text-gray-500 font-medium">Dublin, IE • Current Session</p>
                </div>
             </div>
             <Button variant="link" className="p-0 h-auto text-[10px] text-teal-400 font-bold uppercase tracking-widest">Manage Sessions</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
