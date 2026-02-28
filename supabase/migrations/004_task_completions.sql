-- Task completions: verified real-world tasks with optional location and photo
-- Used for friends activity map
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  photo_url TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own task_completions"
  ON task_completions FOR ALL
  USING (auth.uid() = user_id);

-- Users can view friends' completions (for activity map)
CREATE POLICY "Users can view friends task_completions"
  ON task_completions FOR SELECT
  USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT receiver_id FROM friend_connections WHERE requester_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT requester_id FROM friend_connections WHERE receiver_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE INDEX idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX idx_task_completions_created_at ON task_completions(created_at DESC);

-- Storage bucket for task verification photos (public read for map display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-photos', 'task-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload own task photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read for task-photos bucket (needed for map display)
CREATE POLICY "Public read task photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-photos');
