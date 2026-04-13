"use client"

import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Lock, Loader2 } from "lucide-react"
import { useState } from "react"

const MainScene = dynamic(() => import("@/components/main-scene").then(mod => mod.MainScene), {
  ssr: false,
})

export default function LoginPage() {
  const router = useRouter()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleLogin = async () => {
    setIsAuthenticating(true)
    
    try {
      // 1. Generate a random code_verifier
      const array = crypto.getRandomValues(new Uint8Array(64))
      const codeVerifier = Array.from(array)
        .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
        .join('')
        
      // 2. Derive the code_challenge
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
        
      // 3. Generate a random state for CSRF protection
      const state = crypto.getRandomValues(new Uint8Array(16))
        .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')
        
      // 4. Store code_verifier and state before redirecting
      sessionStorage.setItem('pkce_code_verifier', codeVerifier)
      sessionStorage.setItem('oauth_state', state)
      
      // Fallback via cookies just in case the browser clears session storage across different origin redirects
      document.cookie = `oauth_state=${state}; path=/; max-age=3600; SameSite=Lax`
      document.cookie = `pkce_code_verifier=${codeVerifier}; path=/; max-age=3600; SameSite=Lax`

      const appId = "32yJRED9hXmlYiayhK1VZ"
      const legacyAppId = "114779"
      const redirectUri = `${window.location.origin}/auth/callback`
      
      const authUrl = new URL('https://oauth.deriv.com/oauth2/authorize')
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('client_id', appId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('scope', 'read trade') // Adjust scopes if needing account_manage
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')
      authUrl.searchParams.set('app_id', legacyAppId) // This tells Deriv where to route legacy token users
      
      window.location.href = authUrl.toString()
    } catch (error) {
      console.error("Failed to initiate OAuth flow:", error)
      setIsAuthenticating(false)
    }
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-10">
        <MainScene />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 pointer-events-none">
        <div className="max-w-2xl text-center mb-8">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-lg bg-teal-500/10 border border-teal-500/30">
            <Lock className="h-8 w-8 text-teal-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Derivex <span className="text-teal-500">Secure Access</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Connect your Deriv account to deploy high-performance automated tools and manage your trading cockpit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
            <Button
              disabled={isAuthenticating}
              className="bg-teal-500 hover:bg-teal-600 text-black font-bold px-8 py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all hover:scale-105"
              onClick={handleLogin}
            >
              {isAuthenticating ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                </>
              ) : (
                "Connect with Deriv"
              )}
            </Button>
            <Button
                variant="outline"
                className="border-white/10 text-gray-400 hover:bg-white/5 px-8 py-6 text-lg rounded-xl"
                onClick={() => router.push("/")}
                disabled={isAuthenticating}
            >
                Back to Home
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
