/*
  # Refresh Token Support
  
  ## Overview
  Implements secure refresh token functionality for extended session management.
  
  ## Changes
  
  ### 1. Create refresh_tokens Table
  - Stores hashed refresh tokens
  - Tracks token expiration
  - Supports token revocation
  - Links to user accounts
  
  ### 2. Security Features
  - Tokens are hashed before storage (bcrypt)
  - 7-day expiration by default
  - Revocation support for logout
  - User-scoped policies via RLS
  
  ### 3. RLS Policies
  - Users can only view/revoke their own tokens
  - System can insert tokens via service role
  
  ## Usage
  - Generate refresh token on login
  - Exchange refresh token for new access token
  - Revoke token on logout
  - Auto-cleanup expired tokens
*/

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  
  CONSTRAINT unique_active_token UNIQUE ("userId", "tokenHash")
);

-- Enable RLS
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_userid ON refresh_tokens("userId");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens("expiresAt") WHERE revoked = false;

-- RLS Policy: Users can view own tokens
DROP POLICY IF EXISTS "refresh_tokens_select_policy" ON refresh_tokens;
CREATE POLICY "refresh_tokens_select_policy" ON refresh_tokens
  FOR SELECT
  USING ("userId" = current_setting('app.current_user_id', true)::INTEGER);

-- RLS Policy: Users can revoke own tokens
DROP POLICY IF EXISTS "refresh_tokens_update_policy" ON refresh_tokens;
CREATE POLICY "refresh_tokens_update_policy" ON refresh_tokens
  FOR UPDATE
  USING ("userId" = current_setting('app.current_user_id', true)::INTEGER)
  WITH CHECK ("userId" = current_setting('app.current_user_id', true)::INTEGER);

-- RLS Policy: System can insert tokens (use service role)
DROP POLICY IF EXISTS "refresh_tokens_insert_policy" ON refresh_tokens;
CREATE POLICY "refresh_tokens_insert_policy" ON refresh_tokens
  FOR INSERT
  WITH CHECK (true); -- Handled by application logic

-- Function to cleanup expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM refresh_tokens
  WHERE "expiresAt" < now()
  OR (revoked = true AND "revokedAt" < now() - INTERVAL '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE refresh_tokens IS 'Stores hashed refresh tokens for extended session management';
COMMENT ON FUNCTION cleanup_expired_refresh_tokens() IS 'Removes expired and old revoked refresh tokens';
