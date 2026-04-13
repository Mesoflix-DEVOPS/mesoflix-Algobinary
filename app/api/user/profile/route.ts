import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, username, avatarUrl } = body

        if (!userId || !username) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { error } = await supabase
            .from("users")
            .update({
                username: username,
                full_name: username, // Sync full_name with username for simplicity
                avatar_url: avatarUrl,
                profile_complete: true
            })
            .eq("deriv_account_id", userId)

        if (error) {
            console.error("[ProfileUpdate] Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
    }
}
