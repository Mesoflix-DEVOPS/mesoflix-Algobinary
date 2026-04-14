"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Loader2, 
  User, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Zap
} from "lucide-react"
import { supabase } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function SetupUsernamePage() {
  const router = useRouter()
  const [username, setUsername] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [checking, setChecking] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || username.length < 3) {
        setError("Username must be at least 3 characters.")
        return
    }

    setIsSubmitting(true)
    setError(null)

    try {
        const primaryAccountId = localStorage.getItem("derivex_acct")
        if (!primaryAccountId) throw new Error("No active session found.")

        // 1. Check if username is taken
        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("username", username.trim())
            .single()

        if (existing) {
            setError("This username is already taken. Please try another.")
            setIsSubmitting(false)
            return
        }

        // 2. Update user profile
        const { error: updateError } = await supabase
            .from("users")
            .update({ 
                username: username.trim(),
                profile_complete: true 
            })
            .eq("deriv_account_id", primaryAccountId)

        if (updateError) throw updateError

        // 3. Update local user data
        const localUserStr = localStorage.getItem("derivex_user")
        if (localUserStr) {
            const localUser = JSON.parse(localUserStr)
            localUser.username = username.trim()
            localUser.fullname = localUser.fullname || username.trim()
            localStorage.setItem("derivex_user", JSON.stringify(localUser))
        }

        localStorage.removeItem("derivex_onboarding_pending")
        router.push("/dashboard")
    } catch (err: any) {
        console.error("Setup failed:", err)
        setError(err.message || "Something went wrong. Please try again.")
        setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 blur-[120px] rounded-full" />
      
      <div className="relative z-10 w-full max-w-md space-y-10">
        <div className="flex flex-col items-center space-y-4">
           <div className="w-20 h-20 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.1)]">
              <User className="w-10 h-10 text-teal-500" />
           </div>
           <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Set Your Identity</h1>
              <p className="text-gray-500 text-sm mt-2 font-medium">Choose a unique pseudonym for the global leaderboard.</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Username</label>
              <div className="relative">
                 <Input 
                   value={username}
                   onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                   placeholder="e.g. AlgoKing_01"
                   className="bg-white/5 border-white/10 h-14 pl-12 rounded-xl focus:border-teal-500/50 focus:ring-teal-500/20 transition-all font-bold"
                   autoFocus
                   disabled={isSubmitting}
                 />
                 <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500/50" />
              </div>
              <p className="text-[10px] text-gray-600 ml-1">Only letters, numbers, and underscores allowed.</p>
           </div>

           {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-shake">
                 <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                 <p className="text-xs text-red-400 font-medium leading-relaxed">{error}</p>
              </div>
           )}

           <Button 
             disabled={isSubmitting || username.length < 3}
             className="w-full h-14 bg-teal-500 hover:bg-teal-600 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all group"
           >
              {isSubmitting ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Confirm Identity
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
           </Button>
        </form>

        <div className="flex items-center gap-3 justify-center p-4 rounded-2xl bg-white/5 border border-white/5 grayscale opacity-50">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Encrypted Profile Handshake</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </main>
  )
}
