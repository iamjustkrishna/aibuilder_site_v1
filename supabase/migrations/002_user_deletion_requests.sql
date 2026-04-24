-- Track staged user deletion approvals from admins
CREATE TABLE IF NOT EXISTS public.user_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_email TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, requested_by_email)
);

CREATE INDEX IF NOT EXISTS idx_user_deletion_requests_user_id
  ON public.user_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_user_deletion_requests_requested_by_email
  ON public.user_deletion_requests(requested_by_email);

ALTER TABLE public.user_deletion_requests ENABLE ROW LEVEL SECURITY;

