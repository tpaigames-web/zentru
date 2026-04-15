-- ================================================
-- Zentru: Fix "Database error saving new user"
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with proper error handling
-- Key fixes:
--   1. SET search_path = public (prevents path confusion)
--   2. EXCEPTION handler (won't block signup if profile insert fails)
--   3. Explicit public.profiles reference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    )
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

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify: check if the trigger exists
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
