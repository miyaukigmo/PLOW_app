-- ==========================================
-- PLOW Dashboard - カテゴリ追加用SQL
-- このSQLをまるごとコピーして、Supabaseの「SQL Editor」で実行してください
-- ==========================================

CREATE TABLE event_categories (
    id text PRIMARY KEY,
    name text NOT NULL,
    color text NOT NULL,
    is_holiday boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS（行レベルセキュリティ）をオフにする
ALTER TABLE event_categories DISABLE ROW LEVEL SECURITY;

-- デフォルトの4カテゴリを登録
INSERT INTO event_categories (id, name, color, is_holiday, sort_order) VALUES
('test', 'テスト', '#ef4444', false, 1),
('event', '行事', '#3b82f6', false, 2),
('holiday', '休日', '#ef4444', true, 3),
('plow_event', 'PLOW支給', '#10b981', false, 4);

-- 注：既存の events テーブルの category カラムはそのまま text として利用し、
-- event_categoriesのidとプログラム上で付き合わせます。
