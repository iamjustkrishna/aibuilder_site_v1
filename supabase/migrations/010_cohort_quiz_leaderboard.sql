-- Cohort quiz + leaderboard foundation

CREATE TABLE IF NOT EXISTS cohort_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL DEFAULT 'end',
  week_number INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  publish_mode TEXT NOT NULL DEFAULT 'manual',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cohort_quizzes_type_check CHECK (quiz_type IN ('end', 'weekly')),
  CONSTRAINT cohort_quizzes_week_check CHECK (week_number >= 0),
  CONSTRAINT cohort_quizzes_publish_mode_check CHECK (publish_mode IN ('manual', 'auto')),
  CONSTRAINT cohort_quizzes_unique UNIQUE (cohort_id, quiz_type, week_number)
);

CREATE TABLE IF NOT EXISTS cohort_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES cohort_quizzes(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  questions JSONB NOT NULL,
  answers JSONB NOT NULL,
  score_points INTEGER NOT NULL DEFAULT 0,
  score_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  feedback JSONB,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cohort_quiz_attempts_unique UNIQUE (quiz_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_quizzes_lookup ON cohort_quizzes(cohort_id, quiz_type, week_number, is_published);
CREATE INDEX IF NOT EXISTS idx_cohort_quiz_attempts_user ON cohort_quiz_attempts(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_quiz_attempts_cohort ON cohort_quiz_attempts(cohort_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_quiz_attempts_quiz ON cohort_quiz_attempts(quiz_id, attempted_at DESC);

ALTER TABLE cohort_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages cohort quizzes"
  ON cohort_quizzes FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages cohort quiz attempts"
  ON cohort_quiz_attempts FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view published cohort quizzes"
  ON cohort_quizzes FOR SELECT USING (
    is_published = true
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view own cohort quiz attempts"
  ON cohort_quiz_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cohort quiz attempts"
  ON cohort_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
