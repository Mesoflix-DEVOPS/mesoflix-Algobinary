import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { validateNickname } from "@/lib/moderation"

export async function POST(req: NextRequest) {
    try {
        const { userId, nickname } = await req.json()

        if (!userId || !nickname) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Logic validation
        const validationError = validateNickname(nickname)
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 })
        }

        // 2. Uniqueness check
        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("nickname", nickname)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: "Nickname is already taken. Try another." }, { status: 400 })
        }

        // 3. Update User
        const { error } = await supabase
            .from("users")
            .update({ nickname })
            .eq("deriv_account_id", userId)

        if (error) {
            console.error("[NicknameAPI] Update error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, nickname })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
