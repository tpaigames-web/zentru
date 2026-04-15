-- Zentru Database Schema for Supabase
-- Run this in Supabase Dashboard → SQL Editor
-- If tables already exist, skip to the "Fix trigger" section at the bottom

-- ============================================
-- STEP 1: Create tables (skip if already done)
-- ============================================

-- 1. User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subscription history
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  provider TEXT CHECK (provider IN ('stripe', 'google_play', 'manual')),
  provider_subscription_id TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Synced user data (encrypted blobs)
CREATE TABLE IF NOT EXISTS public.user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_type TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, data_type)
);

-- 4. Usage tracking (for freemium limits)
CREATE TABLE IF NOT EXISTS public.usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  transactions_count INTEGER DEFAULT 0,
  pdf_imports_count INTEGER DEFAULT 0,
  cards_count INTEGER DEFAULT 0,
  UNIQUE(user_id, month)
);

-- ============================================
-- STEP 2: Enable RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: RLS Policies (DROP IF EXISTS to avoid duplicates)
-- ============================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can read own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can update own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can read own usage" ON public.usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage;
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own data" ON public.user_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON public.user_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON public.user_data FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own usage" ON public.usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON public.usage FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- STEP 4: Auto-create profile on signup (THE FIX)
-- ============================================
-- This is what causes "Database error saving new user" if it fails.
-- We use SECURITY DEFINER + set search_path to ensure it bypasses RLS.

-- Drop old trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

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
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 5: Auto-update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS user_data_updated_at ON public.user_data;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER user_data_updated_at BEFORE UPDATE ON public.user_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
