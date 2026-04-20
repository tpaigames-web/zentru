-- AI Receipt Scan Quota
-- Run this once in Supabase SQL editor after `schema.sql` and `trial-system.sql`
--
-- Adds monthly AI scan quota tracking on the existing `usage` table.
-- Free users get 3 scans/month, Premium get 100, admins unlimited.

-- 1. Add the counter column ----------------------------------------------------
ALTER TABLE usage
  ADD COLUMN IF NOT EXISTS ai_scans_count INTEGER NOT NULL DEFAULT 0;

-- 2. Helper RPC: check quota + consume in one call -----------------------------
-- Returns (allowed, remaining, limit_value)
-- SECURITY DEFINER so it can write to usage regardless of RLS context; we
-- intentionally derive user_id from auth.uid() to prevent spoofing via params.
CREATE OR REPLACE FUNCTION consume_ai_scan_quota()
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, limit_value INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_role TEXT;
  v_month TEXT := to_char(NOW(), 'YYYY-MM');
  v_current_count INTEGER;
  v_limit INTEGER;
  v_is_premium BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1) Read plan + role
  SELECT plan, plan_expires_at, role
    INTO v_plan, v_plan_expires_at, v_role
    FROM profiles
   WHERE id = v_user_id;

  -- 2) Determine tier and quota
  -- Admin / support / super_admin = unlimited
  IF v_role IN ('admin', 'super_admin', 'support') THEN
    RETURN QUERY SELECT TRUE, 99999, 99999;
    RETURN;
  END IF;

  -- Active premium (permanent OR not yet expired)
  v_is_premium := (v_plan = 'premium')
                  AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW());

  IF v_is_premium THEN
    v_limit := 100;
  ELSE
    v_limit := 3;
  END IF;

  -- 3) Fetch or insert current month row
  INSERT INTO usage (user_id, month, ai_scans_count)
  VALUES (v_user_id, v_month, 0)
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT ai_scans_count INTO v_current_count
    FROM usage
   WHERE user_id = v_user_id AND month = v_month;

  -- 4) Quota check
  IF v_current_count >= v_limit THEN
    RETURN QUERY SELECT FALSE, 0, v_limit;
    RETURN;
  END IF;

  -- 5) Consume
  UPDATE usage
     SET ai_scans_count = ai_scans_count + 1
   WHERE user_id = v_user_id AND month = v_month;

  RETURN QUERY SELECT TRUE, (v_limit - v_current_count - 1), v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION consume_ai_scan_quota() TO authenticated;

-- 3. Read-only helper: get current remaining without consuming ----------------
CREATE OR REPLACE FUNCTION get_ai_scan_remaining()
RETURNS TABLE(remaining INTEGER, limit_value INTEGER, used INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_role TEXT;
  v_month TEXT := to_char(NOW(), 'YYYY-MM');
  v_current_count INTEGER := 0;
  v_limit INTEGER;
  v_is_premium BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT plan, plan_expires_at, role
    INTO v_plan, v_plan_expires_at, v_role
    FROM profiles
   WHERE id = v_user_id;

  IF v_role IN ('admin', 'super_admin', 'support') THEN
    RETURN QUERY SELECT 99999, 99999, 0;
    RETURN;
  END IF;

  v_is_premium := (v_plan = 'premium')
                  AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW());

  v_limit := CASE WHEN v_is_premium THEN 100 ELSE 3 END;

  SELECT COALESCE(ai_scans_count, 0) INTO v_current_count
    FROM usage
   WHERE user_id = v_user_id AND month = v_month;

  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;

  RETURN QUERY SELECT GREATEST(v_limit - v_current_count, 0), v_limit, v_current_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_ai_scan_remaining() TO authenticated;
