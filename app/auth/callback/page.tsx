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
import { derivConfig } from "@/lib/deriv-config"

type AuthStep = "EXTRACTING" | "CONNECTING" | "AUTHORIZING" | "SYNCING" | "FINALIZING" | "ERROR"

export default function AuthCallbackPage() {
  return (
    <React.Suspense fallback={
        <main className="min-h-screen bg-black flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </main>
    }>
      <AuthCallbackContent />
    </React.Suspense>
  )
}

function getDeviceInfo() {
    if (typeof window === "undefined") return { deviceName: "Server", deviceType: "Server" }
    
    const ua = navigator.userAgent;
    let deviceName = "Unknown Device";
    let deviceType = "Web";

    if (/android/i.test(ua)) {
        deviceName = "Android Device";
        deviceType = "Mobile";
    } else if (/iPad|iPhone|iPod/.test(ua)) {
        deviceName = "iOS Device";
        deviceType = "Mobile";
    } else if (/Windows/.test(ua)) {
        deviceName = "Windows PC";
        deviceType = "Desktop";
    } else if (/Macintosh/.test(ua)) {
        deviceName = "MacBook / iMac";
        deviceType = "Desktop";
    }

    // Add browser info
    if (/Chrome/.test(ua) && !/Edge|OPR/.test(ua)) deviceName += " (Chrome)";
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) deviceName += " (Safari)";
    else if (/Firefox/.test(ua)) deviceName += " (Firefox)";
    else if (/Edge/.test(ua)) deviceName += " (Edge)";

    return { deviceName, deviceType };
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = React.useState<AuthStep>("EXTRACTING")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const processingRef = React.useRef(false)

  React.useEffect(() => {
    if (processingRef.current) return
    processingRef.current = true

    async function processAuth() {
      try {
        // 1. EXTRACTING
        const code = searchParams.get("code")
        const stateParam = searchParams.get("state")
        const accountList: any[] = []
        let primaryToken = ""
        let refreshToken = ""
        let tokenExpiry = 0
        let authFlow: "legacy" | "new_v2" = "legacy"
        
        if (code && stateParam) {
          // --- V2 Flow: OAuth 2.0 PKCE Exchange ---
          authFlow = "new_v2"
          const storedState = sessionStorage.getItem('oauth_state') || 
            document.cookie.split('; ').find(row => row.startsWith('oauth_state='))?.split('=')[1]
          const codeVerifier = sessionStorage.getItem('pkce_code_verifier') ||
            document.cookie.split('; ').find(row => row.startsWith('pkce_code_verifier='))?.split('=')[1]

          if (!storedState || stateParam !== storedState) {
            throw new Error("State mismatch. Potential CSRF attack.")
          }
          if (!codeVerifier) {
            throw new Error("Missing PKCE code verifier.")
          }

          setStep("CONNECTING") // We are doing network call, move to connecting visually
          
          const response = await fetch('/api/auth/deriv/token', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ code, codeVerifier })
          })

          if (!response.ok) {
             const errData = await response.json()
             throw new Error(errData.error || "Token exchange failed.")
          }

          const data = await response.json()
          primaryToken = data.access_token
          refreshToken = data.refresh_token || ""
          tokenExpiry = data.expires_in || 0

          accountList.push({
             token: primaryToken,
             account: "FETCHING_V2", // Temporarily set, real account fetched during authorize() below
             currency: "USD" 
          })

          sessionStorage.removeItem('oauth_state')
          sessionStorage.removeItem('pkce_code_verifier')
          document.cookie = "oauth_state=; max-age=0; path=/";
          document.cookie = "pkce_code_verifier=; max-age=0; path=/";

        } else {
          // --- Legacy Flow Tracking ---
          let i = 1
          while (searchParams.get(`token${i}`)) {
            accountList.push({
              token: searchParams.get(`token${i}`),
              account: searchParams.get(`acct${i}`),
              currency: searchParams.get(`cur${i}`) || "USD"
            })
            i++
          }

          if (accountList.length === 0) {
            throw new Error("No authorization tokens found in redirect.")
          }
          primaryToken = accountList[0].token
        }

        await new Promise(r => setTimeout(r, 800)) // Animation buffer
        setStep(authFlow === "new_v2" ? "AUTHORIZING" : "CONNECTING") 

        // 2. CONNECTING
        try {
            await derivAPI.connect()
        } catch (connErr) {
            console.error("Connection failed, retrying...", connErr)
            await new Promise(r => setTimeout(r, 1000))
            await derivAPI.connect() // Simple retry
        }

        await new Promise(r => setTimeout(r, 800))
        setStep("AUTHORIZING")

        // 3. AUTHORIZING (Use the primary token)
        const authResponse = await derivAPI.authorize(primaryToken)
        if (authResponse.error) {
          throw new Error(authResponse.error.message)
        }

        // --- NEW: FETCH ACCOUNT LIST FOR V2 ---
        if (authFlow === "new_v2") {
            const listResponse = await derivAPI.getAccountList()
            if (listResponse.error) {
                console.error("Failed to fetch V2 account list:", listResponse.error)
            } else if (listResponse.account_list && listResponse.account_list.length > 0) {
                // Clear the temporary account placeholder
                accountList.length = 0;
                
                // Populate the unified array with every real/demo account found
                listResponse.account_list.forEach((acc: any) => {
                    accountList.push({
                        token: primaryToken, // Re-use global access token for V2 wrapper
                        account: acc.loginid,
                        currency: acc.currency || "USD",
                        isDemo: acc.is_virtual === 1
                    })
                })
            }
        }

        await new Promise(r => setTimeout(r, 800))
        setStep("SYNCING")

        // 4. SYNCING (Save to Supabase & Register Session)
        const userData = authResponse.authorize
        
        // Correct the acct if we are in V2 flow where it wasn't available in URL
        if (authFlow === "new_v2" && accountList.length === 1 && accountList[0].account === "FETCHING_V2") {
            accountList[0].account = userData.loginid
            accountList[0].currency = userData.currency || "USD"
        }

        const primaryAccount = accountList[0] || { account: userData.loginid }

        const expiryDate = tokenExpiry > 0 ? new Date(Date.now() + tokenExpiry * 1000).toISOString() : null

        const { error: dbError } = await supabase.from("users").upsert({
          email: userData.email,
          username: userData.fullname || userData.loginid,
          full_name: userData.fullname,
          deriv_account_id: userData.loginid,
          deriv_token: primaryToken,
          deriv_refresh_token: refreshToken || null,
          deriv_access_token_expires_at: expiryDate,
          balance: userData.balance || 0,
          auth_flow: authFlow // Save the specific flow used
        }, { onConflict: 'email' })

        if (dbError) {
           console.error("Supabase sync error:", dbError)
        }

        // --- NEW: SESSION REGISTRATION ---
        const { deviceName, deviceType } = getDeviceInfo()
        const { data: sessionData, error: sessionError } = await supabase
            .from("user_sessions")
            .insert({
                user_id: userData.loginid,
                device_name: deviceName,
                device_type: deviceType,
                ip_address: "Client Side Detection",
                location: "Localized"
            })
            .select("session_token")
            .single()

        if (sessionError) {
            console.error("Session registration error:", sessionError)
        }

        // Store session in localStorage and Cookies (for Middleware)
        localStorage.setItem("derivex_token", primaryToken)
        localStorage.setItem("derivex_acct", primaryAccount.account)
        localStorage.setItem("derivex_user", JSON.stringify(userData))
        localStorage.setItem("derivex_accounts", JSON.stringify(accountList))
        localStorage.setItem("derivex_auth_flow", authFlow)
        
        if (sessionData) {
            localStorage.setItem("derivex_session_id", sessionData.session_token)
        }
        
        // Set cookie manually for Next.js Middleware
        document.cookie = `derivex_token=${primaryToken}; path=/; max-age=604800; samesite=lax`;

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
