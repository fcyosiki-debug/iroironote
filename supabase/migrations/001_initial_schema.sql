-- Iroirolonote シンプルスキーマ（外部キー制約なし）
-- 実行環境: Supabase
-- これを必ずSupabaseのSQLエディタで実行してください

-- 既存テーブルを削除
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS submission_boxes CASCADE;
DROP TABLE IF EXISTS card_connections CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ユーザーテーブル（外部キー制約なし）
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  role TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ワークスペーステーブル（外部キー制約なし）
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  owner_id TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- カードテーブル（外部キー制約なし）
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  creator_id TEXT NOT NULL,
  creator_nickname TEXT NOT NULL,
  card_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  width REAL NOT NULL DEFAULT 200,
  height REAL NOT NULL DEFAULT 150,
  color TEXT NOT NULL DEFAULT 'yellow',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- カード接続テーブル
CREATE TABLE card_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_card_id UUID NOT NULL,
  to_card_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 提出ボックステーブル（外部キー制約なし）
CREATE TABLE submission_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  is_public_view BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 提出テーブル（外部キー制約なし）
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL,
  card_id UUID NOT NULL,
  student_id TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_cards_workspace ON cards(workspace_id);
CREATE INDEX idx_cards_creator ON cards(creator_id);
CREATE INDEX idx_submissions_box ON submissions(box_id);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_type ON workspaces(type);

-- RLSを無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE card_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE submission_boxes DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- リアルタイム有効化（エラーが出ても無視してOK）
-- ALTER PUBLICATION supabase_realtime ADD TABLE cards;
-- ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
