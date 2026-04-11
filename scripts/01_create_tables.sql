-- Create users table
CREATE TABLE IF NOT EXISTS users (
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
);

-- Create trading tools table
CREATE TABLE IF NOT EXISTS trading_tools (
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
);

-- Create user_tools junction table (many-to-many)
CREATE TABLE IF NOT EXISTS user_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES trading_tools(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tool_id)
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES trading_tools(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  entry_price DECIMAL(15, 6) NOT NULL,
  exit_price DECIMAL(15, 6),
  profit_loss DECIMAL(15, 2),
  result VARCHAR(20), -- 'WIN', 'LOSS', 'PENDING'
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'CLOSED', 'CANCELLED'
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP,
  deriv_trade_id VARCHAR(255)
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER,
  total_profit DECIMAL(15, 2),
  total_trades INTEGER,
  win_rate DECIMAL(5, 2),
  weekly_profit DECIMAL(15, 2),
  monthly_profit DECIMAL(15, 2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activity feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100), -- 'trade_closed', 'tool_activated', 'new_user', 'milestone'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tool statistics table
CREATE TABLE IF NOT EXISTS tool_stats (
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
);

-- Create trading news table
CREATE TABLE IF NOT EXISTS trading_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT,
  image_url VARCHAR(500),
  source VARCHAR(255),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_user_tools_user_id ON user_tools(user_id);
CREATE INDEX idx_user_tools_tool_id ON user_tools(tool_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_tool_id ON trades(tool_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX idx_tool_stats_tool_id ON tool_stats(tool_id);
CREATE INDEX idx_trading_news_category ON trading_news(category);
