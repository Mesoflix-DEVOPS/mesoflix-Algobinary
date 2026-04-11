import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://bgmkwtgwhmdyhuggjhwx.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbWt3dGd3aG1keWh1Z2dqaHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODkyOTksImV4cCI6MjA5MTQ2NTI5OX0.Z_nAJWluWPcRXnKh1hCsQFWNn58BQLqYZIVlLtQsyg4"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
    console.log("Seeding initial data...")
    
    // 1. Create a Guest User
    const { data: user, error: userErr } = await supabase.from("users").upsert({
        email: "guest@derivex.com",
        username: "GuestTrader",
        full_name: "Guest Trader",
        deriv_account_id: "CR1000000"
    }, { onConflict: 'email' }).select().single()

    if (userErr) {
        console.error("Error seeding user:", userErr)
        return
    }
    console.log("User seeded successfully.")

    // 2. Add Tools (ignore if already exists)
    const { data: tool, error: toolErr } = await supabase.from("trading_tools").upsert({
        name: "Digit Bias Tool",
        description: "Advanced digit analysis for binary options. Predicts the next digit based on historical bias and probability.",
        category: "Digits",
        difficulty_level: "Intermediate",
        win_rate: 64.5,
        total_users: 1240,
        average_return: 12.4
    }, { onConflict: 'name' }).select().single()

    if (toolErr && toolErr.code !== '42P10') {
        console.error("Error seeding tool:", toolErr)
    } else {
        console.log("Tool seeded successfully.")
    }

    // 3. Add mock activity linked to user
    const { error: actErr } = await supabase.from("activity_feed").insert([
        { user_id: user.id, activity_type: "TRADE", description: "User #429 matched Digit 7 on Volatility 100 (1s) index." },
        { user_id: user.id, activity_type: "SYSTEM", description: "Derivex Engine v2.4.0 deployed successfully." },
        { user_id: user.id, activity_type: "TRADE", description: "Digit Bias Tool win: +$45.20 for trader Derivex_Alpha" }
    ])

    if (actErr) console.error("Error seeding activity:", actErr)
    else console.log("Activity seeded successfully.")

    console.log("Seed complete.")
}

seed()
