# 📚 環境変数セットアップガイド

このガイドでは、アプリを動かすために必要な環境変数の設定方法を詳しく説明します。

---

## 🎯 必要なもの

以下の4つのAPIキー/サービスが必要です：

1. ✅ Anthropic (Claude) APIキー
2. ✅ Google (Gemini) APIキー
3. ✅ Supabaseプロジェクト（URL + 2つのキー）
4. ✅ Google Chat Webhook URL

---

## 📝 設定手順

### ステップ1: Anthropic APIキーの取得

1. https://console.anthropic.com/ にアクセス
2. アカウント作成またはログイン
3. 左メニューから **「API Keys」** を選択
4. **「Create Key」** ボタンをクリック
5. 名前を入力（例: `G-HOUSE Trend AI`）して作成
6. 表示されたキーをコピー（`sk-ant-api03-` で始まる長い文字列）
   - ⚠️ **重要**: このキーは一度しか表示されません。必ずコピーしてください
7. コピーしたキーを `apps/web/.env.local` の `ANTHROPIC_API_KEY=` の右に貼り付け

**料金について:**
- 新規アカウントには $5 の無料クレジットがあります
- 1回の新聞生成で約 $0.10〜0.30 使用

---

### ステップ2: Gemini APIキーの取得

1. https://aistudio.google.com/app/apikey にアクセス
2. Googleアカウントでログイン
3. **「Create API Key」** をクリック
4. プロジェクトを選択（または新規作成）
5. 表示されたキーをコピー（`AIzaSy` で始まる文字列）
6. コピーしたキーを `apps/web/.env.local` の `GEMINI_API_KEY=` の右に貼り付け

**料金について:**
- 無料枠: 月間60リクエスト/分
- このアプリでは画像抽出にのみ使用（月数回程度）

---

### ステップ3: Supabaseプロジェクトのセットアップ

#### 3-1. プロジェクト作成（未作成の場合）

1. https://supabase.com/dashboard にアクセス
2. **「New Project」** をクリック
3. 以下を入力：
   - **Name**: `ghouse-trend-ai`（任意）
   - **Database Password**: 強力なパスワードを設定（保存しておく）
   - **Region**: `Tokyo (ap-northeast-1)` を推奨
4. **「Create new project」** をクリック（2-3分待つ）

#### 3-2. APIキーの取得

プロジェクトが作成されたら：

1. 左メニューから **「Settings」** → **「API」** を選択
2. 以下の3つをコピー：

   **① Project URL**
   ```
   例: https://abcdefghijk.supabase.co
   ```
   → `apps/web/.env.local` の `SUPABASE_URL=` に貼り付け

   **② anon public (公開キー)**
   ```
   例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...（長い文字列）
   ```
   → `SUPABASE_ANON_KEY=` に貼り付け

   **③ service_role (サービスロールキー)**
   - ⚠️ **重要**: 「Reveal」ボタンを押して表示
   ```
   例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...（長い文字列）
   ```
   → `SUPABASE_SERVICE_KEY=` に貼り付け

#### 3-3. データベースのマイグレーション実行

データベースのテーブルを作成します：

1. Supabase Dashboard で **「SQL Editor」** を開く
2. **「New query」** をクリック
3. 以下のファイルの内容をコピー:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. SQL Editorに貼り付けて **「Run」** をクリック
5. エラーがなければ成功です

#### 3-4. 初期残高の設定（オプション）

コストダッシュボードを使用するために、初期残高を設定します：

```sql
-- Anthropicの初期残高（$5の場合）
INSERT INTO credit_balance (provider, balance_usd, updated_at)
VALUES ('anthropic', 5.00, NOW());

-- Geminiの初期残高（無料の場合は0）
INSERT INTO credit_balance (provider, balance_usd, updated_at)
VALUES ('gemini', 0.00, NOW());
```

これをSQL Editorで実行してください。

---

### ステップ4: Google Chat Webhookの設定

