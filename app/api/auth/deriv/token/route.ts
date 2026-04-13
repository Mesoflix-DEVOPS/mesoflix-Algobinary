import { NextResponse } from "next/server"
import { derivConfig } from "@/lib/deriv-config"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, codeVerifier } = body

    if (!code || !codeVerifier) {
      return NextResponse.json(
        { error: "Missing required parameters for token exchange." },
        { status: 400 }
      )
    }

    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('client_id', derivConfig.CLIENT_ID)
    params.append('code', code)
    params.append('code_verifier', codeVerifier)
    
    // In next.js backend we don't have window, but redirect URI must exactly match the exact one configured in Deriv App.
    // If the frontend passed redirect_uri, we can use it.
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    params.append('redirect_uri', `${origin}/auth/callback`)

    const response = await fetch(`${derivConfig.OAUTH_URL}/oauth2/token`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: params.toString()
    })

    if (!response.ok) {
       const errData = await response.json().catch(() => ({}))
       return NextResponse.json(
         { error: errData.error_description || "Token exchange failed with authorization server." },
         { status: response.status }
       )
    }

    const data = await response.json()
    
    return NextResponse.json({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        scope: data.scope,
        token_type: data.token_type
    })

  } catch (error: any) {
    console.error("Secure Token Exchange Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error during token exchange." },
      { status: 500 }
    )
  }
}
