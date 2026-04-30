-- Cohort and learning foundation

CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cohorts_status_check CHECK (status IN ('planned', 'active', 'completed', 'archived'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_single_current_cohort
  ON cohorts (is_current)
  WHERE is_current = true;

CREATE TABLE IF NOT EXISTS cohort_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cohort_enrollments_status_check CHECK (enrollment_status IN ('active', 'completed', 'paused', 'dropped')),
  CONSTRAINT cohort_enrollments_unique UNIQUE (cohort_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_enrollments_user ON cohort_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_cohort_enrollments_cohort ON cohort_enrollments(cohort_id);

CREATE TABLE IF NOT EXISTS cohort_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  unlock_at TIMESTAMPTZ,
  close_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cohort_weeks_number_check CHECK (week_number > 0),
  CONSTRAINT cohort_weeks_unique UNIQUE (cohort_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_cohort_weeks_cohort ON cohort_weeks(cohort_id, week_number);

CREATE TABLE IF NOT EXISTS cohort_video_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  video_url TEXT,
  video_title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 3,
  auto_generate_quiz BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cohort_video_configs_week_check CHECK (week_number > 0),
  CONSTRAINT cohort_video_configs_question_count_check CHECK (question_count BETWEEN 1 AND 10)
);

CREATE INDEX IF NOT EXISTS idx_cohort_video_configs_lookup
  ON cohort_video_configs(cohort_id, week_number, sort_order);

ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_video_configs ENABLE ROW LEVEL SECURITY;

-- Service role full control (API routes).
CREATE POLICY "Service role manages cohorts"
  ON cohorts FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages cohort enrollments"
  ON cohort_enrollments FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages cohort weeks"
  ON cohort_weeks FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages cohort video configs"
  ON cohort_video_configs FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can view cohorts.
CREATE POLICY "Users can view cohorts"
  ON cohorts FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only see their own enrollments.
CREATE POLICY "Users can view own cohort enrollments"
  ON cohort_enrollments FOR SELECT USING (auth.uid() = user_id);

-- Users can see week schedules for cohorts they are enrolled in.
CREATE POLICY "Users can view cohort weeks for own cohorts"
  ON cohort_weeks FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM cohort_enrollments ce
      WHERE ce.cohort_id = cohort_weeks.cohort_id
        AND ce.user_id = auth.uid()
        AND ce.enrollment_status IN ('active', 'completed', 'paused')
    )
  );

-- Users can see video configs for cohorts they are enrolled in.
CREATE POLICY "Users can view video configs for own cohorts"
  ON cohort_video_configs FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM cohort_enrollments ce
      WHERE ce.cohort_id = cohort_video_configs.cohort_id
        AND ce.user_id = auth.uid()
        AND ce.enrollment_status IN ('active', 'completed', 'paused')
    )
  );

