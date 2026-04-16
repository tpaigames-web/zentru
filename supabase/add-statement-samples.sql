-- ================================================
-- Zentru: Add statement_samples table for PDF format collection
-- Run in Supabase Dashboard → SQL Editor
-- ================================================

CREATE TABLE IF NOT EXISTS public.statement_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank TEXT NOT NULL,
  card_product TEXT,
  transaction_count INTEGER DEFAULT 0,
  parse_success BOOLEAN DEFAULT true,
  sample_text TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous inserts (no RLS needed — samples are anonymized)
ALTER TABLE public.statement_samples ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymized data), only admin can read
CREATE POLICY "Anyone can submit samples" ON public.statement_samples
  FOR INSERT WITH CHECK (true);

-- Verify
SELECT tablename FROM pg_tables WHERE tablename = 'statement_samples';
