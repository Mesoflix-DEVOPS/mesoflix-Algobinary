-- Add a column to the users table to indicate which auth flow the user uses
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_flow VARCHAR(20) DEFAULT 'legacy';

-- Store the OAuth state token used for CSRF protection and post-login redirect
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_state VARCHAR(255);

-- Tokens for refresh lifecycle
ALTER TABLE users ADD COLUMN IF NOT EXISTS deriv_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deriv_access_token_expires_at TIMESTAMP WITH TIME ZONE;

-- V2 users won't have a real email/name from OIDC — flag their profile as incomplete
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT TRUE;

-- Indexes for fast look-ups
CREATE INDEX IF NOT EXISTS idx_users_auth_flow ON users (auth_flow);
CREATE INDEX IF NOT EXISTS idx_users_oauth_state ON users (oauth_state);
CREATE INDEX IF NOT EXISTS idx_users_deriv_account_id ON users (deriv_account_id);
