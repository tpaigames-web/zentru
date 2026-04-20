-- AI Receipt Scan Quota (v2 - fixed variable naming)
-- Run this in Supabase SQL Editor after `schema.sql` and `trial-system.sql`
--
-- Adds monthly AI scan quota tracking on the existing `usage` table.
-- Free users get 3 scans/month, Premium get 100, admins unlimited.

-- 1. Add the counter column ----------------------------------------------------
ALTER TABLE usage
  ADD COLUMN IF NOT EXISTS ai_scans_count INTEGER NOT NULL DEFAULT 0;

-- 2. Drop old versions if previous attempt partially succeeded ----------------
DROP FUNCTION IF EXISTS consume_ai_scan_quota();
DROP FUNCTION IF EXISTS get_ai_scan_remaining();

-- 3. Helper RPC: check quota + consume in one call -----------------------------
-- Returns (allowed, remaining, limit_value)
-- SECURITY DEFINER so it can write to usage regardless of RLS context; we
-- derive user_id from auth.uid() inside to prevent spoofing.
CREATE OR REPLACE FUNCTION consume_ai_scan_quota()
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, limit_value INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
#variable_conflict use_variable
DECLARE
  uid            UUID         := auth.uid();
  user_plan      TEXT;
  plan_exp       TIMESTAMPTZ;
  user_role      TEXT;
  ym             TEXT         := to_char(NOW(), 'YYYY-MM');
  cur_count      INTEGER;
  quota_limit    INTEGER;
  is_prem        BOOLEAN;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1) Read plan + role from profiles (table-qualified to avoid any conflict)
  SELECT p.plan, p.plan_expires_at, p.role
    INTO user_plan, plan_exp, user_role
    FROM public.profiles AS p
   WHERE p.id = uid;

  -- 2) Determine tier and quota
  -- Admin / support / super_admin = unlimited
  IF user_role IN ('admin', 'super_admin', 'support') THEN
    RETURN QUERY SELECT TRUE, 99999, 99999;
    RETURN;
  END IF;

  -- Active premium (permanent OR not yet expired)
  is_prem := (user_plan = 'premium')
             AND (plan_exp IS NULL OR plan_exp > NOW());

  quota_limit := CASE WHEN is_prem THEN 100 ELSE 3 END;

  -- 3) Fetch or insert current month row
  INSERT INTO public.usage (user_id, month, ai_scans_count)
  VALUES (uid, ym, 0)
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT u.ai_scans_count INTO cur_count
    FROM public.usage AS u
   WHERE u.user_id = uid AND u.month = ym;

  IF cur_count IS NULL THEN
    cur_count := 0;
  END IF;

  -- 4) Quota check
  IF cur_count >= quota_limit THEN
    RETURN QUERY SELECT FALSE, 0, quota_limit;
    RETURN;
  END IF;

  -- 5) Consume
  UPDATE public.usage
     SET ai_scans_count = ai_scans_count + 1
   WHERE user_id = uid AND month = ym;

  RETURN QUERY SELECT TRUE, (quota_limit - cur_count - 1), quota_limit;
END;
$func$;

GRANT EXECUTE ON FUNCTION consume_ai_scan_quota() TO authenticated;

-- 4. Read-only helper: get current remaining without consuming ----------------
CREATE OR REPLACE FUNCTION get_ai_scan_remaining()
RETURNS TABLE(remaining INTEGER, limit_value INTEGER, used INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
#variable_conflict use_variable
DECLARE
  uid            UUID         := auth.uid();
  user_plan      TEXT;
  plan_exp       TIMESTAMPTZ;
  user_role      TEXT;
  ym             TEXT         := to_char(NOW(), 'YYYY-MM');
  cur_count      INTEGER      := 0;
  quota_limit    INTEGER;
  is_prem        BOOLEAN;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.plan, p.plan_expires_at, p.role
    INTO user_plan, plan_exp, user_role
    FROM public.profiles AS p
   WHERE p.id = uid;

  IF user_role IN ('admin', 'super_admin', 'support') THEN
    RETURN QUERY SELECT 99999, 99999, 0;
    RETURN;
  END IF;

  is_prem := (user_plan = 'premium')
             AND (plan_exp IS NULL OR plan_exp > NOW());

  quota_limit := CASE WHEN is_prem THEN 100 ELSE 3 END;

  SELECT COALESCE(u.ai_scans_count, 0) INTO cur_count
    FROM public.usage AS u
   WHERE u.user_id = uid AND u.month = ym;

  IF cur_count IS NULL THEN
    cur_count := 0;
  END IF;

  RETURN QUERY SELECT GREATEST(quota_limit - cur_count, 0), quota_limit, cur_count;
END;
$func$;

GRANT EXECUTE ON FUNCTION get_ai_scan_remaining() TO authenticated;
