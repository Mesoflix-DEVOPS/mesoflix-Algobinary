import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const { userId, reason, durationMinutes = 10 } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
        }

        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes)

        const { error } = await supabase
            .from("community_bans")
            .upsert({
                user_id: userId,
                reason: reason || "System-wide policy violation.",
                expires_at: expiresAt.toISOString()
            }, { onConflict: 'user_id' })

        if (error) throw error

        // Also block their main account status if it's severe (Optional, based on requirement)
        // For now, we only restrict community access.

        return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
