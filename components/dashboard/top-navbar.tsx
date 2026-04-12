"use client"

import * as React from "react"
import { 
  Bell, 
  Search, 
  ChevronDown, 
  Globe, 
  Activity,
  Zap,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { derivAPI } from "@/lib/deriv-api"

export function TopNavbar() {
  const [user, setUser] = React.useState<any>(null)
  const [accounts, setAccounts] = React.useState<any[]>([])
  const [activeAcct, setActiveAcct] = React.useState<string | null>(null)
  const [balances, setBalances] = React.useState<Record<string, string>>({})
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [ticker, setTicker] = React.useState({
    vol75: "154,232.45",
    change: "+0.45",
    isUp: true
  })

  // Load user session and account list
  React.useEffect(() => {
    const storedUser = localStorage.getItem("derivex_user")
    const storedAccount = localStorage.getItem("derivex_acct")
    const storedAccounts = localStorage.getItem("derivex_accounts")
    
    if (storedUser) setUser(JSON.parse(storedUser))
    if (storedAccount) setActiveAcct(storedAccount)
    
    if (storedAccounts) {
        const parsedAccounts = JSON.parse(storedAccounts)
        setAccounts(parsedAccounts)
        syncBalances(parsedAccounts)
    }
  }, [])

  async function syncBalances(accountList: any[]) {
      if (isSyncing || accountList.length === 0) return
      setIsSyncing(true)
      console.log(`[TopNavbar] Starting balance sync for ${accountList.length} accounts...`)

      const originalToken = localStorage.getItem("derivex_token")
      const currentBalances: Record<string, string> = { ...balances }

      try {
          await derivAPI.connect()
          
          for (const acct of accountList) {
              try {
                  console.log(`[TopNavbar] Authorizing account: ${acct.account}`)
                  const resp = await derivAPI.authorize(acct.token)
                  if (resp.authorize) {
                      currentBalances[acct.account] = parseFloat(resp.authorize.balance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                      })
                      console.log(`[TopNavbar] Balance for ${acct.account}: ${resp.authorize.balance}`)
                  }
              } catch (acctErr) {
                  console.error(`[TopNavbar] Failed to sync account ${acct.account}:`, acctErr)
              }
          }

          setBalances(currentBalances)

          // Restore original authorization
          if (originalToken) {
              console.log("[TopNavbar] Restoring original account authorization")
              await derivAPI.authorize(originalToken)
          }
      } catch (err) {
          console.error("[TopNavbar] Global balance sync failure:", err)
      } finally {
          setIsSyncing(false)
          console.log("[TopNavbar] Balance sync complete")
      }
  }

  const balanceSubId = React.useRef<number | null>(null)

  // Real-time Balance Core
  React.useEffect(() => {
    let isSubscribed = true
    const setupSub = async () => {
        if (balanceSubId.current) {
            await derivAPI.unsubscribe(balanceSubId.current)
            balanceSubId.current = null
        }
        
        // Subscription will automatically reflect our current authorized account
        balanceSubId.current = await derivAPI.subscribeToBalance((balanceData) => {
            if (!isSubscribed) return
            setBalances(prev => ({
                ...prev,
                [balanceData.loginid]: parseFloat(balanceData.balance).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            }))
        })
    }
    setupSub()
    return () => {
        isSubscribed = false
        if (balanceSubId.current) derivAPI.unsubscribe(balanceSubId.current)
    }
  }, [activeAcct])

  // Periodic Background Refresh for Inactive Accounts
  React.useEffect(() => {
    const interval = setInterval(() => {
        if (!isSyncing && accounts.length > 0) {
            syncBalances(accounts)
        }
    }, 60000)
    return () => clearInterval(interval)
  }, [accounts, isSyncing])

  const handleSwitchAccount = (acct: any) => {
    if (acct.account === activeAcct) return

    localStorage.setItem("derivex_token", acct.token)
    localStorage.setItem("derivex_acct", acct.account)
    document.cookie = `derivex_token=${acct.token}; path=/; max-age=604800; samesite=lax`;
    
    // Refresh to ensure all providers re-sync with new authorization
    window.location.reload()
  }

  const handleLogout = () => {
    localStorage.clear()
    document.cookie = "derivex_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/"
  }
  // Simulated live ticker
  React.useEffect(() => {
    const interval = setInterval(() => {
      const current = parseFloat(ticker.vol75.replace(/,/g, ""))
      const delta = (Math.random() - 0.48) * 10
      const next = current + delta
      setTicker({
        vol75: next.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: (delta > 0 ? "+" : "") + delta.toFixed(2),
        isUp: delta > 0
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [ticker.vol75])

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-black/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <SidebarTrigger className="text-gray-400 hover:text-white" />
        <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
        
        {/* PROMINENT ACCOUNT SWITCHER */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 px-3 h-10 bg-white/5 border-white/10 hover:bg-white/10 hover:border-teal-500/50 transition-all rounded-xl min-w-[160px] justify-start group">
               {activeAcct?.startsWith('VRTC') ? (
                 <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-[9px] font-black h-5 px-1.5 uppercase shrink-0">Demo</Badge>
               ) : (
                 <Badge className="bg-teal-500/20 text-teal-500 border-teal-500/30 text-[9px] font-black h-5 px-1.5 uppercase shrink-0">Real</Badge>
               )}
               <div className="flex flex-col items-start leading-none gap-0.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white font-mono truncate">{activeAcct}</span>
                    <span className="text-[10px] font-black text-teal-400">
                        {balances[activeAcct || ""] ? `$${balances[activeAcct || ""]}` : isSyncing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : "---"}
                    </span>
                  </div>
                  <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">{user?.currency || "USD"} Wallet</span>
               </div>
               <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-white ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 bg-zinc-950 border-white/10 text-white p-2 shadow-3xl">
            <div className="flex items-center justify-between px-2 mb-2">
                <DropdownMenuLabel className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] p-0">Select Active Environment</DropdownMenuLabel>
                {isSyncing && <Loader2 className="w-3 h-3 text-teal-500 animate-spin" />}
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {accounts.map((acct) => {
                    const isDemo = acct.account.startsWith('VRTC');
                    const isActive = acct.account === activeAcct;
                    const balance = balances[acct.account];
                    return (
                        <DropdownMenuItem 
                            key={acct.account}
                            className={cn(
                                "cursor-pointer rounded-xl px-3 py-2.5 transition-all flex items-center justify-between group",
                                isActive ? "bg-white/10 border border-white/10" : "hover:bg-teal-500/5 border border-transparent"
                            )}
                            onClick={() => handleSwitchAccount(acct)}
                        >
                            <div className="flex flex-col">
                                <span className={cn(
                                    "text-xs font-bold",
                                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                                )}>
                                    {acct.account}
                                </span>
                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-none mt-1">
                                    {acct.currency} Wallet
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "text-[10px] font-black",
                                    isDemo ? "text-orange-500/70" : "text-teal-400"
                                )}>
                                    {balance ? `$${balance}` : isSyncing ? "..." : "---"}
                                </span>
                                <Badge className={cn(
                                    "text-[8px] font-black uppercase h-5",
                                    isDemo ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-teal-500/10 text-teal-500 border-teal-500/20"
                                )}>
                                    {isDemo ? "Demo" : "Real"}
                                </Badge>
                            </div>
                        </DropdownMenuItem>
                    )
                })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 max-w-sm mx-4 hidden xl:flex items-center gap-4 bg-white/5 rounded-full px-4 py-1.5 border border-white/5 shadow-inner">
        <div className="flex items-center gap-2 border-r border-white/10 pr-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">V75</span>
          <span className={cn(
            "text-sm font-mono font-bold",
            ticker.isUp ? "text-green-400" : "text-red-400"
          )}>
            {ticker.vol75}
          </span>
        </div>
        <div className="flex-1 flex items-center gap-2 text-gray-500 overflow-hidden">
          <Activity className="w-3 h-3 text-teal-500 animate-pulse shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-widest truncate">
            Market Feed: Operational
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-[9px] font-black text-teal-500 uppercase tracking-[0.2em] leading-none">Security</span>
          <span className="text-[11px] font-bold text-white mt-1 uppercase">Encrypted</span>
        </div>

        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-teal-400 hover:bg-white/5 relative hidden md:flex">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-black" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-white/5 h-10 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-500 font-bold text-xs uppercase overflow-hidden">
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    user?.fullname?.[0] || user?.loginid?.[0] || "GT"
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-white/10 text-white p-2">
            <DropdownMenuLabel className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">User Profile</DropdownMenuLabel>
            <div className="py-2 px-2">
                <p className="text-sm font-bold truncate">{user?.fullname || "Guest Trader"}</p>
                <p className="text-[10px] text-gray-500 font-mono italic">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer rounded-lg text-sm font-medium">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
               className="hover:bg-red-500/10 cursor-pointer text-red-500 focus:text-red-500 rounded-lg text-sm font-bold"
               onClick={handleLogout}
            >
              Sign Out Securely
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
