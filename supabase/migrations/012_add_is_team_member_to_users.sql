-- Add is_team_member column to public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_team_member BOOLEAN DEFAULT false;

-- Create an index to query team members efficiently
CREATE INDEX IF NOT EXISTS idx_users_is_team_member ON public.users(is_team_member) WHERE is_team_member = true;
