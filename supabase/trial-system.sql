-- ================================================
-- Zentru: 90-Day Trial System
-- Run after schema.sql in Supabase SQL Editor
-- ================================================

-- =====================================================
-- 1. Add trial fields to profiles
-- =====================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'support', 'admin', 'super_admin'));

-- =====================================================
-- 2. Update handle_new_user to set trial on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Promo period: users who sign up before 2026-09-01 get full 90-day trial
  INSERT INTO public.profiles (id, email, display_name, trial_started_at, trial_ends_at, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NOW(),
    NOW() + INTERVAL '90 days',
    'user'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================
-- 3. Helper function: check if user is currently in trial
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_in_trial(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at > NOW()
  );
$$;

-- =====================================================
-- 4. Helper function: extend trial (for sample rewards)
-- =====================================================
CREATE OR REPLACE FUNCTION public.extend_trial(p_user_id UUID, p_days INTEGER)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_end TIMESTAMPTZ;
BEGIN
  UPDATE public.profiles
  SET trial_ends_at = GREATEST(
    COALESCE(trial_ends_at, NOW()),
    NOW()
  ) + (p_days || ' days')::INTERVAL
  WHERE id = p_user_id
  RETURNING trial_ends_at INTO new_end;
  RETURN new_end;
END;
$$;

-- =====================================================
-- 5. Backfill existing users (give them trial too)
-- =====================================================
UPDATE public.profiles
SET
  trial_started_at = COALESCE(trial_started_at, created_at, NOW()),
  trial_ends_at = COALESCE(trial_ends_at, COALESCE(created_at, NOW()) + INTERVAL '90 days')
WHERE trial_ends_at IS NULL;

-- =====================================================
-- 6. Verify
-- =====================================================
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE trial_ends_at > NOW()) AS in_trial,
  COUNT(*) FILTER (WHERE trial_ends_at <= NOW()) AS trial_expired
FROM public.profiles;
