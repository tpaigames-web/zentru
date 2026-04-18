-- ================================================
-- Zentru Admin System: Roles, Audit Log, 2FA
-- Run after trial-system.sql in Supabase SQL Editor
-- ================================================

-- =====================================================
-- 1. TOTP 2FA fields on profiles
-- =====================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_password_hash TEXT; -- Second password for admin panel

-- =====================================================
-- 2. RLS: Users CANNOT update their own role
-- =====================================================
-- Drop existing update policy and recreate with role restriction
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (except role)" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Role cannot be changed via this policy (checked by separate admin policy)
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Super admin can update any profile (including role)
DROP POLICY IF EXISTS "Super admin can update any profile" ON public.profiles;
CREATE POLICY "Super admin can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Admin and support can read all profiles (for management)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('support', 'admin', 'super_admin')
    )
  );

-- =====================================================
-- 3. Admin Audit Log
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  admin_email TEXT,
  action TEXT NOT NULL,                -- 'module.toggle', 'user.extend_trial', 'user.ban', etc.
  target_type TEXT,                    -- 'user', 'module', 'sample', 'version'
  target_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read audit log
DROP POLICY IF EXISTS "Super admin can read audit" ON public.admin_audit_log;
CREATE POLICY "Super admin can read audit" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Admins can insert (log their own actions)
DROP POLICY IF EXISTS "Admins can insert audit" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit" ON public.admin_audit_log
  FOR INSERT WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('support', 'admin', 'super_admin')
    )
  );

-- =====================================================
-- 4. Module management: only admin+ can write
-- =====================================================
DROP POLICY IF EXISTS "Admins can update modules" ON public.modules;
CREATE POLICY "Admins can update modules" ON public.modules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Super admin can insert modules" ON public.modules;
CREATE POLICY "Super admin can insert modules" ON public.modules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- =====================================================
-- 5. Helper: log admin action
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
  admin_email_val TEXT;
BEGIN
  -- Get admin email
  SELECT email INTO admin_email_val FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.admin_audit_log (
    admin_id, admin_email, action, target_type, target_id,
    old_value, new_value
  ) VALUES (
    auth.uid(), admin_email_val, p_action, p_target_type, p_target_id,
    p_old_value, p_new_value
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- =====================================================
-- 6. Helper: check admin role
-- =====================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- =====================================================
-- 7. Admin stats view (aggregate data for dashboard)
-- =====================================================
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) AS total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE trial_ends_at > NOW()) AS users_in_trial,
  (SELECT COUNT(*) FROM public.profiles WHERE plan = 'premium') AS premium_users,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '7 days') AS new_users_7d,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '30 days') AS new_users_30d,
  (SELECT COUNT(*) FROM public.statement_samples) AS total_samples,
  (SELECT COUNT(*) FROM public.statement_samples WHERE submitted_at > NOW() - INTERVAL '7 days') AS samples_7d,
  (SELECT COUNT(DISTINCT user_id) FROM public.user_data WHERE updated_at > NOW() - INTERVAL '7 days') AS dau_7d,
  (SELECT COUNT(DISTINCT user_id) FROM public.user_data WHERE updated_at > NOW() - INTERVAL '30 days') AS mau_30d;

-- Only admins can read stats
ALTER VIEW public.admin_stats SET (security_invoker = true);

-- =====================================================
-- 8. INITIAL SETUP: Set your account as super_admin
-- =====================================================
-- REPLACE 'your-email@example.com' with your actual email!
-- Then uncomment and run:
--
-- UPDATE public.profiles
-- SET role = 'super_admin'
-- WHERE email = 'your-email@example.com';

-- =====================================================
-- 9. Verify
-- =====================================================
SELECT
  'admin_audit_log' AS table_name,
  COUNT(*) AS row_count
FROM public.admin_audit_log
UNION ALL
SELECT
  'profiles_with_roles',
  COUNT(*)
FROM public.profiles
WHERE role != 'user';
