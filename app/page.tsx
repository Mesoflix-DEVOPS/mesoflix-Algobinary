"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

const MainScene = dynamic(() => import("@/components/main-scene").then(mod => mod.MainScene), {
  ssr: false,
})

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const acct = localStorage.getItem("derivex_acct")
    if (acct) {
      setIsLoggedIn(true)
    }

    // Simulate loading assets
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black">
          <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-teal-500 animate-spin mb-4"></div>
          <h1 className="text-2xl font-bold text-white">
            Loading Derivex<span className="animate-pulse">...</span>
          </h1>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 z-10">
            <MainScene />
          </div>

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 pointer-events-none">
            <div className="max-w-3xl text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                <span className="text-teal-500">Deriv</span>ex
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-6">
                Premium Market Intelligence for Synthetic Indices
              </p>
              <p className="text-lg md:text-xl text-gray-400 mb-8 font-medium">
                High-fidelity telemetry, real-time digit distribution, and institutional-grade analytics for global options traders.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
                {isLoggedIn ? (
                  <Button
                    className="bg-teal-500 hover:bg-teal-600 text-black font-black px-10 py-7 text-lg rounded-2xl shadow-[0_0_30px_rgba(20,184,166,0.4)] transition-all hover:scale-105 uppercase tracking-widest"
                    onClick={() => router.push("/dashboard")}
                  >
                    Enter Command Center
                  </Button>
                ) : (
                  <>
                    <Button
                      className="bg-teal-500 hover:bg-teal-600 text-black font-black px-10 py-7 text-lg rounded-2xl shadow-[0_0_30px_rgba(20,184,166,0.4)] transition-all hover:scale-105 uppercase tracking-widest"
                      onClick={() => router.push("/login")}
                    >
                      Authenticate Now
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/10 text-white hover:bg-white/5 px-10 py-7 text-lg rounded-2xl transition-all uppercase tracking-widest font-bold backdrop-blur-sm"
                      onClick={() => router.push("/login")}
                    >
                      View Live Markets
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center text-white pointer-events-none">
              <div className="overflow-x-auto max-w-full px-4 pointer-events-auto">
                <div className="flex gap-6 whitespace-nowrap md:flex-wrap md:justify-center md:gap-8">
                  <Button
                    variant="link"
                    className="text-gray-400 hover:text-teal-400 pointer-events-auto flex-shrink-0 uppercase text-[10px] font-black tracking-[0.2em]"
                    onClick={() => router.push("/login")}
                  >
                    Security
                  </Button>
                  <Button
                    variant="link"
                    className="text-gray-400 hover:text-teal-400 pointer-events-auto flex-shrink-0 uppercase text-[10px] font-black tracking-[0.2em]"
                    onClick={() => router.push("/trading")}
                  >
                    Markets
                  </Button>
                  <Button
                    variant="link"
                    className="text-gray-400 hover:text-teal-400 pointer-events-auto flex-shrink-0 uppercase text-[10px] font-black tracking-[0.2em]"
                    onClick={() => router.push("/dashboard")}
                  >
                    Telemetry
                  </Button>
                  <Button
                    variant="link"
                    className="text-gray-400 hover:text-teal-400 pointer-events-auto flex-shrink-0 uppercase text-[10px] font-black tracking-[0.2em]"
                    onClick={() => router.push("/community")}
                  >
                    Community
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </>
      )}
    </main>
  )
}
