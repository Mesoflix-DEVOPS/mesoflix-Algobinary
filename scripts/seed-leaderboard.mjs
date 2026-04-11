import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://bgmkwtgwhmdyhuggjhwx.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbWt3dGd3aG1keWh1Z2dqaHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODkyOTksImV4cCI6MjA5MTQ2NTI5OX0.Z_nAJWluWPcRXnKh1hCsQFWNn58BQLqYZIVlLtQsyg4"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
    console.log("Seeding leaderboard data...")
    
    // Get the guest user
    const { data: user } = await supabase.from("users").select("id").eq("username", "GuestTrader").single()
    if (!user) {
        console.error("Guest user not found. Run seed-data first.")
        return
    }

    // Add some mock leaderboard entries
    const entries = [
        { user_id: user.id, rank: 1, total_profit: 4250.20, total_trades: 450, win_rate: 68.5, weekly_profit: 420.50, monthly_profit: 1250.00 },
        { user_id: user.id, rank: 2, total_profit: 3840.15, total_trades: 320, win_rate: 72.1, weekly_profit: 310.20, monthly_profit: 980.40 },
        { user_id: user.id, rank: 3, total_profit: 2950.80, total_trades: 280, win_rate: 61.4, weekly_profit: 250.10, monthly_profit: 820.60 }
    ]

    const { error } = await supabase.from("leaderboard").upsert(entries, { onConflict: 'rank' })

    if (error) console.error("Error seeding leaderboard:", error)
    else console.log("Leaderboard seeded successfully.")
}

seed()
