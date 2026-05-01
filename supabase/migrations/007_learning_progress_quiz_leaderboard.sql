-- Learning progress, quiz, and leaderboard foundation

CREATE TABLE IF NOT EXISTS learning_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  cohort_video_config_id UUID NOT NULL REFERENCES cohort_video_configs(id) ON DELETE CASCADE,
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  max_progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  ended_once BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT learning_video_progress_unique UNIQUE (user_id, cohort_video_config_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_video_progress_user ON learning_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_video_progress_cohort ON learning_video_progress(cohort_id);
CREATE INDEX IF NOT EXISTS idx_learning_video_progress_completed ON learning_video_progress(completed_at DESC);

CREATE TABLE IF NOT EXISTS learning_video_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_video_config_id UUID NOT NULL REFERENCES cohort_video_configs(id) ON DELETE CASCADE,
  generated_source TEXT NOT NULL DEFAULT 'ai',
  question_count INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_video_quizzes_active_unique
  ON learning_video_quizzes(cohort_video_config_id)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS learning_video_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES learning_video_quizzes(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT learning_video_quiz_questions_order_unique UNIQUE (quiz_id, question_order)
);

CREATE TABLE IF NOT EXISTS learning_video_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES learning_video_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  cohort_video_config_id UUID NOT NULL REFERENCES cohort_video_configs(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  score_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_video_quiz_attempts_user ON learning_video_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_video_quiz_attempts_cohort ON learning_video_quiz_attempts(cohort_id);
CREATE INDEX IF NOT EXISTS idx_learning_video_quiz_attempts_video ON learning_video_quiz_attempts(cohort_video_config_id);

CREATE TABLE IF NOT EXISTS curated_video_refresh_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  week_number INTEGER,
  source TEXT NOT NULL DEFAULT 'github-actions',
  status TEXT NOT NULL DEFAULT 'success',
  generated_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT curated_video_refresh_logs_status_check CHECK (status IN ('success', 'error'))
);

ALTER TABLE learning_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_video_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_video_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_video_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_video_refresh_logs ENABLE ROW LEVEL SECURITY;

-- User visibility
CREATE POLICY "Users can view own learning progress"
  ON learning_video_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own learning progress"
  ON learning_video_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress"
  ON learning_video_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view active quizzes"
  ON learning_video_quizzes FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view quiz questions"
  ON learning_video_quiz_questions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own quiz attempts"
  ON learning_video_quiz_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON learning_video_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role management
CREATE POLICY "Service role manages learning progress"
  ON learning_video_progress FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages learning quizzes"
  ON learning_video_quizzes FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages learning quiz questions"
  ON learning_video_quiz_questions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages learning quiz attempts"
  ON learning_video_quiz_attempts FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages refresh logs"
  ON curated_video_refresh_logs FOR ALL USING (auth.role() = 'service_role');

