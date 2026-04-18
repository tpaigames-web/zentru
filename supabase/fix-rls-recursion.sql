-- ================================================
-- CRITICAL FIX: RLS Recursion on Admin Policies
-- Run this in Supabase SQL Editor
-- ================================================
-- Problem: RLS policies that query profiles to check role
-- trigger the same profiles SELECT policy, causing recursion.
-- Solution: Use SECURITY DEFINER function to bypass RLS.

-- =====================================================
-- 1. Create helper function (bypasses RLS)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- =====================================================
-- 2. Fix profiles policies (main issue)
-- =====================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.get_my_role() IN ('support', 'admin', 'super_admin')
  );

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_superadmin" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR public.get_my_role() = 'super_admin'
  );

-- =====================================================
-- 3. Fix other tables that also have recursion
-- =====================================================

-- Modules
DROP POLICY IF EXISTS "Admins can update modules" ON public.modules;
DROP POLICY IF EXISTS "Super admin can insert modules" ON public.modules;
CREATE POLICY "modules_admin_update" ON public.modules
  FOR UPDATE USING (public.get_my_role() IN ('admin', 'super_admin'));
CREATE POLICY "modules_admin_insert" ON public.modules
  FOR INSERT WITH CHECK (public.get_my_role() = 'super_admin');

-- Admin audit log
DROP POLICY IF EXISTS "Super admin can read audit" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit" ON public.admin_audit_log;
CREATE POLICY "audit_super_admin_read" ON public.admin_audit_log
  FOR SELECT USING (public.get_my_role() = 'super_admin');
CREATE POLICY "audit_admin_insert" ON public.admin_audit_log
  FOR INSERT WITH CHECK (
    auth.uid() = admin_id
    AND public.get_my_role() IN ('support', 'admin', 'super_admin')
  );

-- App versions
DROP POLICY IF EXISTS "Super admin can manage versions" ON public.app_versions;
CREATE POLICY "versions_super_admin_write" ON public.app_versions
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- User sample stats (admin view)
DROP POLICY IF EXISTS "Admins can read all stats" ON public.user_sample_stats;
CREATE POLICY "sample_stats_admin_read" ON public.user_sample_stats
  FOR SELECT USING (public.get_my_role() IN ('admin', 'super_admin'));

-- =====================================================
-- Verify
-- =====================================================
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'modules', 'admin_audit_log', 'app_versions', 'user_sample_stats')
ORDER BY tablename, policyname;
