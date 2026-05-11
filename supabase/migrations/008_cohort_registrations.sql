-- Public cohort registrations captured from the website form.

CREATE TABLE IF NOT EXISTS cohort_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  project_description TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  daily_time_commitment_hours NUMERIC(4,1) NOT NULL,
  preferred_timing_ist TEXT NOT NULL,
  preferred_timing_other TEXT,
  availability TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cohort_registrations_experience_level_check CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  CONSTRAINT cohort_registrations_availability_check CHECK (availability IN ('weekdays', 'weekends', 'both')),
  CONSTRAINT cohort_registrations_unique UNIQUE (cohort_id, email)
);

CREATE INDEX IF NOT EXISTS idx_cohort_registrations_cohort ON cohort_registrations(cohort_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_registrations_email ON cohort_registrations(email);

ALTER TABLE cohort_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages cohort registrations"
  ON cohort_registrations FOR ALL USING (auth.role() = 'service_role');
