"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MainScene } from "@/components/main-scene"
import { Lock } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

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
            Authentication <span className="text-teal-500">Coming Soon</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Secure login and account management for AlgoSensei traders. Coming soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-black font-bold px-8 py-6 text-lg"
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
