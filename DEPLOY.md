# Iroirolonote デプロイ手順書

このアプリケーションをインターネット上に公開するための手順です。
Next.jsを使用しているため、**Vercel**へのデプロイが最も推奨されます。

## 前提条件

1. **GitHubアカウント** を持っていること
2. **Vercelアカウント** を持っていること（GitHubでログイン可能）
3. **Supabaseプロジェクト** が作成済みであること

---

## 手順 1: GitHubへのプッシュ

現在のコードをGitHubリポジトリにアップロードします。

1. GitHubで新しいリポジトリを作成
2. 以下のコマンドを実行してコードをプッシュ（ターミナルで実行）

```bash
# gitが初期化されていない場合
git init

# 全ファイルをステージング
git add .

# コミット
git commit -m "Initial commit for deployment"

# リモートリポジトリを追加（URLは自分のものに置き換えてください）
git remote add origin https://github.com/YOUR_USERNAME/iroirolonote.git

# プッシュ
git branch -M main
git push -u origin main
```

---

## 手順 2: Vercelへのデプロイ

1. [Vercelダッシュボード](https://vercel.com/dashboard) にアクセス
2. **"Add New..."** -> **"Project"** をクリック
3. GitHubリポジトリ `iroirolonote` を選択して **"Import"** をクリック
4. **Environment Variables** (環境変数) の設定セクションを開き、以下の値を設定します：

| Key | Value | 説明 |
|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yebhxvyhanjwmgzjevsq.supabase.co` | SupabaseのプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsIn...` | `src/lib/supabase.ts` または `.env.local` からコピーしてください |

5. **"Deploy"** をクリック

---

## 手順 3: Supabaseのセキュリティ設定（重要）

現在、本番環境で安全に動作させるために、いくつか設定を確認する必要があります。

### 1. サイトURLの設定
Supabaseダッシュボードの **Authentication -> URL Configuration** で、Vercelで発行されたURL（例: `https://iroirolonote.vercel.app`）を **Site URL** に設定し、**Redirect URLs** にも追加してください。

### 2. データベースのポリシー (RLS)
開発中はRLS（Row Level Security）を無効にしていましたが、本番環境では有効にすることを強く推奨します。

以下のSQLをSupabaseの **SQL Editor** で実行して、最低限のセキュリティを設定できます：

```sql
-- create_policy.sql

-- RLSを有効化
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- 全員に読み書きを許可（簡易的な設定）
-- 本来は認証済みユーザーのみに制限すべきですが、現在のローカル認証の仕様に合わせます
CREATE POLICY "Enable all access for all users" ON "cards"
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for all users" ON "card_connections"
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for all users" ON "workspaces"
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

---

## 完了

デプロイが完了すると、VercelからURLが発行されます。そのURLにアクセスすれば、誰でもアプリを利用できるようになります！
