# G-HOUSE トレンドAIインサイト

住宅業界のトレンドを自動収集・分析し、日刊新聞形式で配信するシステム

## 🎯 概要

このシステムは、PR TIMES、新建ハウジング、競合他社の公式HP、SNS（Instagram）から情報を自動収集し、AI（Claude + Gemini）で分析して、毎朝8時に新聞形式のレポートを配信します。

### 主な機能

- 📰 **日刊新聞生成**: 業界トレンドを新聞形式で自動作成
- 💬 **SNSトレンド分析**: Instagram等のハッシュタグを監視・分析
- 🧩 **競合差分比較**: 競合他社の動向を比較し、「Gハウスへの影響3点」を提示
- 🚀 **部署別アクション提案**: 営業/設計/広報/商品企画ごとの具体的施策
- 💰 **APIコスト管理**: トークン使用量・残高・残り回数をリアルタイム表示
- ⏰ **自動配信**: 毎朝8時にGoogle ChatへWebリンク付きで配信

## 📊 システム構成

### モノレポ構造

```
.
├── apps/
│   └── web/                  # Next.js App Router (Web + API)
├── packages/
│   ├── core/                 # 共通型・ユーティリティ・ロガー
│   ├── supakit/              # Supabase クライアント & リポジトリ
│   ├── ingest/               # データ収集 (PR TIMES/メディア/企業/SNS)
│   ├── extract/              # Gemini OCR/表抽出
│   ├── ai/                   # Claude/Gemini クライアント & プロンプト
│   └── report/               # 新聞生成・PDF出力・Chat通知
├── config/
│   ├── companies.json        # 監視対象企業リスト
│   └── sources.json          # RSS/API/検索クエリ設定
├── supabase/
│   └── migrations/           # データベーススキーマ
└── vercel.json               # Cron設定 & デプロイ設定
```

### 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + React + Tailwind CSS
- **バックエンド**: Next.js API Routes (Vercel Functions)
- **データベース**: Supabase (PostgreSQL)
- **AI**: Claude 3.5 Sonnet (分析・戦略) + Gemini 1.5 Pro (画像抽出)
- **デプロイ**: Vercel Pro (region: hnd1)
- **通知**: Google Chat Webhook
- **モノレポ**: pnpm workspaces + Turbo

## 🚀 セットアップ

### 1. 前提条件

- Node.js 18以上
- pnpm 8以上
- Supabaseプロジェクト（作成済み）
- AnthropicのAPIキー
- GeminiのAPIキー
- Google Chat Webhook URL

### 2. リポジトリのクローン

```bash
git clone https://github.com/Ghouse-development/Product-planning-newspaper.git
cd Product-planning-newspaper
```

### 3. 依存関係のインストール

```bash
pnpm install
```

### 4. データベースのセットアップ

Supabaseプロジェクトで以下のSQLを実行：

```bash
# Supabase Dashboard → SQL Editor で実行
cat supabase/migrations/001_initial_schema.sql
```

または、Supabase CLIを使用：

```bash
npx supabase db push
```

### 5. 環境変数の設定

#### ローカル開発

```bash
cp .env.example apps/web/.env.local
```

`apps/web/.env.local` を編集して、実際の値を設定：

```env
TZ=Asia/Tokyo
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
GEMINI_API_KEY=AIzaSyxxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/xxxxx
```

#### Vercel本番環境

Vercel Dashboard → Project → Settings → Environment Variables で設定

### 6. ローカルでの起動

```bash
# 開発サーバー起動
pnpm dev

# ブラウザで開く
# http://localhost:3000
```

### 7. Vercelへのデプロイ

```bash
# Vercel CLIのインストール（初回のみ）
npm i -g vercel

# デプロイ
vercel

# 本番デプロイ
vercel --prod
```

## 📅 自動実行スケジュール

`vercel.json` で定義されたCron（JST）：

