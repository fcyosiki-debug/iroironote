# Iroirolonote

みんなで学ぶコラボレーション学習アプリ - LoiLoNote風のリアルタイム教育用キャンバスアプリケーション

## 🌟 機能

### 認証システム
- 事前定義されたアカウント（生徒50人、教師10人）
- ニックネーム設定機能
- ロールベースのアクセス制御

### ワークスペース
- **マイワークスペース**: 個人用のプライベート空間
- **共有ワークスペース**: クラス全体でリアルタイム協働

### カード機能
- 📝 **テキストカード**: マルチカラーのテキスト入力
- ✏️ **手描きカード**: フリーハンドで描画
- 🖼️ **メディアカード**: 画像/PDFのアップロード
- 🔗 **接続線**: カード間を矢印で接続

### リアルタイム機能
- カード位置のリアルタイム同期
- 他ユーザーのカーソル表示
- 提出カウントのリアルタイム更新

### 提出ボックス
- 教師がボックスを作成
- 生徒がカードを提出
- 公開/非公開の切り替え

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. SQLエディタで `supabase/migrations/001_initial_schema.sql` を実行
3. プロジェクト設定からURLとAnon Keyを取得

### 3. 環境変数の設定

`.env.local.example` を `.env.local` にコピーして編集:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリを開きます。

## 👤 テストアカウント

| 種類 | アカウントID | パスワード |
|------|-------------|-----------|
| 生徒 | student01 〜 student50 | password |
| 教師 | teacher01 〜 teacher10 | password |

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React
- **バックエンド**: Supabase (Auth, Database, Realtime, Storage)
- **ドラッグ＆ドロップ**: React Draggable

## 📁 プロジェクト構造

```
iroirolonote/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── login/        # ログインページ
│   │   ├── dashboard/    # ダッシュボード
│   │   ├── workspace/    # ワークスペース
│   │   └── box/          # 提出ボックス
│   ├── components/       # UIコンポーネント
│   │   ├── ui/          # 基本UI（Button, Input, Modal）
│   │   ├── cards/       # カードコンポーネント
│   │   └── canvas/      # キャンバスコンポーネント
│   ├── contexts/        # React Context
│   ├── hooks/           # カスタムフック
│   ├── lib/             # ユーティリティ
│   └── types/           # 型定義
└── supabase/            # データベース設定
```

## 📝 ライセンス

MIT
