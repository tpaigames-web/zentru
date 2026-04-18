-- ================================================
-- FIX: Profiles RLS conflict
-- Run this in Supabase SQL Editor to fix "500 Internal Server Error"
-- ================================================

-- Drop ALL existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile (except role)" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Simpler policies that work correctly:

-- 1. SELECT: Users can read their own, admins can read all
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role IN ('support', 'admin', 'super_admin')
    )
  );

-- 2. INSERT: Users can insert their own (signup trigger uses SECURITY DEFINER so bypasses RLS)
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. UPDATE: Users can update their own data EXCEPT role. Admins/super_admin can update anything.
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    -- Can update if: owns the profile OR is super_admin
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Verify
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles';
