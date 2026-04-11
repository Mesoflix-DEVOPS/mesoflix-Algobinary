import type React from "react"
import "@/app/globals.css"

export const metadata = {
  title: "Derivex - Institutional Automated Trading",
  description:
    "Deploy, backtest, and master algorithmic trading with institutional-grade simplicity. Powered by Deriv.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black">
        {children}
      </body>
    </html>
  )
}
