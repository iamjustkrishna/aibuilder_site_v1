-- Migration 015: Admin Automated Email Toggle
-- Add admin_reminders_enabled to cohort_enrollments
ALTER TABLE public.cohort_enrollments 
  ADD COLUMN IF NOT EXISTS admin_reminders_enabled BOOLEAN NOT NULL DEFAULT true;
