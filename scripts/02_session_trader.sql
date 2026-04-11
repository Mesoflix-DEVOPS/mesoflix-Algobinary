-- Add session trader specific tables and updates

-- Ensure trading_tools has a unique name constraint for upsert
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trading_tools_name_key') THEN
        ALTER TABLE trading_tools ADD CONSTRAINT trading_tools_name_key UNIQUE (name);
    END IF;
END $$;

-- Update trades table with additional metadata
ALTER TABLE trades ADD COLUMN IF NOT EXISTS contract_id VARCHAR(255);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_type VARCHAR(50); -- 'UP', 'DOWN'
ALTER TABLE trades ADD COLUMN IF NOT EXISTS stake DECIMAL(15, 2);

-- Create bot_sessions table
CREATE TABLE IF NOT EXISTS bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES trading_tools(id) ON DELETE CASCADE,
  total_trades INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_profit DECIMAL(15, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'COMPLETED', 'STOPPED'
  settings JSONB,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- Create bot_logs table
CREATE TABLE IF NOT EXISTS bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES bot_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES trading_tools(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'START', 'BUY_ORDER', 'TRADE_WON', 'TRADE_LOST', 'COOLDOWN', 'STOP'
  details TEXT,
  level VARCHAR(20) DEFAULT 'INFO', -- 'INFO', 'SUCCESS', 'WARNING', 'ERROR'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Register Session Trader in trading_tools
INSERT INTO trading_tools (name, description, category, difficulty_level, win_rate, total_users, average_return)
VALUES (
    'Session Trader', 
    'Automated 2-minute trading bot with real-time P/L tracking and institutional risk management.', 
    'Automated', 
    'Advanced', 
    68.2, 
    0, 
    15.5
) ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    difficulty_level = EXCLUDED.difficulty_level;
