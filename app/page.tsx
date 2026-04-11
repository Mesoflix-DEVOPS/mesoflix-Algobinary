"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MainScene } from "@/components/main-scene"

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
            Loading AlgoSensei<span className="animate-pulse">...</span>
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
                <span className="text-teal-500">Algo</span>Sensei
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                Build, backtest, and deploy algorithmic trading strategies with AI-powered simplicity
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
                <Button
                  className="bg-teal-500 hover:bg-teal-600 text-black font-bold px-8 py-6 text-lg"
                  onClick={() => router.push("/login")}
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  className="border-teal-500 text-teal-500 hover:bg-teal-900/20 px-8 py-6 text-lg"
                  onClick={() => router.push("/trading")}
                >
                  Try Trading Dashboard
                </Button>
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 text-white">
              <Button
                variant="link"
                className="text-white hover:text-teal-400 pointer-events-auto"
                onClick={() => router.push("/login")}
              >
                Login
              </Button>
              <Button
                variant="link"
                className="text-white hover:text-teal-400 pointer-events-auto"
                onClick={() => router.push("/strategy")}
              >
                Strategy
              </Button>
              <Button
                variant="link"
                className="text-white hover:text-teal-400 pointer-events-auto"
                onClick={() => router.push("/backtest")}
              >
                Backtest
              </Button>
              <Button
                variant="link"
                className="text-white hover:text-teal-400 pointer-events-auto"
                onClick={() => router.push("/trading")}
              >
                Trading
              </Button>
              <Button
                variant="link"
                className="text-white hover:text-teal-400 pointer-events-auto"
                onClick={() => router.push("/community")}
              >
                Community
              </Button>
              <Button
                variant="link"
                className="text-white hover:text-teal-400 pointer-events-auto"
                onClick={() => router.push("/studio")}
              >
                Studio
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
