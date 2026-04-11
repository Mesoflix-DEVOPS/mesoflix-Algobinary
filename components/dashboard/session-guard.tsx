"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  React.useEffect(() => {
    const checkSession = async () => {
      const sessionToken = localStorage.getItem("derivex_session_id")
      
      if (!sessionToken) return

      try {
        const { data, error } = await supabase
          .from("user_sessions")
          .select("is_active")
          .eq("session_token", sessionToken)
          .single()

        if (error || !data || !data.is_active) {
          console.warn("Session revoked or expired. Logging out...")
          handleLogout()
        }
      } catch (err) {
        console.error("Session verification failed:", err)
      }
    }

    const handleLogout = () => {
      localStorage.clear()
      document.cookie = "derivex_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/login"
    }

    // Initial check
    checkSession()

    // Periodic heartbeat (every 30 seconds)
    const interval = setInterval(checkSession, 30000)
    
    return () => clearInterval(interval)
  }, [router])

  return <>{children}</>
}
