-- Add username for simple lookup (replaces invite code flow)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Backfill: use invite_code as username for existing rows
UPDATE profiles SET username = LOWER(invite_code) WHERE username IS NULL AND invite_code IS NOT NULL;

-- Index for username lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
