"use client"

import * as React from "react"
import { ShieldCheck, UserCircle, Loader2, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface NicknameDialogProps {
  isOpen: boolean
  userId: string
  onComplete: (nickname: string) => void
}

export function NicknameDialog({ isOpen, userId, onComplete }: NicknameDialogProps) {
  const [nickname, setNickname] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async () => {
    if (!nickname.trim() || nickname.length < 3) {
        setError("Nickname too short.")
        return
    }

    setIsLoading(true)
    setError(null)

    try {
        const res = await fetch("/api/community/nickname", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, nickname })
        })
        const data = await res.json()

        if (res.ok) {
            onComplete(data.nickname)
        } else {
            setError(data.error || "Failed to set nickname.")
        }
    } catch (err) {
        setError("Network error. Please try again.")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white p-8 rounded-[2rem]">
        <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
                <UserCircle className="w-10 h-10" />
            </div>
            
            <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Initialize Identity</DialogTitle>
                <DialogDescription className="text-gray-500 italic max-w-xs mx-auto">
                    To maintain community integrity, all traders must operate under a unique identity. This name is permanent.
                </DialogDescription>
            </DialogHeader>

            <div className="w-full space-y-4">
                <div className="relative">
                    <Input 
                        value={nickname}
                        onChange={(e) => {
                            setNickname(e.target.value)
                            setError(null)
                        }}
                        placeholder="Enter unique nickname..."
                        className="h-14 bg-white/5 border-white/5 rounded-2xl text-center font-black uppercase tracking-widest text-teal-500 placeholder:text-gray-700 focus:ring-teal-500/20"
                    />
                    {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 animate-spin" />}
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-[10px] text-red-500 font-black uppercase">{error}</p>
                    </div>
                )}

                <div className="pt-4 flex flex-col gap-3">
                    <Button 
                        onClick={handleSubmit}
                        disabled={isLoading || nickname.length < 3}
                        className="h-14 bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-500/20 group"
                    >
                        {isLoading ? "Validating..." : "Claim Identity"}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    
                    <div className="flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-gray-600" />
                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Secured by The Guard Moderation Layer</span>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
