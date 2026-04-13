"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  QrCode,
  Download,
  Copy,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function AdminLoginPage() {
  const router = useRouter()
  const [mode, setMode] = React.useState<"LOGIN" | "REGISTER">("LOGIN")
  const [step, setStep] = React.useState<"CREDENTIALS" | "2FA" | "RECOVERY">("CREDENTIALS")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Registration data
  const [regData, setRegData] = React.useState<any>(null)
  const [confirmedRecovery, setConfirmedRecovery] = React.useState(false)

  // Form states
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [twoFactorCode, setTwoFactorCode] = React.useState("")
  const [recoveryCode, setRecoveryCode] = React.useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, twoFactorCode, recoveryCode })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.requires2FA) {
            setStep("2FA")
        } else {
            router.push("/dx/ms/staff/main/admin/dashboard")
        }
      } else {
        setError(data.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        setRegData(data)
        setStep("2FA")
      } else {
        setError(data.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadRecovery = () => {
    const content = `MESOFLIX DERIVEX ADMIN RECOVERY CODES\nEmail: ${email}\nCodes: ${regData.recoveryCodes.join(", ")}\nDate: ${new Date().toLocaleString()}`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `derivex-admin-recovery-${email}.txt`
    a.click()
    setConfirmedRecovery(true)
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4 md:p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-teal-500/20">
                <ShieldCheck className="w-10 h-10 text-white" />
            </div>
        </div>

        <Card className="bg-zinc-950/50 border-white/5 backdrop-blur-3xl shadow-3xl overflow-hidden rounded-3xl">
          <CardHeader className="text-center space-y-1 py-8 border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-white">
                {mode === "LOGIN" ? "Admin Access" : "Staff Onboarding"}
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium italic">
                {mode === "LOGIN" 
                  ? "Institutional dashboard authentication" 
                  : "Register master administrative credentials"}
            </CardDescription>
          </CardHeader>

          <CardContent className="py-8">
            {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm font-bold animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {step === "CREDENTIALS" && (
                <form onSubmit={mode === "LOGIN" ? handleLogin : handleRegister} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Work Email</Label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-teal-500 transition-colors" />
                            <Input 
                                type="email"
                                placeholder="name@derivex.local"
                                className="bg-white/5 border-white/10 text-white h-12 pl-12 rounded-xl focus:ring-teal-500/20 transition-all font-bold"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password</Label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-teal-500 transition-colors" />
                            <Input 
                                type="password"
                                placeholder="••••••••••••"
                                className="bg-white/5 border-white/10 text-white h-12 pl-12 rounded-xl focus:ring-teal-500/20 transition-all font-bold"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button className="w-full h-12 bg-white text-black hover:bg-teal-500 hover:text-white transition-all rounded-xl font-black uppercase tracking-widest group border-none">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                                {mode === "LOGIN" ? "Authenticate" : "Initialize Admin"}
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                </form>
            )}

            {step === "2FA" && (
                <div className="space-y-6">
                    {mode === "REGISTER" && (
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-white rounded-2xl shadow-inner mb-2 border-4 border-teal-500/20">
                                {/* Use Google Charts for QR generation based on TOTP standard format */}
                                <img 
                                    src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(`otpauth://totp/Derivex:${email}?secret=${regData.twoFactorSecret}&issuer=Mesoflix`)}`} 
                                    alt="QR Code"
                                    className="w-40 h-40"
                                />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase italic">Scan with Authenticator</h3>
                                <p className="text-[11px] text-gray-500 max-w-[200px] mt-2 leading-relaxed">
                                    Use Google Authenticator or Authy to scan this code. Alternatively, enter the key manually:
                                </p>
                                <div className="mt-3 flex items-center justify-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <span className="text-[10px] font-mono font-bold text-teal-400 tracking-wider">
                                        {regData.twoFactorSecret}
                                    </span>
                                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-white/10" onClick={() => navigator.clipboard.writeText(regData.twoFactorSecret)}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center block">Verification Token</Label>
                        <div className="relative group">
                            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-teal-500 transition-colors" />
                            <Input 
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                className="bg-white/5 border-white/10 text-white h-12 pl-12 rounded-xl text-center text-lg tracking-[0.5em] font-black focus:ring-teal-500/20"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                required
                            />
                        </div>

                        {mode === "REGISTER" && !confirmedRecovery ? (
                            <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-3">
                                <div className="flex items-center gap-2 text-teal-500 text-[10px] font-black uppercase">
                                    <Download className="w-3 h-3" />
                                    Recovery Logic Required
                                </div>
                                <p className="text-[9px] text-gray-500 italic">You must download and confirm these recovery codes to proceed.</p>
                                <Button 
                                    type="button" 
                                    onClick={handleDownloadRecovery}
                                    className="w-full bg-teal-600 hover:bg-teal-500 text-[10px] font-black uppercase h-8 rounded-lg"
                                >
                                    Download Codes
                                </Button>
                            </div>
                        ) : (
                            <Button className="w-full h-12 bg-white text-black hover:bg-teal-500 hover:text-white transition-all rounded-xl font-black uppercase tracking-widest group border-none">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Access"}
                            </Button>
                        )}
                    </form>

                    <Button 
                        variant="ghost" 
                        onClick={() => setStep("RECOVERY")}
                        className="w-full text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest"
                    >
                        Lost authenticator? Use recovery code
                    </Button>
                </div>
            )}

            {step === "RECOVERY" && (
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="text-center space-y-2">
                        <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[9px] uppercase font-black px-2 h-5">Identity Recovery</Badge>
                        <h3 className="text-sm font-black text-white uppercase italic">Enter Recovery Code</h3>
                        <p className="text-[10px] text-gray-500 leading-relaxed px-4">
                            Input one of the single-use 8-character codes you downloaded during setup.
                        </p>
                    </div>

                    <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-teal-500 transition-colors" />
                        <Input 
                            type="text"
                            placeholder="XXXXXXXX"
                            className="bg-white/5 border-white/10 text-white h-12 pl-12 rounded-xl text-center text-lg font-mono font-black tracking-widest focus:ring-teal-500/20 transition-all uppercase"
                            value={recoveryCode}
                            onChange={(e) => setRecoveryCode(e.target.value)}
                            required
                        />
                    </div>

                    <Button className="w-full h-12 bg-white text-black hover:bg-teal-500 hover:text-white transition-all rounded-xl font-black uppercase tracking-widest group border-none">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Recover Account"}
                    </Button>

                    <Button 
                        variant="ghost" 
                        onClick={() => setStep("2FA")}
                        className="w-full text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest"
                    >
                        Back to 2FA
                    </Button>
                </form>
            )}
          </CardContent>

          <CardFooter className="py-6 border-t border-white/5 bg-black/40 flex justify-center">
            <button 
                onClick={() => {
                    setMode(prev => prev === "LOGIN" ? "REGISTER" : "LOGIN")
                    setStep("CREDENTIALS")
                    setError(null)
                }}
                className="text-[10px] font-black text-gray-500 hover:text-teal-400 uppercase tracking-widest transition-colors flex items-center gap-2"
            >
                {mode === "LOGIN" ? "Need admin privileges? Register" : "Already have access? Sign In"}
            </button>
          </CardFooter>
        </Card>

        <p className="mt-8 text-center text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] opacity-40">
            Institutional Control Center • Secure Transmission 256-bit
        </p>
      </div>
    </main>
  )
}
