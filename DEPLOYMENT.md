# デプロイガイド

## 🚀 Vercelへのデプロイ手順

### 1. GitHubリポジトリの準備

既に作成済み：`https://github.com/Ghouse-development/Product-planning-newspaper.git`

### 2. Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. "Add New Project" をクリック
3. GitHubリポジトリを選択
4. Framework Preset: **Next.js** を選択
5. Root Directory: `apps/web` を設定
6. Build Command: `pnpm build`
7. Output Directory: `.next`
8. Install Command: `pnpm install`

### 3. 環境変数の設定

Vercel Dashboard → Project → Settings → Environment Variables

以下の環境変数を**すべて**追加：

```
TZ=Asia/Tokyo
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
CHAT_WEBHOOK_URL=your_google_chat_webhook_url
```

### 4. リージョン設定の確認

`vercel.json` でリージョンが `hnd1`（東京）に設定されていることを確認：

```json
{
  "regions": ["hnd1"]
}
```

### 5. Supabaseのセットアップ

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクト: `https://fhqsuumqqfkkjfiuyrkn.supabase.co` を開く
3. SQL Editor で以下を実行：

```sql
-- supabase/migrations/001_initial_schema.sql の内容を実行
```

4. 初期残高を設定：

```sql
INSERT INTO credit_balance (provider, balance_usd)
VALUES ('anthropic', 5.00)
ON CONFLICT DO NOTHING;
```

### 6. デプロイ実行

```bash
# Vercel CLIでデプロイ
cd Product-planning-newspaper
vercel --prod
```

または、GitHubにプッシュすると自動デプロイ：

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### 7. Cron設定の有効化

Vercel Proプランで自動的に有効化されます。

確認方法：
- Vercel Dashboard → Project → Settings → Cron Jobs
- 5つのCronジョブが表示されているはず

### 8. 動作確認

#### 手動でCronを実行

```bash
# Crawl実行
curl -X POST https://your-project.vercel.app/api/admin/crawl

# Extract実行
curl -X POST https://your-project.vercel.app/api/admin/extract

# Analyze実行
curl -X POST https://your-project.vercel.app/api/admin/analyze

# Daily Report実行
curl -X POST https://your-project.vercel.app/api/admin/report/daily
```

#### ダッシュボードで確認

1. `https://your-project.vercel.app/dashboard` にアクセス
2. コストメトリクスが表示されることを確認

## 📊 運用開始

### 初回実行

1. まず手動でCrawlを実行してデータを収集
2. Extractで抽出処理
3. Analyzeで分析
4. Daily Reportで新聞生成

### 自動運用

翌日から以下のスケジュールで自動実行：

- **02:00 JST**: データ収集
- **03:00 JST**: 抽出処理
- **04:00 JST**: AI分析
- **08:00 JST**: 新聞生成＆配信
- **23:00 JST (日曜)**: 週報

## 🔧 トラブルシューティング

### Cronが実行されない

- Vercel Proプランか確認
- `vercel.json` がルートディレクトリにあるか確認
- Vercel Dashboard → Deployments → Functions で実行ログを確認

### APIエラーが出る

- 環境変数が正しく設定されているか確認
- Supabaseのテーブルが作成されているか確認
- APIキーが有効か確認

### データが収集できない

- ネットワークアクセスを確認
- PR TIMESやRSSフィードのURLが正しいか確認
- レート制限に引っかかっていないか確認

## 📈 モニタリング

### Vercel Analytics

- Vercel Dashboard → Analytics でアクセス状況を確認

### Supabase Logs

- Supabase Dashboard → Logs でクエリログを確認

### APIコスト

- `/dashboard` ページで日次・月次コストを確認
- `credit_balance` テーブルを週1で更新

## 🔄 アップデート手順

```bash
# ローカルで変更
git pull
# ... 変更作業 ...
git add .
git commit -m "Update: ..."
git push origin main

# Vercelが自動デプロイ（約2〜3分）
```

---

**デプロイ完了後は、Google Chatに毎朝8時に新聞が届きます！**
