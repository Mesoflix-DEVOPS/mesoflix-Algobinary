import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database initialization - create tables if they don't exist
export async function initializeDatabase() {
  try {
    // Check if users table exists by attempting a query
    const { error } = await supabase.from("users").select("count", { count: "exact" }).limit(0)

    if (error && error.code === "PGRST116") {
      // Table doesn't exist, create it
      console.log("[v0] Creating database tables...")
      await createTables()
    }
  } catch (err) {
    console.error("[v0] Database initialization error:", err)
  }
}

async function createTables() {
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      avatar_url VARCHAR(500),
      deriv_account_id VARCHAR(255),
      deriv_token VARCHAR(500),
      balance DECIMAL(15, 2) DEFAULT 0,
      total_trades INTEGER DEFAULT 0,
      total_wins INTEGER DEFAULT 0,
      total_losses INTEGER DEFAULT 0,
      win_rate DECIMAL(5, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Trading tools table
    `CREATE TABLE IF NOT EXISTS trading_tools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      image_url VARCHAR(500),
      category VARCHAR(100),
      difficulty_level VARCHAR(50),
      win_rate DECIMAL(5, 2),
      total_users INTEGER DEFAULT 0,
      total_trades INTEGER DEFAULT 0,
      average_return DECIMAL(10, 2),
      features JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // User tools junction table
    `CREATE TABLE IF NOT EXISTS user_tools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tool_id UUID NOT NULL REFERENCES trading_tools(id) ON DELETE CASCADE,
      active BOOLEAN DEFAULT true,
      settings JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, tool_id)
    )`,

    // Trades table
    `CREATE TABLE IF NOT EXISTS trades (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tool_id UUID NOT NULL REFERENCES trading_tools(id) ON DELETE CASCADE,
      symbol VARCHAR(50) NOT NULL,
      entry_price DECIMAL(15, 6) NOT NULL,
      exit_price DECIMAL(15, 6),
      profit_loss DECIMAL(15, 2),
      result VARCHAR(20),
      status VARCHAR(20) DEFAULT 'PENDING',
      entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      exit_time TIMESTAMP,
      deriv_trade_id VARCHAR(255)
    )`,

    // Leaderboard table
    `CREATE TABLE IF NOT EXISTS leaderboard (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rank INTEGER,
      total_profit DECIMAL(15, 2),
      total_trades INTEGER,
      win_rate DECIMAL(5, 2),
      weekly_profit DECIMAL(15, 2),
      monthly_profit DECIMAL(15, 2),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Activity feed table
    `CREATE TABLE IF NOT EXISTS activity_feed (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type VARCHAR(100),
      description TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Tool statistics table
    `CREATE TABLE IF NOT EXISTS tool_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tool_id UUID NOT NULL REFERENCES trading_tools(id) ON DELETE CASCADE,
      date DATE DEFAULT CURRENT_DATE,
      total_trades INTEGER DEFAULT 0,
      winning_trades INTEGER DEFAULT 0,
      losing_trades INTEGER DEFAULT 0,
      average_win DECIMAL(10, 2),
      average_loss DECIMAL(10, 2),
      daily_roi DECIMAL(10, 2),
      UNIQUE(tool_id, date)
    )`,

    // Available avatars table
    `CREATE TABLE IF NOT EXISTS available_avatars (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      url TEXT UNIQUE NOT NULL,
      name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // User sessions table for multi-device tracking
    `CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
      session_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      device_name VARCHAR(255),
      device_type VARCHAR(50),
      ip_address VARCHAR(45),
      location VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Trading news table
    `CREATE TABLE IF NOT EXISTS trading_news (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      content TEXT,
      image_url VARCHAR(500),
      source VARCHAR(255),
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ]

  for (const query of queries) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: query })
      if (error) console.error("[v0] Error creating table:", error)
    } catch (err) {
      console.error("[v0] Table creation error:", err)
    }
  }

  // Seed avatars if table is empty
  await seedAvatars()
}

async function seedAvatars() {
  try {
    const { count } = await supabase.from("available_avatars").select("id", { count: "exact", head: true })
    
    if (count === 0) {
      console.log("[v0] Seeding Avatar Library...")
      const avatars = []
      
      // Generate 50 unique DiceBear avatars (Pixel Art & Bottts)
      for (let i = 1; i <= 25; i++) {
        avatars.push({
          url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=Avatar${i}`,
          name: `Pixel Unit ${i}`
        })
      }
      for (let i = 1; i <= 25; i++) {
        avatars.push({
          url: `https://api.dicebear.com/7.x/bottts/svg?seed=Bot${i}`,
          name: `Automata ${i}`
        })
      }

      const { error } = await supabase.from("available_avatars").insert(avatars)
      if (error) console.error("[v0] Seeding error:", error)
    }
  } catch (err) {
    console.error("[v0] Avatar seeding failed:", err)
  }
}
