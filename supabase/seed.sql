-- Iroirolonote シードデータ
-- 60アカウント（生徒50人 + 教師10人）を作成

-- 注意: このファイルはSupabase認証と連携するため、
-- 実際のシードはAPIを通じて行う必要があります。
-- 以下はデータベース構造の参考用です。

-- 生徒アカウント (student01 〜 student50)
-- パスワード: password
-- メール: student01@iroirolonote.local 〜 student50@iroirolonote.local

-- 教師アカウント (teacher01 〜 teacher10)
-- パスワード: password
-- メール: teacher01@iroirolonote.local 〜 teacher10@iroirolonote.local

-- サンプルデータ（開発用）
-- 実際のユーザーはログイン時に自動作成されます

-- デモ用の共有ワークスペースを作成（オプション）
-- INSERT INTO workspaces (name, type, is_public)
-- VALUES 
--   ('みんなのアイデアボード', 'shared', true),
--   ('グループワーク1', 'shared', true);

-- デモ用の提出ボックスを作成（オプション）
-- 注意: teacher_idは実際の教師ユーザーIDに置き換える必要があります
-- INSERT INTO submission_boxes (name, teacher_id, is_public_view)
-- VALUES 
--   ('今日の感想', '<teacher_uuid>', false),
--   ('課題提出', '<teacher_uuid>', false);
