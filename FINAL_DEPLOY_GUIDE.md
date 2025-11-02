# 最終デプロイガイド

## ✅ 前提条件チェック

- [x] Supabase SQLスキーマ実行済み
- [x] Vercel環境変数設定済み（6つ）
- [x] すべての重大なバグ修正済み
- [x] GitHubリポジトリ準備済み

---

## 🚀 デプロイ手順（3分）

### ステップ1: Vercel Dashboard設定

https://vercel.com/ghouse-developments-projects/product-planning-newspaper

**Settings → Build & Development Settings**:

```
Framework Preset: Next.js

Root Directory: (空欄)

Build Command: npm install -g pnpm@8 && pnpm install && pnpm run vercel-build

Install Command: npm install -g pnpm@8 && pnpm install

Output Directory: apps/web/.next

Node.js Version: 18.x
```

### ステップ2: 変更をプッシュ

```bash
cd "C:\claudecode\Product planning newspaper"
git add .
git commit -m "Fix all critical issues and prepare for deployment"
git push origin main
```

### ステップ3: Vercelが自動デプロイ

- GitHubプッシュ後、Vercelが自動的にビルド開始
- 約5〜10分でデプロイ完了

---

## 🧪 デプロイ確認（5分）

デプロイ完了後、以下を順番に実行：

### 1. ヘルスチェック

```bash
curl https://product-planning-newspaper.vercel.app/api/health
```

**成功**: `"status": "healthy"`

### 2. テスト

```bash
curl https://product-planning-newspaper.vercel.app/api/test
```

**成功**: `"message": "API is working!"`

### 3. データ収集

```bash
curl https://product-planning-newspaper.vercel.app/api/admin/crawl
```

**成功**: `"success": true`, `totalFetched > 0`

**所要時間**: 1〜2分

### 4. 抽出

```bash
curl https://product-planning-newspaper.vercel.app/api/admin/extract
```

**成功**: `"success": true`, `totalProcessed > 0`

**所要時間**: 1〜2分

### 5. 分析

```bash
curl https://product-planning-newspaper.vercel.app/api/admin/analyze
```

**成功**: `"success": true`, `totalAnalyzed > 0`

**所要時間**: 2〜3分（Claude API呼び出し）

### 6. 新聞生成

```bash
curl https://product-planning-newspaper.vercel.app/api/report/daily
```

**成功**:
- `"success": true`
- **Google Chatに新聞が届く**
- メトリクス表示

**所要時間**: 1〜2分

---

## ✅ 動作確認

### ブラウザでアクセス

```
https://product-planning-newspaper.vercel.app
```

- ホーム画面が表示される
- ダッシュボードでコストメトリクスが表示される
- 新聞ページで生成された新聞が表示される

---

## ⏰ 自動運用開始

翌日から以下のスケジュールで自動実行：

- **02:00 JST**: データ収集
- **03:00 JST**: 抽出
- **04:00 JST**: 分析
- **08:00 JST**: 新聞生成・配信
- **23:00 JST (日)**: 週報

---

## 🔧 トラブルシューティング

### ビルドが失敗する

**エラー**: `No Next.js version detected`

**解決策**:
1. Build Commandに `npm install -g pnpm@8` が含まれているか確認
2. Root Directoryが空欄（ルート）になっているか確認

### API呼び出しで500エラー

**エラー**: Internal Server Error

**解決策**:
1. `/api/health` でヘルスチェック
2. Vercel Dashboard → Deployments → Functions → Logs でエラー確認
3. 環境変数が正しく設定されているか確認

### データベース接続エラー

**エラー**: `database.connected: false`

**解決策**:
1. Supabase Dashboard → Settings → API でURLとキーを確認
2. `SUPABASE_SERVICE_KEY` が正しく設定されているか確認
3. RLSポリシーが正しいか確認

### Google Chatに届かない

**エラー**: 新聞が届かない

**解決策**:
1. `CHAT_WEBHOOK_URL` が正しいか確認
2. Google Chat → Space Settings → Webhooks で確認
3. 手動でテスト：
```bash
curl -X POST $CHAT_WEBHOOK_URL -H 'Content-Type: application/json' -d '{"text":"Test"}'
```

---

## 📊 運用監視

### Vercel Dashboard

- **Deployments**: ビルド履歴
- **Functions**: 実行ログ
- **Analytics**: アクセス状況

### Supabase Dashboard

- **Table Editor**: データ確認
- **Logs**: クエリログ

### Google Chat

- 毎朝8時に新聞が届く
- コスト情報が自動表示

---

## 💰 コスト管理

### ダッシュボードで確認

```
https://product-planning-newspaper.vercel.app/dashboard
```

- 今日の使用
- 直近7日平均
- 残高
- **あと何回使えるか**（自動計算）
- 今月累計

### 残高更新（手動）

```sql
INSERT INTO credit_balance (provider, balance_usd)
VALUES ('anthropic', 10.00);  -- 新しい残高
```

週1回程度、Anthropic Dashboard で残高を確認して更新。

---

## 🎉 完了！

**これで完全に自動運用が開始されます。**

明日の朝8時、Google Chatに新聞が届くのをお楽しみに！

---

**最終更新**: 2025年11月2日 20:30
