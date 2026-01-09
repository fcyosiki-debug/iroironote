-- グループボックス用テーブル
-- 共有ワークスペースでグループをリアルタイム共有するために必要

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  x REAL NOT NULL DEFAULT 100,
  y REAL NOT NULL DEFAULT 100,
  width REAL NOT NULL DEFAULT 300,
  height REAL NOT NULL DEFAULT 200,
  color TEXT NOT NULL DEFAULT 'blue',
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_groups_workspace ON groups(workspace_id);

-- RLSを無効化
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;

-- リアルタイム有効化
-- Supabaseダッシュボードの Database > Publications で
-- groups テーブルを supabase_realtime に追加してください
