-- ==========================================
-- PLOW Dashboard - Supabase データベース構築SQL
-- このSQLをまるごとコピーして、Supabaseの「SQL Editor」で実行してください
-- ==========================================

-- 1. schools (学校マスタ)
CREATE TABLE schools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,  -- 'elementary' | 'junior_high' | 'high_school'
    memo text,
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- 2. events (イベント・カレンダー対応)
CREATE TABLE events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text NOT NULL,  -- 'test' | 'event' | 'holiday' | 'plow_event'
    date_start date NOT NULL,
    date_end date,
    is_confirmed boolean DEFAULT true,
    memo text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. lots (配布ロット)
CREATE TABLE lots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_code text NOT NULL,
    batch_code text,
    distributed_date date NOT NULL,
    location text NOT NULL,
    distributed_count integer NOT NULL,
    memo text,
    answer_box_count integer,
    line_register_count integer,
    visit_count integer,
    visit_memo text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 今回はRLS (行レベルセキュリティ) はオフ（パブリックアクセス）にするので
-- 下記のコマンドで明示的にオフにしておきます。
-- RLSは「認証がないと読めない」仕組みですが、今回は認証なしの個人利用アプリのため。
-- ==========================================
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE lots DISABLE ROW LEVEL SECURITY;
