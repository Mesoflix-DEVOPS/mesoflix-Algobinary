import { NextResponse } from "next/server"
import { derivConfig } from "@/lib/deriv-config"

/**
 * Deriv V2 OTP Proxy
 * 
 * Bypasses CORS by making the request from the server side.
 * Aligning with schema: POST /trading/v1/options/accounts/{accountId}/otp
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { accountId, token } = body

    if (!accountId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters: accountId and token." },
        { status: 400 }
      )
    }

    console.log(`[API/OTP] Requesting OTP for account: ${accountId}`)

    const response = await fetch(`https://api.derivws.com/trading/v1/options/accounts/${accountId}/otp`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Deriv-App-ID': derivConfig.CLIENT_ID,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      console.error("[API/OTP] Deriv Error:", errData)
      return NextResponse.json(
        { error: errData.message || "Failed to obtain OTP from Deriv." },
        { status: response.status }
      )
    }

    const data = await response.json()
    // The response schema from Deriv: { "ws_url": "wss://.../?otp=..." }
    return NextResponse.json(data)

  } catch (error: any) {
    console.error("[API/OTP] Proxy Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error during OTP swap." },
      { status: 500 }
    )
  }
}
