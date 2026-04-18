-- ================================================
-- Zentru: App Version Management (FIXED)
-- Run after admin-schema.sql
-- ================================================

CREATE TABLE IF NOT EXISTS public.app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  latest_version TEXT NOT NULL,
  min_version TEXT NOT NULL,
  changelog_zh TEXT,
  changelog_en TEXT,
  download_url TEXT,
  is_active BOOLEAN DEFAULT true,
  released_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Ensure only one active version per platform (partial unique index, NOT deferrable)
DROP INDEX IF EXISTS idx_active_version_per_platform;
CREATE UNIQUE INDEX idx_active_version_per_platform
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
-- Seed initial versions (one at a time to avoid ON CONFLICT issues)
-- =====================================================
-- Insert only if no active row exists for that platform
INSERT INTO public.app_versions (platform, latest_version, min_version, changelog_zh, changelog_en, download_url)
SELECT 'web', '1.0.0', '0.0.0', '首次发布', 'Initial release', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.app_versions WHERE platform = 'web' AND is_active = true);

INSERT INTO public.app_versions (platform, latest_version, min_version, changelog_zh, changelog_en, download_url)
SELECT 'android', '1.0.0', '0.0.0', '首次发布', 'Initial release', 'https://zentru.vercel.app'
WHERE NOT EXISTS (SELECT 1 FROM public.app_versions WHERE platform = 'android' AND is_active = true);

INSERT INTO public.app_versions (platform, latest_version, min_version, changelog_zh, changelog_en, download_url)
SELECT 'ios', '1.0.0', '0.0.0', '即将推出', 'Coming soon', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.app_versions WHERE platform = 'ios' AND is_active = true);

SELECT * FROM public.app_versions WHERE is_active = true;
