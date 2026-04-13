import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        // Fetch all users to recalculate scores
        const { data: users, error: userError } = await supabase
            .from("users")
            .select("deriv_account_id, win_rate, total_trades, balance")
        
        if (userError || !users) {
            return NextResponse.json({ error: "Failed to fetch users for ranking" }, { status: 500 })
        }

        const updates = users.map(user => {
            // Formula for rank_score that hides exact balance
            // Score = (win_rate * 50) + (total_trades * 2) + (pseudo_profit)
            // We use a comparative score rather than the actual balance
            const score = (Number(user.win_rate) * 50) + (Number(user.total_trades) * 5)
            
            return {
                user_id: user.deriv_account_id,
                rank_score: score,
                win_rate: user.win_rate,
                total_trades: user.total_trades,
                updated_at: new Date().toISOString()
            }
        })

        // Upsert into leaderboard
        const { error: upsertError } = await supabase
            .from("leaderboard")
            .upsert(updates, { onConflict: 'user_id' })

        if (upsertError) {
            console.error("[LeaderboardSync] Upsert Error:", upsertError)
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, updatedCount: updates.length })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
