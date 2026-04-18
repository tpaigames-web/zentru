-- ================================================
-- Zentru: App Version Management
-- Run after admin-schema.sql
-- ================================================

CREATE TABLE IF NOT EXISTS public.app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  latest_version TEXT NOT NULL,           -- e.g. '1.2.0'
  min_version TEXT NOT NULL,              -- Below this = forced update
  changelog_zh TEXT,
  changelog_en TEXT,
  download_url TEXT,                      -- APK download or Play Store URL
  is_active BOOLEAN DEFAULT true,
  released_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(platform, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Ensure only one active version per platform at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_version_per_platform
  ON public.app_versions(platform)
  WHERE is_active = true;

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can read (to check their version)
DROP POLICY IF EXISTS "Anyone can read app versions" ON public.app_versions;
CREATE POLICY "Anyone can read app versions" ON public.app_versions
  FOR SELECT USING (true);

-- Only super_admin can write
DROP POLICY IF EXISTS "Super admin can manage versions" ON public.app_versions;
CREATE POLICY "Super admin can manage versions" ON public.app_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- =====================================================
-- Seed initial versions
-- =====================================================
INSERT INTO public.app_versions (platform, latest_version, min_version, changelog_zh, changelog_en, download_url)
VALUES
  ('web',     '1.0.0', '0.0.0', '首次发布', 'Initial release', NULL),
  ('android', '1.0.0', '0.0.0', '首次发布', 'Initial release', 'https://zentru.vercel.app'),
  ('ios',     '1.0.0', '0.0.0', '即将推出', 'Coming soon', NULL)
ON CONFLICT DO NOTHING;

SELECT * FROM public.app_versions WHERE is_active = true;