| 時刻 | エンドポイント | 処理内容 |
|------|--------------|---------|
| 02:00 | `/api/admin/crawl` | データ収集 |
| 03:00 | `/api/admin/extract` | 抽出・正規化 |
| 04:00 | `/api/admin/analyze` | AI分析 |
| 08:00 | `/api/report/daily` | 日刊新聞生成・配信 |
| 23:00 (日) | `/api/report/weekly` | 週報生成 |

## 🔧 主要エンドポイント

### 管理API

- `POST /api/admin/crawl` - データ収集実行
- `POST /api/admin/extract` - 抽出処理実行
- `POST /api/admin/analyze` - AI分析実行

### レポートAPI

- `POST /api/report/daily` - 日刊新聞生成・配信
- `POST /api/report/weekly` - 週報生成

### Web UI

- `/` - ホーム
- `/newspaper` - 今日の新聞
- `/dashboard` - コストダッシュボード
- `/archive` - アーカイブ
- `/settings` - 設定

## 💰 コスト管理

### APIコストの計算

システムは以下の料金で自動計算：

- **Claude 3.5 Sonnet**: $3.00/1M tokens (入力) + $15.00/1M tokens (出力)
- **Gemini 1.5 Pro**: $1.25/1M tokens (入力) + $5.00/1M tokens (出力)

### 残高管理

1. 初期残高を手動登録：

```sql
INSERT INTO credit_balance (provider, balance_usd)
VALUES ('anthropic', 5.00);
```

2. ダッシュボードで自動表示：
   - 今日の使用コスト
   - 7日平均
   - 残高
   - **あと何回レポート生成可能か**
   - 今月累計

### コスト最適化のヒント

- 1回のレポート生成で約 $0.10〜0.50
- 監視対象を絞ることでコスト削減可能
- Gemini抽出は画像/表がある場合のみ使用

## 📝 カスタマイズ

### 監視対象企業の追加

`config/companies.json` を編集：

```json
{
  "name": "新しい工務店",
  "domain": "example.com",
  "paths": ["/news", "/products"]
}
```

### RSS/SNSソースの追加

`config/sources.json` を編集：

```json
{
  "instagram_rss": {
    "urls": ["https://rss.app/feeds/xxxxx.xml"]
  }
}
```

### プロンプトのカスタマイズ

`packages/ai/src/prompts/` 内の `.md` ファイルを編集

## 🐛 トラブルシューティング

### データが収集されない

```bash
# 手動でCrawl実行
curl -X POST http://localhost:3000/api/admin/crawl
```

### 新聞が生成されない

1. データベースを確認：
   ```sql
   SELECT COUNT(*) FROM sources_raw;
   SELECT COUNT(*) FROM extracts;
   SELECT COUNT(*) FROM ai_outputs;
   ```

2. ログを確認：
   - Vercel Dashboard → Functions → Logs

### APIキーが正しく設定されているか確認

```bash
# ローカル
cat apps/web/.env.local | grep API_KEY

# Vercel
vercel env ls
```

## 📚 データベーススキーマ

### 主要テーブル

- `sources_raw` - 収集した原本データ
- `extracts` - 抽出・正規化後のデータ
- `ai_outputs` - AI分析結果（分類/比較/トレンド/戦略/新聞）
- `trend_kpis` - トレンドKPI（キーワード頻度）
- `usage_meter` - API使用量（日次集計）
- `credit_balance` - 残高スナップショット

## 🔒 セキュリティ

### 重要事項

- ✅ `.env.local` は `.gitignore` に含まれています
- ✅ 本番環境ではVercelの環境変数を使用
- ⚠️ `SUPABASE_SERVICE_KEY` は絶対にGitにコミットしない
- ⚠️ APIキーは定期的にローテーション

### Row Level Security (RLS)

- すべてのテーブルでRLS有効
- Service roleは全アクセス可
- Anonキーは読み取り専用

## 🤝 貢献

バグ報告や機能リクエストは [Issues](https://github.com/Ghouse-development/Product-planning-newspaper/issues) へ

## 📄 ライセンス

Private - G-HOUSE Internal Use Only

## 👥 開発チーム

- **開発**: G-HOUSE 開発チーム
- **運用**: G-HOUSE 経営企画部

---

**Last Updated**: 2025年11月2日
