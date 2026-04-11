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
                Automate binary trading globally
              </p>
              <p className="text-lg md:text-xl text-gray-400 mb-8">
                Choose a tool, not a strategy. Select from proven automated trading solutions and start earning instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
                <Button
                  className="bg-teal-500 hover:bg-teal-600 text-black font-bold px-8 py-6 text-lg"
                  onClick={() => router.push("/login")}
                >
                  Connect with Deriv
                </Button>
                <Button
                  variant="outline"
                  className="border-teal-500 text-teal-500 hover:bg-teal-900/20 px-8 py-6 text-lg"
                  onClick={() => router.push("/trading")}
                >
                  Explore Tools
                </Button>
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center text-white pointer-events-none">
              <div className="overflow-x-auto max-w-full px-4 pointer-events-auto">
                <div className="flex gap-6 whitespace-nowrap md:flex-wrap md:justify-center md:gap-8">
                  <Button
                    variant="link"
                    className="text-white hover:text-teal-400 pointer-events-auto flex-shrink-0"
                    onClick={() => router.push("/login")}
                  >
                    Login
                  </Button>
                  <Button
                    variant="link"
                    className="text-white hover:text-teal-400 pointer-events-auto flex-shrink-0"
                    onClick={() => router.push("/studio")}
                  >
                    Tools
                  </Button>
                  <Button
                    variant="link"
                    className="text-white hover:text-teal-400 pointer-events-auto flex-shrink-0"
                    onClick={() => router.push("/backtest")}
                  >
                    Performance
                  </Button>
                  <Button
                    variant="link"
                    className="text-white hover:text-teal-400 pointer-events-auto flex-shrink-0"
                    onClick={() => router.push("/trading")}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="link"
                    className="text-white hover:text-teal-400 pointer-events-auto flex-shrink-0"
                    onClick={() => router.push("/community")}
                  >
                    Leaderboard
                  </Button>
                  <Button
                    variant="link"
                    className="text-white hover:text-teal-400 pointer-events-auto flex-shrink-0"
                    onClick={() => router.push("/strategy")}
                  >
                    Activity
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
