ALTER TABLE public.cohorts
ADD COLUMN IF NOT EXISTS curated_videos_source_url text,
ADD COLUMN IF NOT EXISTS curated_videos_synced_at timestamptz;
