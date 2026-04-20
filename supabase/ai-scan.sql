-- AI Receipt Scan Quota (v3 - SQL-based, no plpgsql variable pitfalls)
-- Run the entire file at once in Supabase SQL Editor.

-- 1. Add the counter column ---------------------------------------------------
ALTER TABLE public.usage
  ADD COLUMN IF NOT EXISTS ai_scans_count INTEGER NOT NULL DEFAULT 0;

-- 2. Clean slate (in case previous runs partially succeeded) ------------------
DROP FUNCTION IF EXISTS public.consume_ai_scan_quota();
DROP FUNCTION IF EXISTS public.get_ai_scan_remaining();
DROP FUNCTION IF EXISTS public.ai_scan_quota_for(UUID);

-- 3. Internal helper — compute quota info for a given user --------------------
-- Plain SQL function: no DECLARE, no assignments, no pragmas = no parser edge cases.
CREATE FUNCTION public.ai_scan_quota_for(p_uid UUID)
RETURNS TABLE(quota_limit INTEGER, used INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN pr.role IN ('admin', 'super_admin', 'support') THEN 99999
      WHEN pr.plan = 'premium'
           AND (pr.plan_expires_at IS NULL OR pr.plan_expires_at > NOW())
        THEN 100
      ELSE 3
    END                                                 AS quota_limit,
    COALESCE(
      (SELECT u.ai_scans_count
         FROM public.usage u
        WHERE u.user_id = p_uid
          AND u.month   = to_char(NOW(), 'YYYY-MM')),
      0
    )                                                   AS used
  FROM public.profiles pr
  WHERE pr.id = p_uid;
$$;

-- 4. Read-only quota check ----------------------------------------------------
CREATE FUNCTION public.get_ai_scan_remaining()
RETURNS TABLE(remaining INTEGER, limit_value INTEGER, used INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    GREATEST(q.quota_limit - q.used, 0) AS remaining,
    q.quota_limit                        AS limit_value,
    q.used                               AS used
  FROM public.ai_scan_quota_for(auth.uid()) q;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_scan_remaining() TO authenticated;

-- 5. Consume-one helper (needs plpgsql for conditional INSERT+UPDATE) ---------
-- This one is plpgsql but extremely minimal — no variable assignments,
-- everything driven off a subquery result.
CREATE FUNCTION public.consume_ai_scan_quota()
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, limit_value INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require auth
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Ensure the monthly row exists
  INSERT INTO public.usage (user_id, month, ai_scans_count)
  VALUES (auth.uid(), to_char(NOW(), 'YYYY-MM'), 0)
  ON CONFLICT (user_id, month) DO NOTHING;

  -- Attempt to consume one in a single atomic UPDATE
  -- (RETURNING so we know whether it actually happened)
  RETURN QUERY
  WITH q AS (
    SELECT * FROM public.ai_scan_quota_for(auth.uid())
  ),
  updated AS (
    UPDATE public.usage u
       SET ai_scans_count = u.ai_scans_count + 1
     WHERE u.user_id = auth.uid()
       AND u.month   = to_char(NOW(), 'YYYY-MM')
       AND u.ai_scans_count < (SELECT quota_limit FROM q)
    RETURNING u.ai_scans_count
  )
  SELECT
    (SELECT count(*) FROM updated) > 0          AS allowed,
    GREATEST(
      (SELECT quota_limit FROM q)
        - COALESCE((SELECT ai_scans_count FROM updated), (SELECT used FROM q)),
      0
    )                                           AS remaining,
    (SELECT quota_limit FROM q)                 AS limit_value;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_ai_scan_quota() TO authenticated;
