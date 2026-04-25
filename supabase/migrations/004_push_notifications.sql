-- Push notification subscriptions table
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id ON user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_is_active ON user_push_subscriptions(is_active);

-- Enable Row Level Security
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see only their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON user_push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON user_push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage subscriptions" ON user_push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Admins can view all subscriptions for debugging
CREATE POLICY "Admins can view all subscriptions" ON user_push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('krishna@aibuilder.space', 'admin@aibuilder.space')
    )
  );
