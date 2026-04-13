"use client"

import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Check, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/db"

export function ProfileCompletionPopup() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [avatars, setAvatars] = React.useState<any[]>([])
  const [selectedAvatar, setSelectedAvatar] = React.useState<string | null>(null)
  const [nickname, setNickname] = React.useState("")
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const storedUser = localStorage.getItem("derivex_user")
    if (storedUser) {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
        // If profile is not complete, show the popup
        if (parsed.profile_complete === false) {
           setIsOpen(true)
           fetchAvatars()
        }
    }
  }, [])

  const fetchAvatars = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("available_avatars")
        .select("*")
        .limit(10) // Show a small set initially
      if (data) setAvatars(data)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!nickname || nickname.length < 3) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.loginid,
          username: nickname,
          avatarUrl: selectedAvatar || user.avatar_url
        })
      })

      if (res.ok) {
        // Update local session
        const updatedUser = {
            ...user,
            fullname: nickname,
            avatar_url: selectedAvatar || user.avatar_url,
            profile_complete: true
        }
        localStorage.setItem("derivex_user", JSON.stringify(updatedUser))
        setIsOpen(false)
        // refresh to propagate changes to Navbar/Sidebar
        window.location.reload()
      }
    } catch (err) {
      console.error("[ProfilePopup] Error saving:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        // Prevent closing manually if incomplete
        if (!user?.profile_complete) return
        setIsOpen(open)
    }}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white p-6 shadow-3xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-teal-500" />
            </span>
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm italic">
            Welcome to the V2 Flow! Personalize your identity on the platform by choosing a nickname and a trader avatar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-[10px] font-black uppercase tracking-widest text-gray-500">Trader Nickname</Label>
            <Input 
              id="nickname" 
              placeholder="e.g. AlphaTrader, BullMaster" 
              className="bg-white/5 border-white/10 text-white h-11 focus:border-teal-500/50 transition-all font-bold"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Choose Avatar</Label>
                <Button variant="ghost" className="h-6 px-1 text-[9px] text-teal-500 hover:text-teal-400" onClick={fetchAvatars}>
                    <RefreshCw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} />
                    Refresh
                </Button>
             </div>
             
             <div className="grid grid-cols-5 gap-2">
                {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-white/5 animate-pulse" />
                    ))
                ) : (
                    avatars.map((ava) => (
                        <div 
                          key={ava.id} 
                          className={cn(
                             "aspect-square rounded-lg border-2 cursor-pointer transition-all overflow-hidden relative group",
                             selectedAvatar === ava.url ? "border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/20" : "border-white/5 bg-white/5 hover:border-white/20"
                          )}
                          onClick={() => setSelectedAvatar(ava.url)}
                        >
                            <img src={ava.url} alt={ava.name} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                            {selectedAvatar === ava.url && (
                                <div className="absolute inset-0 flex items-center justify-center bg-teal-500/20">
                                    <Check className="w-5 h-5 text-white drop-shadow" />
                                </div>
                            )}
                        </div>
                    ))
                )}
             </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-500 h-11 font-black uppercase tracking-widest transition-all rounded-xl"
            disabled={!nickname || nickname.length < 3 || isSaving}
            onClick={handleComplete}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Secure Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
