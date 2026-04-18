-- ================================================
-- Zentru Modular System
-- Run in Supabase Dashboard → SQL Editor
-- ================================================

-- =====================================================
-- 1. MODULES TABLE (global feature definitions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.modules (
  key TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,              -- 'core' | 'cards' | 'analytics' | 'import' | 'sync'
  icon TEXT,                           -- Lucide icon name
  description_zh TEXT,
  description_en TEXT,
  enabled BOOLEAN DEFAULT true,        -- Global enable/disable (admin)
  min_plan TEXT DEFAULT 'free' CHECK (min_plan IN ('free', 'premium')),
  min_app_version TEXT,                -- Required app version
  default_visible BOOLEAN DEFAULT true, -- Default for new users
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. USER MODULE PREFERENCES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_module_prefs (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key TEXT REFERENCES public.modules(key) ON DELETE CASCADE,
  visible BOOLEAN DEFAULT true,
  dashboard_widget BOOLEAN DEFAULT true,
  nav_position INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, module_key)
);

-- =====================================================
-- 3. UI PRESETS (scenario templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ui_presets (
  key TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  icon TEXT,
  modules TEXT[] DEFAULT '{}',         -- Module keys included in this preset (empty = all)
  sort_order INTEGER DEFAULT 100
);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read modules" ON public.modules;
DROP POLICY IF EXISTS "Users can read own prefs" ON public.user_module_prefs;
DROP POLICY IF EXISTS "Users can update own prefs" ON public.user_module_prefs;
DROP POLICY IF EXISTS "Users can insert own prefs" ON public.user_module_prefs;
DROP POLICY IF EXISTS "Users can delete own prefs" ON public.user_module_prefs;
DROP POLICY IF EXISTS "Anyone can read presets" ON public.ui_presets;

-- Modules are public (anyone can read to render UI)
CREATE POLICY "Anyone can read modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Anyone can read presets" ON public.ui_presets FOR SELECT USING (true);

-- Users manage their own preferences
CREATE POLICY "Users can read own prefs" ON public.user_module_prefs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prefs" ON public.user_module_prefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prefs" ON public.user_module_prefs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prefs" ON public.user_module_prefs
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: 20 initial modules
-- =====================================================

INSERT INTO public.modules (key, name_zh, name_en, category, icon, description_zh, description_en, enabled, min_plan, default_visible, sort_order)
VALUES
  -- Core (always on)
  ('dashboard',          '首页',       'Dashboard',          'core',      'LayoutDashboard', '消费总览和快捷入口',    'Overview and quick access',     true, 'free', true, 10),
  ('transactions',       '交易记录',    'Transactions',       'core',      'Receipt',         '所有收支记录',          'All income and expense records', true, 'free', true, 20),
  ('cards',              '信用卡',     'Credit Cards',        'cards',     'CreditCard',      '信用卡管理和返现跟踪',   'Card management and cashback',   true, 'free', true, 30),

  -- Analytics (mix free + premium)
  ('analytics_overview', '分析-总览',   'Analytics - Overview', 'analytics','LayoutDashboard', '月度收支总览',         'Monthly summary',                true, 'free',    true, 41),
  ('analytics_expense',  '分析-支出',   'Analytics - Expense',  'analytics','TrendingDown',    '支出分类分析',         'Expense category breakdown',     true, 'free',    true, 42),
  ('analytics_income',   '分析-收入',   'Analytics - Income',   'analytics','TrendingUp',      '收入来源分析',         'Income source analysis',         true, 'free',    true, 43),
  ('analytics_cashback', '分析-返现',   'Analytics - Cashback', 'analytics','Gift',            '返现效率和排名',       'Cashback efficiency',            true, 'premium', true, 44),
  ('analytics_merchant', '分析-商户',   'Analytics - Merchant', 'analytics','Store',           '热门消费商户',         'Top merchants',                  true, 'premium', true, 45),

  -- High-risk modules (DEFAULT DISABLED for compliance)
  ('analytics_investment','分析-投资',  'Analytics - Investment','analytics','LineChart',      '投资收益分析（合规关闭）','Investment analysis (off)',      false, 'premium', false, 46),
  ('analytics_tax',      '分析-税务',   'Analytics - Tax',      'analytics','Landmark',        '税务减免汇总（合规关闭）','Tax relief (off)',               false, 'premium', false, 47),
  ('budget',             '预算管理',    'Budget',              'advanced',  'PiggyBank',       '月度预算跟踪（合规关闭）','Budget tracking (off)',          false, 'premium', false, 60),
  ('predictions',        '支出预测',    'Predictions',         'advanced',  'Sparkles',        '下月支出预测（合规关闭）','Expense forecast (off)',         false, 'premium', false, 61),
  ('smart_card',         '智能推荐',    'Smart Card',          'advanced',  'Wand',            '信用卡推荐（合规关闭）', 'Card recommendations (off)',     false, 'premium', false, 62),

  -- Cashback and recurring
  ('cashback_tracking',  '返现跟踪',    'Cashback Tracking',   'cards',     'Gift',            '各卡返现进度',         'Per-card cashback progress',     true, 'free', true, 50),
  ('recurring',          '定期交易',    'Recurring',           'advanced',  'RefreshCw',       '订阅和定期账单',       'Subscriptions and recurring',    true, 'free', true, 55),

  -- Import
  ('import_pdf',         'PDF 导入',    'PDF Import',          'import',    'FileText',        '银行账单 PDF 导入',     'Bank statement PDF import',      true, 'free', true, 70),
  ('import_image',       '截图导入',    'Image Import',        'import',    'Image',           '收据和截图 OCR 导入',   'Receipt/screenshot OCR',         true, 'free', true, 71),
  ('import_csv',         'CSV 导入',    'CSV Import',          'import',    'FileSpreadsheet', 'CSV 文件导入',         'CSV file import',                true, 'free', true, 72),

  -- Sync & Export
  ('cloud_sync',         '云同步',     'Cloud Sync',          'sync',      'Cloud',           '多设备数据同步',       'Multi-device sync',              true, 'free',    true, 80),
  ('export_csv',         '数据导出',    'Data Export',         'sync',      'Download',        '导出交易记录',         'Export transaction data',        true, 'premium', true, 81)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SEED DATA: 4 UI presets
-- =====================================================

INSERT INTO public.ui_presets (key, name_zh, name_en, description_zh, description_en, icon, modules, sort_order)
VALUES
  ('minimal', '简洁记账', 'Simple Bookkeeping',
    '只显示基础记账功能，适合入门用户', 'Basic tracking only, for beginners',
    'Notebook',
    ARRAY['dashboard','transactions','analytics_overview','analytics_expense','analytics_income','import_pdf','import_image','import_csv','cloud_sync'],
    10),

  ('cards', '信用卡管家', 'Card Manager',
    '专注信用卡和返现管理', 'Focus on cards and cashback',
    'CreditCard',
    ARRAY['dashboard','transactions','cards','cashback_tracking','recurring','analytics_overview','analytics_cashback','import_pdf','import_image','cloud_sync'],
    20),

  ('analytics', '消费分析', 'Spending Analytics',
    '详细的消费数据分析', 'Detailed spending insights',
    'BarChart3',
    ARRAY['dashboard','transactions','analytics_overview','analytics_expense','analytics_income','analytics_merchant','import_pdf','import_image','import_csv','cloud_sync'],
    30),

  ('full', '完整模式', 'Full Mode',
    '显示所有启用的功能', 'All enabled features',
    'Grid3x3',
    ARRAY[]::TEXT[],  -- Empty = all enabled modules
    40)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- Auto-update timestamps
-- =====================================================
DROP TRIGGER IF EXISTS modules_updated_at ON public.modules;
CREATE TRIGGER modules_updated_at BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS user_module_prefs_updated_at ON public.user_module_prefs;
CREATE TRIGGER user_module_prefs_updated_at BEFORE UPDATE ON public.user_module_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- Verify installation
-- =====================================================
SELECT COUNT(*) as module_count FROM public.modules;
SELECT COUNT(*) as preset_count FROM public.ui_presets;
