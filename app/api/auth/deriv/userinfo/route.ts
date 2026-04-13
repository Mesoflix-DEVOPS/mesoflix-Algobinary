import { NextRequest, NextResponse } from "next/server"

// Server-side proxy for auth.deriv.com/userinfo — avoids CORS from the browser
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
  }

  try {
    const res = await fetch("https://auth.deriv.com/userinfo", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      }
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data?.error_description || "Userinfo fetch failed" }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error("[/api/auth/deriv/userinfo] Error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
