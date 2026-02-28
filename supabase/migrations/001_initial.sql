-- Data-Driven Mini Games Platform - Initial Schema
-- Users are managed by Supabase Auth; we extend with profiles and data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Data connections (OAuth tokens, webhook identifiers)
CREATE TABLE data_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'spotify', 'apple_health'
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Cached user metrics (from Apple Health webhook, Spotify, OpenTopo, manual input)
CREATE TABLE user_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'apple_health', 'spotify', 'opentopo', 'manual'
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Game sessions (generated configs from Gemini)
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE data_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own data_connections"
  ON data_connections FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own user_metrics"
  ON user_metrics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own game_sessions"
  ON game_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_data_connections_user_id ON data_connections(user_id);
CREATE INDEX idx_user_metrics_user_id ON user_metrics(user_id);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
