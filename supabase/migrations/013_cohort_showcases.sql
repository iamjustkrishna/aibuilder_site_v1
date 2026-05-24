-- Migration 013: Cohort Showcases & Manual Projects
CREATE TABLE IF NOT EXISTS cohort_showcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID UNIQUE NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL, -- e.g. "cohort-1", "cohort-0"
  title TEXT NOT NULL, -- e.g. "AI Builder Cohort 1 Graduation Gallery"
  hero_title TEXT,
  hero_subtitle TEXT,
  summary TEXT, -- graduation summary / story text
  highlight_video_url TEXT, -- main cohort highlight recap video (YouTube/Vimeo)
  is_active BOOLEAN NOT NULL DEFAULT false, -- public toggle
  settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- custom UI layout and styling rules (e.g., color themes, grid configurations)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Make user_id nullable in user_projects to allow purely manual project showcases added by admin
ALTER TABLE user_projects ALTER COLUMN user_id DROP NOT NULL;

-- Add manual developer override columns to user_projects
ALTER TABLE user_projects 
  ADD COLUMN IF NOT EXISTS developer_name TEXT,
  ADD COLUMN IF NOT EXISTS developer_email TEXT,
  ADD COLUMN IF NOT EXISTS developer_avatar_url TEXT;

-- Enable RLS and define permissions
ALTER TABLE cohort_showcases ENABLE ROW LEVEL SECURITY;

-- Service role full control for backend routes
CREATE POLICY "Service role manages showcases"
  ON cohort_showcases FOR ALL USING (auth.role() = 'service_role');

-- Public can view active showcases
CREATE POLICY "Public can view active showcases"
  ON cohort_showcases FOR SELECT USING (is_active = true);
