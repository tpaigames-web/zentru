-- ================================================
-- Zentru: Sample Rewards System
-- Run after admin-schema.sql
-- ================================================

-- =====================================================
-- 1. Extend statement_samples table
-- =====================================================
ALTER TABLE public.statement_samples
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS reward_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS admin_reviewed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_bonus_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS rejected BOOLEAN DEFAULT false;

-- Index for dedup (user + bank + day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sample_dedup_daily
  ON public.statement_samples (user_id, bank, DATE(submitted_at))
  WHERE user_id IS NOT NULL AND NOT rejected;

-- Index for hash-based dedup
CREATE INDEX IF NOT EXISTS idx_sample_hash ON public.statement_samples(content_hash)
  WHERE content_hash IS NOT NULL;

-- =====================================================
-- 2. User sample submissions summary table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sample_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  samples_submitted INTEGER DEFAULT 0,
  samples_approved INTEGER DEFAULT 0,
  total_days_earned INTEGER DEFAULT 0,
  last_submission_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_sample_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own stats" ON public.user_sample_stats;
CREATE POLICY "Users can read own stats" ON public.user_sample_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all stats" ON public.user_sample_stats;
CREATE POLICY "Admins can read all stats" ON public.user_sample_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- =====================================================
-- 3. Trigger: on sample insert, reward user + update stats
-- =====================================================
CREATE OR REPLACE FUNCTION public.reward_sample_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  duplicate_count INTEGER;
  existing_user UUID;
BEGIN
  -- Only reward if user_id is set (anonymous submissions don't earn)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check for dedup: same user + same bank in last 24h
  SELECT COUNT(*) INTO duplicate_count
  FROM public.statement_samples
  WHERE user_id = NEW.user_id
    AND bank = NEW.bank
    AND submitted_at > NOW() - INTERVAL '24 hours'
    AND id != NEW.id
    AND NOT rejected;

  IF duplicate_count > 0 THEN
    -- Mark as zero reward (duplicate)
    NEW.reward_days := 0;
    RETURN NEW;
  END IF;

  -- Check for content hash duplicate
  IF NEW.content_hash IS NOT NULL THEN
    SELECT user_id INTO existing_user
    FROM public.statement_samples
    WHERE content_hash = NEW.content_hash
      AND id != NEW.id
    LIMIT 1;

    IF existing_user IS NOT NULL THEN
      NEW.reward_days := 0;
      RETURN NEW;
    END IF;
  END IF;

  -- Reward: extend trial by reward_days
  PERFORM public.extend_trial(NEW.user_id, NEW.reward_days);

  -- Update user stats
  INSERT INTO public.user_sample_stats (user_id, samples_submitted, samples_approved, total_days_earned, last_submission_at)
  VALUES (NEW.user_id, 1, 1, NEW.reward_days, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    samples_submitted = public.user_sample_stats.samples_submitted + 1,
    samples_approved = public.user_sample_stats.samples_approved + 1,
    total_days_earned = public.user_sample_stats.total_days_earned + NEW.reward_days,
    last_submission_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reward_sample_submission_trigger ON public.statement_samples;
CREATE TRIGGER reward_sample_submission_trigger
  BEFORE INSERT ON public.statement_samples
  FOR EACH ROW EXECUTE FUNCTION public.reward_sample_submission();

-- =====================================================
-- 4. Admin function: grant bonus days
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_grant_sample_bonus(
  p_sample_id UUID,
  p_bonus_days INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sample_user_id UUID;
  admin_role TEXT;
BEGIN
  -- Verify caller is admin+
  SELECT role INTO admin_role FROM public.profiles WHERE id = auth.uid();
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  -- Get sample's user_id
  SELECT user_id INTO sample_user_id
  FROM public.statement_samples
  WHERE id = p_sample_id;

  IF sample_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update sample
  UPDATE public.statement_samples
  SET admin_reviewed = true,
      admin_bonus_days = p_bonus_days,
      admin_notes = p_notes
  WHERE id = p_sample_id;

  -- Extend trial
  PERFORM public.extend_trial(sample_user_id, p_bonus_days);

  -- Update stats
  UPDATE public.user_sample_stats
  SET total_days_earned = total_days_earned + p_bonus_days,
      updated_at = NOW()
  WHERE user_id = sample_user_id;

  -- Log action
  PERFORM public.log_admin_action(
    'sample.grant_bonus',
    'sample',
    p_sample_id::TEXT,
    NULL,
    jsonb_build_object('bonus_days', p_bonus_days, 'notes', p_notes)
  );

  RETURN TRUE;
END;
$$;

-- =====================================================
-- 5. Verify
-- =====================================================
SELECT
  'statement_samples' AS table_name,
  COUNT(*) AS total_samples,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS with_user,
  SUM(reward_days) AS total_reward_days
FROM public.statement_samples;
