-- Profiles: invite codes and display names for friend discovery
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  invite_code TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend connections: requester sends to receiver, status pending until accepted
CREATE TABLE friend_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles by invite code"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own friend_connections"
  ON friend_connections FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE INDEX idx_profiles_invite_code ON profiles(invite_code);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_friend_connections_requester ON friend_connections(requester_id);
CREATE INDEX idx_friend_connections_receiver ON friend_connections(receiver_id);
