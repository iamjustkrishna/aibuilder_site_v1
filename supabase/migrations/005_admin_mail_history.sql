-- Mail history tracking table
CREATE TABLE IF NOT EXISTS admin_mail_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_by_admin_email TEXT NOT NULL,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  body TEXT NOT NULL,
  is_html BOOLEAN NOT NULL DEFAULT false,
  template_data JSONB,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_mail_history_sent_by ON admin_mail_history(sent_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_mail_history_recipient ON admin_mail_history(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_mail_history_sent_at ON admin_mail_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_mail_history_status ON admin_mail_history(status);

-- Enable Row Level Security
ALTER TABLE admin_mail_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all mail history (relies on isAdminEmail check in API)
CREATE POLICY "Admins can view all mail history" ON admin_mail_history
  FOR SELECT USING (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
  );

-- Service role can insert (from API)
CREATE POLICY "Service role can insert mail history" ON admin_mail_history
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can insert their own records via API
CREATE POLICY "Users can insert their own mail history" ON admin_mail_history
  FOR INSERT WITH CHECK (auth.uid() = sent_by_admin_id);

-- Admins can delete old records for cleanup (authenticated users)
CREATE POLICY "Authenticated users can delete mail history" ON admin_mail_history
  FOR DELETE USING (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
  );
