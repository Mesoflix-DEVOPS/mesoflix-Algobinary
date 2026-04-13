import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function sendWelcomeBroadcast() {
  const message = {
    user_id: "SYSTEM",
    nickname: "⚡ Derivex System",
    text: "🎉 Welcome to Derivex — the institutional-grade algorithmic trading platform by Mesoflix! The Community Terminal, real-time chat, leaderboards, and all trading bots are now live. Start your first session, set your nickname, and join the global trading discourse. Happy trading! 🚀",
    type: "system"
  }

  console.log("Sending welcome broadcast to community_messages...")

  const { data, error } = await supabase.from("community_messages").insert(message).select()

  if (error) {
    console.error("Error sending broadcast:", error)
  } else {
    console.log("Welcome broadcast sent successfully!")
    console.log("Message ID:", data?.[0]?.id)
  }
}

sendWelcomeBroadcast()
