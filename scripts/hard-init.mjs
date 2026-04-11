import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://bgmkwtgwhmdyhuggjhwx.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbWt3dGd3aG1keWh1Z2dqaHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODkyOTksImV4cCI6MjA5MTQ2NTI5OX0.Z_nAJWluWPcRXnKh1hCsQFWNn58BQLqYZIVlLtQsyg4"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const queries = [
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
    `CREATE TABLE IF NOT EXISTS user_tools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tool_id UUID NOT NULL REFERENCES trading_tools(id) ON DELETE CASCADE,
      active BOOLEAN DEFAULT true,
      settings JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, tool_id)
    )`,
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
    `CREATE TABLE IF NOT EXISTS activity_feed (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type VARCHAR(100),
      description TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
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
    `CREATE TABLE IF NOT EXISTS trading_news (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      content TEXT,
      image_url VARCHAR(500),
      source VARCHAR(255),
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
]

async function init() {
    console.log("Starting database initialization...")
    for (const query of queries) {
        process.stdout.write("Creating table... ")
        const { error } = await supabase.rpc("exec_sql", { sql: query })
        if (error) {
            console.error("FAILED", error)
        } else {
            console.log("SUCCESS")
        }
    }
    console.log("All operations complete.")
}

init()
