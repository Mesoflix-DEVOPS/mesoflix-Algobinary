import { NextRequest, NextResponse } from "next/server"
import { derivConfig } from "@/lib/deriv-config"

/**
 * Deriv V2 Account List Proxy
 * 
 * Bypasses CORS by proxies the GET request to api.derivws.com from the server.
 * Requires a Bearer token in the Authorization header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    )
  }

  try {
    console.log("[API/Accounts] Fetching account list from Deriv...")

    const response = await fetch("https://api.derivws.com/trading/v1/options/accounts", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Deriv-App-ID": derivConfig.CLIENT_ID,
        "Content-Type": "application/json"
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[API/Accounts] Deriv Error:", data)
      return NextResponse.json(
        { error: data?.message || "Failed to fetch account list from Deriv." },
        { status: response.status }
      )
    }

    // Response structure contains 'data' array with account details and balances
    return NextResponse.json(data)

  } catch (error: any) {
    console.error("[API/Accounts] Proxy Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error during account sync." },
      { status: 500 }
    )
  }
}
