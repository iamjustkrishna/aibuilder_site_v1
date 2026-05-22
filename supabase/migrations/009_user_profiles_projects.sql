-- User profile + project showcase backend

-- Public-safe profile metadata separate from the main users table.
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  headline TEXT,
  bio TEXT,
  location TEXT,
  website_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Cohort project submissions / portfolio items.
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  project_url TEXT,
  repo_url TEXT,
  demo_url TEXT,
  thumbnail_url TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_projects_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_slug ON user_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_projects_cohort ON user_projects(cohort_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(status);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- Service role full control for backend routes.
CREATE POLICY "Service role manages user profiles"
  ON user_profiles FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages user projects"
  ON user_projects FOR ALL USING (auth.role() = 'service_role');

-- Users can read and manage their own profile metadata.
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Public profiles are readable when marked public.
CREATE POLICY "Public can view public profiles"
  ON user_profiles FOR SELECT USING (is_public = true);

-- Users can read and manage their own projects.
CREATE POLICY "Users can view own projects"
  ON user_projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON user_projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON user_projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON user_projects FOR DELETE USING (auth.uid() = user_id);

-- Published projects can be viewed publicly on shareable profile pages.
CREATE POLICY "Public can view published projects"
  ON user_projects FOR SELECT USING (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.user_id = user_projects.user_id
        AND up.is_public = true
    )
  );