#### 4-1. Webhookの作成

1. Google Chat を開く（https://chat.google.com/）
2. 通知を受け取りたい**スペース**を選択（またはスペースを新規作成）
3. スペース名の右にある **▼** をクリック
4. **「アプリと統合機能を管理」** を選択
5. **「Webhook」** タブを選択
6. **「新しいwebhookを追加」** をクリック
7. Webhook名を入力（例: `トレンドAI通知`）
8. アバター画像を選択（オプション）
9. **「保存」** をクリック
10. 表示されたURLをコピー
    ```
    例: https://chat.googleapis.com/v1/spaces/AAAAxxxxxxx/messages?key=xxxxx...
    ```
11. コピーしたURLを `apps/web/.env.local` の `CHAT_WEBHOOK_URL=` に貼り付け

#### 4-2. テスト送信（オプション）

Webhookが正しく設定されたか確認：

```bash
curl -X POST "あなたのWebhook URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "🎉 Webhook設定完了！"}'
```

Google Chatスペースにメッセージが届けば成功です。

---

## ✅ 設定完了の確認

すべての環境変数を設定したら、`.env.local` ファイルは以下のようになります：

```env
TZ=Asia/Tokyo

ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...

CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/xxxxx/messages?key=xxxxx
```

---

## 🚀 動作確認

### 1. 開発サーバーの起動

```bash
cd "C:\claudecode\Product planning newspaper"
pnpm dev
```

### 2. ヘルスチェック

ブラウザまたはcurlで以下にアクセス：

```bash
curl http://localhost:3001/api/health
```

**期待される結果:**
```json
{
  "status": "ok",
  "environment": {
    "hasAnthropicKey": true,
    "hasGeminiKey": true,
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    "hasChatWebhook": true
  },
  "database": {
    "connected": true
  }
}
```

すべてが `true` になっていれば設定完了です！

### 3. APIキーのテスト

```bash
curl http://localhost:3001/api/test-keys
```

各APIキーが正しく動作しているか確認できます。

### 4. 手動でデータ収集テスト

```bash
curl -X POST http://localhost:3001/api/admin/crawl
```

数秒〜数十秒でデータが収集されます。

---

## 🐛 トラブルシューティング

### エラー: "API key not set"

- `.env.local` ファイルが正しい場所にあるか確認
- パス: `apps/web/.env.local`
- 環境変数名のスペルミスがないか確認
- 開発サーバーを再起動: `Ctrl+C` → `pnpm dev`

### エラー: "Missing SUPABASE_URL"

- Supabaseの3つの値（URL + 2つのキー）がすべて設定されているか確認
- キーの前後に余分なスペースがないか確認

### エラー: "Database connection failed"

- Supabaseプロジェクトが「Active」状態か確認
- SQL Editorでマイグレーションを実行したか確認
- Supabase Dashboardで「Database」→「Tables」を確認し、テーブルが作成されているか確認

### Google Chatに通知が届かない

- Webhook URLが完全にコピーされているか確認（途中で切れていないか）
- スペースにWebhookアプリが追加されているか確認

---

## 🎉 次のステップ

環境変数の設定が完了したら：

1. **ローカルで動作確認**
   - データ収集: `POST /api/admin/crawl`
   - 抽出処理: `POST /api/admin/extract`
   - AI分析: `POST /api/admin/analyze`
   - 新聞生成: `POST /api/report/daily`

2. **Vercelへのデプロイ**
   - `DEPLOYMENT.md` を参照
   - Vercel Dashboardで同じ環境変数を設定

3. **自動実行の設定**
   - Vercel Cronで自動実行（設定済み）
   - 毎朝8時に新聞が自動配信されます

---

## 📞 サポート

問題が解決しない場合は、以下を確認してください：

- `apps/web/.env.local` ファイルの内容
- `curl http://localhost:3001/api/health` の出力
- 開発サーバーのコンソールログ

---

**最終更新**: 2025年11月7日
