-- User activity tracking
CREATE TABLE IF NOT EXISTS website_activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL DEFAULT '/',
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_active_seconds INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_website_activity_sessions_user_id ON website_activity_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_website_activity_sessions_last_seen_at ON website_activity_sessions(last_seen_at DESC);

-- Upcoming sessions
CREATE TABLE IF NOT EXISTS upcoming_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  meet_link TEXT NOT NULL,
  session_at TIMESTAMPTZ NOT NULL,
  visibility_scope TEXT NOT NULL DEFAULT 'all',
  audience_tiers TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upcoming_sessions_session_at ON upcoming_sessions(session_at ASC);
CREATE INDEX IF NOT EXISTS idx_upcoming_sessions_visibility_scope ON upcoming_sessions(visibility_scope);

CREATE TABLE IF NOT EXISTS upcoming_session_users (
  session_id UUID NOT NULL REFERENCES upcoming_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_upcoming_session_users_user_id ON upcoming_session_users(user_id);

-- Enable Row Level Security
ALTER TABLE website_activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_session_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for website_activity_sessions
-- Users can see only their own activity
CREATE POLICY "Users can view own activity" ON website_activity_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update (from API routes)
CREATE POLICY "Service role can insert activity" ON website_activity_sessions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update activity" ON website_activity_sessions
  FOR UPDATE USING (auth.role() = 'service_role');

-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON website_activity_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('krishna@aibuilder.space', 'admin@aibuilder.space')
    )
  );

-- RLS Policies for upcoming_sessions
-- Everyone can see active sessions
CREATE POLICY "Users can view active sessions" ON upcoming_sessions
  FOR SELECT USING (is_active = true);

-- Service role can manage sessions (from API routes)
CREATE POLICY "Service role can manage sessions" ON upcoming_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for upcoming_session_users
-- Users can see their session assignments
CREATE POLICY "Users can view their session assignments" ON upcoming_session_users
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage assignments
CREATE POLICY "Service role can manage session assignments" ON upcoming_session_users
  FOR ALL USING (auth.role() = 'service_role');
