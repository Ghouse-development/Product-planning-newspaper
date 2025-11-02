# クイックスタートガイド

## 🚀 3ステップでデプロイ

### ステップ1: Supabaseセットアップ（5分）

1. [Supabase Dashboard](https://supabase.com/dashboard/project/fhqsuumqqfkkjfiuyrkn) にアクセス
2. SQL Editorを開く
3. `supabase/migrations/001_initial_schema.sql` の内容をコピー＆実行
4. 成功確認（6つのテーブルが作成される）

### ステップ2: Vercelデプロイ（10分）

1. [Vercel Dashboard](https://vercel.com/new) で新規プロジェクト作成
2. GitHubリポジトリを連携: `Ghouse-development/Product-planning-newspaper`
3. 設定：
   - Framework: **Next.js**
   - Root Directory: **apps/web**
   - Build Command: **pnpm build**
   - Install Command: **pnpm install**

4. 環境変数を追加（Settings → Environment Variables）：

```
TZ=Asia/Tokyo
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
CHAT_WEBHOOK_URL=your_google_chat_webhook_url
```

5. **Deploy** をクリック

### ステップ3: 動作確認（5分）

デプロイ完了後（約3分）：

```bash
# あなたのVercel URLに置き換えてください
export VERCEL_URL="your-project.vercel.app"

# 1. データ収集
curl -X POST https://$VERCEL_URL/api/admin/crawl

# 2. 抽出処理
curl -X POST https://$VERCEL_URL/api/admin/extract

# 3. AI分析
curl -X POST https://$VERCEL_URL/api/admin/analyze

# 4. 新聞生成
curl -X POST https://$VERCEL_URL/api/report/daily
```

成功すると、Google Chatに新聞が届きます！

## 📊 ダッシュボードで確認

1. ブラウザで `https://your-project.vercel.app` を開く
2. **📊 ダッシュボード** をクリック
3. APIコスト・使用状況を確認

## ⏰ 自動運用開始

翌日から自動でCronが実行されます：

- **02:00** データ収集
- **03:00** 抽出
- **04:00** 分析
- **08:00** 新聞配信 → Google Chatに届く

## 🔧 よくある質問

### Q: Cronが動かない
A: Vercel Proプランが必要です。Dashboardで確認してください。

### Q: 新聞が空
A: 初回は手動で上記のCURLコマンドを順番に実行してください。

### Q: コストが心配
A: ダッシュボードで「あと何回使えるか」が表示されます。1回約$0.10〜0.50です。

### Q: Instagram RSSの設定方法
A: [rss.app](https://rss.app) でハッシュタグのRSSを作成し、`config/sources.json`に追加してください。

## 📞 サポート

問題が発生した場合：

1. `DEPLOYMENT.md` のトラブルシューティングを確認
2. Vercel Dashboard → Functions → Logs でエラーログを確認
3. GitHubのIssuesで報告

---

**これで完了です！明日の朝8時、新聞をお楽しみに！📰**
