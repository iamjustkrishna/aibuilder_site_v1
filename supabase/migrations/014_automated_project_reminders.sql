-- Migration 014: Automated Project Reminders Setup
-- Add project_submission_active to cohorts
ALTER TABLE public.cohorts 
  ADD COLUMN IF NOT EXISTS project_submission_active BOOLEAN NOT NULL DEFAULT false;

-- Add receive_automatic_emails to user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS receive_automatic_emails BOOLEAN NOT NULL DEFAULT true;
