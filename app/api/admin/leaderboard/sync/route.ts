import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        // Fetch all users to recalculate scores
        const { data: users, error: userError } = await supabase
            .from("users")
            .select("id, deriv_account_id, username, win_rate, total_trades, total_wins, total_losses, balance")
        
        if (userError || !users) {
            return NextResponse.json({ error: "Failed to fetch users for ranking" }, { status: 500 })
        }

        // Build scored + sorted leaderboard entries
        const scored = users
            .map(user => ({
                user_id: user.id,
                rank_score: (Number(user.win_rate) * 50) + (Number(user.total_trades) * 5),
                total_profit: Number(user.balance) || 0,
                total_trades: Number(user.total_trades) || 0,
                win_rate: Number(user.win_rate) || 0,
                weekly_profit: 0,
                monthly_profit: 0,
                updated_at: new Date().toISOString()
            }))
            .sort((a, b) => b.rank_score - a.rank_score)
            .map((entry, idx) => ({ ...entry, rank: idx + 1 }))

        if (scored.length === 0) {
            return NextResponse.json({ success: true, updatedCount: 0 })
        }

        // Delete all existing leaderboard rows, then reinsert with correct ranks
        const { error: deleteError } = await supabase.from("leaderboard").delete().neq("id", "00000000-0000-0000-0000-000000000000")

        if (deleteError) {
            console.error("[LeaderboardSync] Delete Error:", deleteError)
            // If delete fails, still try to insert (ignore existing state)
        }

        const { error: insertError } = await supabase.from("leaderboard").insert(scored)

        if (insertError) {
            console.error("[LeaderboardSync] Insert Error:", insertError)
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, updatedCount: scored.length })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
