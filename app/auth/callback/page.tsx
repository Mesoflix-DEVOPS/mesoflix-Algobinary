"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Zap,
  AlertCircle
} from "lucide-react"
import { derivAPI } from "@/lib/deriv-api"
import { supabase } from "@/lib/db"
import { cn } from "@/lib/utils"

type AuthStep = "EXTRACTING" | "CONNECTING" | "AUTHORIZING" | "SYNCING" | "FINALIZING" | "ERROR"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = React.useState<AuthStep>("EXTRACTING")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function processAuth() {
      try {
        // 1. EXTRACTING
        const tokens: Record<string, string> = {}
        const accounts: Record<string, string> = {}
        
        // Deriv sends back token1, acct1, token2, acct2 etc.
        let i = 1
        while (searchParams.get(`token${i}`)) {
          tokens[`token${i}`] = searchParams.get(`token${i}`)!
          accounts[`acct${i}`] = searchParams.get(`acct${i}`)!
          i++
        }

        if (Object.keys(tokens).length === 0) {
          throw new Error("No authorization tokens found in redirect.")
        }

        await new Promise(r => setTimeout(r, 800)) // Animation buffer
        setStep("CONNECTING")

        // 2. CONNECTING
        await derivAPI.connect()
        await new Promise(r => setTimeout(r, 800))
        setStep("AUTHORIZING")

        // 3. AUTHORIZING (Use the first account as primary)
        const primaryToken = tokens["token1"]
        const primaryAcct = accounts["acct1"]
        
        const authResponse = await derivAPI.authorize(primaryToken)
        if (authResponse.error) {
          throw new Error(authResponse.error.message)
        }

        await new Promise(r => setTimeout(r, 800))
        setStep("SYNCING")

        // 4. SYNCING (Save to Supabase)
        const userData = authResponse.authorize
        const { error: dbError } = await supabase.from("users").upsert({
          email: userData.email,
          username: userData.fullname || userData.loginid,
          full_name: userData.fullname,
          deriv_account_id: userData.loginid,
          deriv_token: primaryToken,
          balance: userData.balance || 0,
        }, { onConflict: 'email' })

        if (dbError) {
           console.error("Supabase sync error:", dbError)
           // We continue even if DB sync fails, but we log it
        }

        // Store session in localStorage
        localStorage.setItem("derivex_token", primaryToken)
        localStorage.setItem("derivex_acct", primaryAcct)
        localStorage.setItem("derivex_user", JSON.stringify(userData))

        await new Promise(r => setTimeout(r, 800))
        setStep("FINALIZING")
        
        // 5. REDIRECT
        router.push("/dashboard")

      } catch (err: any) {
        setStep("ERROR")
        setErrorMsg(err.message || "An unexpected error occurred during authentication.")
      }
    }

    processAuth()
  }, [searchParams, router])

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full" />
      
      <div className="relative z-10 w-full max-w-md space-y-12">
        <div className="flex flex-col items-center space-y-4">
           <div className="w-20 h-20 rounded-2xl bg-teal-500 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.4)] animate-pulse">
              <Zap className="w-10 h-10 text-black fill-black" />
           </div>
           <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Authenticating</h1>
              <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-widest">Secure Handshake in Progress</p>
           </div>
        </div>

        <div className="space-y-6">
           <StepItem 
              icon={<ShieldCheck className="w-5 h-5" />} 
              label="Extracting credentials" 
              status={step === "EXTRACTING" ? "loading" : "done"} 
           />
           <StepItem 
              icon={<CheckCircle2 className="w-5 h-5" />} 
              label="Connecting to Deriv WebSocket" 
              status={step === "CONNECTING" ? "loading" : ["EXTRACTING"].includes(step) ? "pending" : "done"} 
           />
           <StepItem 
              icon={<Zap className="w-5 h-5" />} 
              label="Authorizing account" 
              status={step === "AUTHORIZING" ? "loading" : ["EXTRACTING", "CONNECTING"].includes(step) ? "pending" : "done"} 
           />
           <StepItem 
              icon={<Database className="w-5 h-5" />} 
              label="Syncing with Command Center" 
              status={step === "SYNCING" ? "loading" : ["EXTRACTING", "CONNECTING", "AUTHORIZING"].includes(step) ? "pending" : "done"} 
           />
        </div>

        {step === "ERROR" && (
           <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                 <p className="text-sm font-bold text-red-500">Authentication Failed</p>
                 <p className="text-xs text-red-400/80 leading-relaxed">{errorMsg}</p>
                 <button 
                  onClick={() => router.push("/login")}
                  className="text-xs font-bold text-white mt-2 hover:underline"
                 >
                   Try Again
                 </button>
              </div>
           </div>
        )}

        <div className="pt-8 text-center">
           <p className="text-[10px] text-gray-700 font-bold uppercase tracking-[0.2em]">Derivex Authentication Protocol v1.4</p>
        </div>
      </div>
    </main>
  )
}

function StepItem({ icon, label, status }: { icon: React.ReactNode, label: string, status: "pending" | "loading" | "done" }) {
  return (
    <div className={cn(
       "flex items-center justify-between p-4 rounded-2xl border transition-all duration-500",
       status === "loading" ? "bg-white/5 border-teal-500/30 glow-teal" : 
       status === "done" ? "bg-teal-500/5 border-teal-500/10 opacity-50" : 
       "bg-black border-white/5 opacity-20"
    )}>
       <div className="flex items-center gap-3">
          <div className={cn(
             "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
             status === "done" ? "text-teal-400" : "text-gray-500"
          )}>
             {icon}
          </div>
          <span className={cn(
             "text-sm font-bold tracking-tight",
             status === "loading" ? "text-white" : "text-gray-400"
          )}>{label}</span>
       </div>
       <div className="flex items-center justify-center w-6 h-6">
          {status === "loading" && <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />}
          {status === "done" && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
       </div>
    </div>
  )
}
