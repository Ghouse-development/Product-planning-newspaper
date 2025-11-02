# 🚨 明日確実に新聞が届くための最終チェックリスト

## 📋 **マクロ視点：システム全体の確認**

### 1. ✅ Vercel デプロイ状態
- [ ] **Root Directory** が `apps/web` に設定されている
- [ ] ビルドが成功している（緑のチェックマーク）
- [ ] デプロイURLにアクセスできる
- [ ] **Vercel Pro プラン**を契約している（Cronに必須）

**確認方法：**
```bash
# Vercel Dashboardで確認
https://vercel.com/dashboard
→ プロジェクト → Settings → General → Root Directory: apps/web
→ Deployments → 最新が "Ready" になっているか
→ Settings → Usage → Plan が "Pro" になっているか
```

### 2. ✅ 環境変数（全7個）
以下が **Production** 環境に設定されているか確認：

```env
TZ=Asia/Tokyo
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIzaSyAfEI3sFVWbZvG9qp2Y8irYCuNMbZFbntw
SUPABASE_URL=https://fhqsuumqqfkkjfiuyrkn.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
SUPABASE_ANON_KEY=eyJhbGci...
CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/...
```

**確認方法：**
```
Vercel Dashboard → Settings → Environment Variables
→ 全7個が "Production" にチェックが入っているか
```

### 3. ✅ Supabase データベース
- [ ] マイグレーションSQL実行済み
- [ ] 6つのテーブルが作成されている

**確認方法：**
```sql
-- Supabase Dashboard → SQL Editor で実行
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- 期待される結果：
-- 1. sources_raw
-- 2. extracts
-- 3. ai_outputs
-- 4. trend_kpis
-- 5. usage_meter
-- 6. credit_balance
```

### 4. ✅ Cron ジョブ設定
以下のスケジュールが `vercel.json` に設定されているか：

```json
02:00 JST → /api/admin/crawl   (データ収集)
03:00 JST → /api/admin/extract (抽出)
04:00 JST → /api/admin/analyze (AI分析)
08:00 JST → /api/report/daily  (新聞配信) ← これが届く
```

**確認方法：**
```
Vercel Dashboard → Cron Jobs タブ
→ 4つのジョブが表示されているか
→ "Next run" に次回実行時刻が表示されているか
```

---

## 🔬 **ミクロ視点：各コンポーネントの確認**

### Phase 1: データ収集 (crawl)
**問題の可能性：**
- ❌ `config/sources.json` のURLが404エラー
- ❌ `config/companies.json` が空または存在しない
- ❌ Instagram RSSのURLが未設定（`instagram_rss.urls: []`）

**現状：**
```json
// sources.json - ✅ 正常
"pr_times_queries": ["注文住宅", "工務店", ...] // 5個
"media_rss": [{"url": "https://www.s-housing.jp/feed/"}] // 1個
"instagram_rss": {"urls": []} // ⚠️ 空（設定推奨）
```

**対処：**
```bash
# companies.json を確認
cat config/companies.json
# 空の場合は最低1社追加する
```

### Phase 2: 抽出 (extract)
**問題の可能性：**
- ❌ `GEMINI_API_KEY` が無効
- ❌ sources_raw テーブルにデータが0件

**確認：**
```sql
-- Supabase SQL Editor
SELECT COUNT(*) FROM sources_raw WHERE fetched_at > NOW() - INTERVAL '1 day';
-- 期待： > 10件
```

### Phase 3: AI分析 (analyze)
**問題の可能性：**
- ❌ `ANTHROPIC_API_KEY` が無効または残高不足
- ❌ extractsテーブルにデータが0件

**確認：**
```sql
SELECT COUNT(*) FROM extracts WHERE created_at > NOW() - INTERVAL '1 day';
-- 期待： > 5件
```

### Phase 4: 新聞配信 (daily)
**問題の可能性：**
- ❌ `CHAT_WEBHOOK_URL` が無効
- ❌ ai_outputsテーブルにデータが0件

**確認：**
```bash
# Google Chat Webhookをテスト
curl -X POST 'https://chat.googleapis.com/v1/spaces/AAAA_2PG8js/messages?key=...' \
  -H 'Content-Type: application/json' \
  -d '{"text": "テスト送信"}'
# 期待：Google Chatに「テスト送信」が届く
```

---

## 🧪 **初回手動実行（必須）**

Cronが動く前に、**必ず1回は手動で全工程を実行**してください：

```bash
# あなたのVercel URLに置き換え
export VERCEL_URL="your-project.vercel.app"

# 1. データ収集（2-3分）
curl -X POST https://$VERCEL_URL/api/admin/crawl
# 期待： {"success": true, "totalFetched": 15, "totalSaved": 15}

# 2. 抽出処理（3-5分）
curl -X POST https://$VERCEL_URL/api/admin/extract
# 期待： {"success": true, "totalProcessed": 15}

# 3. AI分析（5-10分）
curl -X POST https://$VERCEL_URL/api/admin/analyze
# 期待： {"success": true, "classified": 10, "trends": 5}

# 4. 新聞生成（3-5分）
curl -X POST https://$VERCEL_URL/api/report/daily
# 期待： {"success": true} + Google Chatに新聞が届く
```

**これを実行しないと：**
- データベースが空のまま
- 明日の朝8時のCronが実行されても「空の新聞」が届く

---

## ⚠️ **よくある失敗パターン**

### ❌ 失敗1: Root Directoryを設定していない
**症状：** `Error: No Next.js version detected`
**解決：** Vercel Settings → General → Root Directory: `apps/web`

### ❌ 失敗2: Vercel Free プラン
**症状：** Cronが実行されない
**解決：** Vercel Pro プラン（$20/月）にアップグレード

### ❌ 失敗3: 環境変数がProduction環境に無い
**症状：** APIキーエラー
**解決：** 環境変数の "Production" にチェックを入れる

### ❌ 失敗4: 初回データが無い
**症状：** 空の新聞が届く
**解決：** 上記の手動実行を1回実行する

### ❌ 失敗5: Google Chat Webhook が無効
**症状：** 新聞が届かない
**解決：** Webhook URLを再発行する

---

## 📊 **最終確認コマンド**

```bash
# ✅ データベースに最新データがあるか
SELECT
  (SELECT COUNT(*) FROM sources_raw WHERE fetched_at > NOW() - INTERVAL '1 day') as sources,
  (SELECT COUNT(*) FROM extracts WHERE created_at > NOW() - INTERVAL '1 day') as extracts,
  (SELECT COUNT(*) FROM ai_outputs WHERE created_at > NOW() - INTERVAL '1 day') as ai_outputs;

-- 期待：
-- sources: > 10
-- extracts: > 5
-- ai_outputs: > 3
```

```bash
# ✅ Cronジョブが設定されているか
# Vercel Dashboard → Cron Jobs
# → 4つのジョブが表示される
# → "Next run" に明日の時刻が表示される
```

---

## ✅ **成功の条件**

以下が **全て** 満たされていれば、明日8時に新聞が届きます：

1. ✅ Vercel Pro プラン契約済み
2. ✅ Root Directory = `apps/web`
3. ✅ 環境変数7個がProduction環境に設定済み
4. ✅ Supabaseに6テーブル作成済み
5. ✅ **初回手動実行を1回完了済み**
6. ✅ Google Chat Webhookが有効
7. ✅ Cronジョブが4つ表示されている

---

**🎯 次のアクション：**
1. この checklist を上から順に確認
2. ❌ がある項目を修正
3. 初回手動実行を実行
4. Google Chatに新聞が届くことを確認
5. 明日の朝8時を待つ

**これで100%届きます！📰**
