# Vercel デプロイ手順（モノレポ対応）

## 環境変数設定 ✅ 完了

以下の環境変数が設定済みです：

- ✅ ANTHROPIC_API_KEY
- ✅ GEMINI_API_KEY
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_KEY
- ✅ SUPABASE_ANON_KEY
- ✅ CHAT_WEBHOOK_URL

## Vercel Web UIでの設定（必須）

### 1. Vercel Dashboard でプロジェクトを開く

https://vercel.com/ghouse-developments-projects/web

### 2. Settings → General → Build & Development Settings

以下を設定：

#### Root Directory
```
（空欄のまま - ルートディレクトリを使用）
```

#### Framework Preset
```
Next.js
```

#### Build Command
```
cd apps/web && npx pnpm install && npx pnpm build
```

または

```
npm install -g pnpm@8 && pnpm install && pnpm build --filter=@ghouse/web
```

#### Install Command
```
npm install -g pnpm@8 && pnpm install
```

#### Output Directory
```
apps/web/.next
```

### 3. Save をクリック

### 4. Deployments → Redeploy

最新のデプロイメントを選択して "Redeploy" をクリック

---

## または：GitHubから自動デプロイ

### 1. 変更をGitHubにプッシュ

```bash
cd "C:\claudecode\Product planning newspaper"
git add .
git commit -m "Configure Vercel for monorepo deployment"
git push origin main
```

### 2. Vercelが自動デプロイ

GitHub連携済みの場合、プッシュすると自動でデプロイが開始されます。

---

## 動作確認

デプロイ完了後（約5〜10分）：

```bash
# Vercel URLを取得
cd apps/web
vercel ls

# 手動でCron実行してテスト
curl -X POST https://your-project.vercel.app/api/admin/crawl
curl -X POST https://your-project.vercel.app/api/admin/extract
curl -X POST https://your-project.vercel.app/api/admin/analyze
curl -X POST https://your-project.vercel.app/api/report/daily
```

成功すると Google Chat に新聞が届きます！

---

## トラブルシューティング

### ビルドエラーが出る場合

1. Vercel Dashboard → Deployments → 最新のデプロイ → View Function Logs
2. エラーメッセージを確認
3. Root Directory設定を確認（空欄であることを確認）
4. Build Commandにpnpmインストールが含まれているか確認

### 環境変数が読み込まれない場合

```bash
cd apps/web
vercel env pull .env.local
```

で環境変数を確認できます。

---

**次のステップ**: Vercel Dashboard で上記の設定を行い、再デプロイしてください！
