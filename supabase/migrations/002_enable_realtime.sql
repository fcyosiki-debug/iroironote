-- リアルタイム有効化
-- Supabaseダッシュボードからも設定可能ですが、SQLでも設定できます

-- リアルタイムを有効にするテーブルを追加
-- ※ Supabaseでは「supabase_realtime」パブリケーションにテーブルを追加する必要があります

-- 方法1: Supabaseダッシュボードから設定
-- 1. Supabaseダッシュボードにログイン
-- 2. Database → Replication に移動
-- 3. 「Source」で「supabase_realtime」を選択
-- 4. submissions と submission_boxes テーブルにチェックを入れる

-- 方法2: SQLで設定（以下のコマンドをSupabase SQLエディタで実行）
-- ※ エラーが出る場合は、テーブルが既にパブリケーションに追加されている可能性があります

ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE submission_boxes;
ALTER PUBLICATION supabase_realtime ADD TABLE cards;
