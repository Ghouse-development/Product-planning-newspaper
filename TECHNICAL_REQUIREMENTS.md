# 技術要件定義書

## システム概要

G-HOUSE トレンドAIインサイトは、住宅業界の最新トレンドを自動収集・分析し、日刊新聞形式で配信するシステムです。

## データパイプライン

### 1. データ収集 (Crawl)

**目的**: 複数の情報源から住宅業界関連の情報を収集

**データソース**:
- PR TIMES（プレスリリース）
- 新建ハウジング（業界メディア）
- 競合企業の公式Webサイト
- Instagram RSS（SNSトレンド）

**処理フロー**:
```
sources.json の設定読み込み
→ 各データソースからコンテンツ取得
→ 既存URLチェック（重複スキップ）
→ SHA-256ハッシュ生成
→ sources_raw テーブルに保存
```

**実装ファイル**: `apps/web/src/app/api/admin/crawl/route.ts`

**重要な仕様**:
- 既存URLは自動スキップ（`getExistingUrls`関数）
- PR TIMESは記事詳細も取得（`fetchPRTimesArticle`）
- コンテンツ重複防止（SHA-256ハッシュ）

---

### 2. データ抽出 (Extract)

**目的**: 収集した生データから構造化されたテキスト情報を抽出

**処理方式**:
1. **ルールベース抽出** (デフォルト)
   - cheerioでHTMLパース
   - 不要要素の削除（script, style, nav, footer, header, .advertisement）
   - bodyタグからテキスト抽出
   - **重要**: bodyタグが存在しない場合、raw contentをそのまま使用

2. **Gemini抽出** (PR TIMES/SNS向け)
   - Gemini 1.5 Pro で画像・表抽出
   - 5000文字まで送信
   - JSON形式でレスポンス

**実装ファイル**: `packages/extract/src/extractor.ts`

**重要な修正 (2025-01-08)**:
```typescript
// extractWithRules関数の修正
let text = $('body').text().trim().replace(/\s+/g, ' ');

// bodyタグがない場合のフォールバック処理（重要）
if (!text || text.length === 0) {
  text = html.trim().replace(/\s+/g, ' ');
}
```

**修正理由**:
- sources_raw.content はHTMLではなくプレーンテキストの場合がある
- cheerioでbodyタグが見つからない場合、空文字列を返す
- これにより後続のAI分析が失敗し、全て「【不明】情報」になっていた

**出力先**: `extracts` テーブル
- text: 抽出されたテキスト
- tables: Markdown形式の表
- images: 画像URL配列
- extractor: 'rule' | 'gemini'
- version: 'v1'

---

### 3. AI分析 (Analyze)

**目的**: 抽出されたテキストをAIで分類・分析

**使用モデル**: Gemini 2.5-flash

**分析タイプ**:

#### 3.1 Classification（分類）
**プロンプト**: `packages/ai/src/prompts/classify.md`

**出力JSON構造**:
```json
{
  "type": "product | spec | price | regulation | case_study | recruitment",
  "company": "企業名",
  "product": "商品・サービス名",
  "price_band": "価格帯",
  "specs": ["仕様1", "仕様2"],
  "topic_tags": ["タグ1", "タグ2"]
}
```

**重要な処理**:
- Geminiのレスポンスはmarkdown code fenceで囲まれる場合がある
- `safeJsonParse`関数で ```json ``` を除去してからパース
- パース失敗時はfallbackオブジェクトを返す

**実装ファイル**:
- `apps/web/src/app/api/admin/analyze/route.ts`
- `packages/core/src/utils.ts` (safeJsonParse)

---

### 4. 新聞生成 (Report)

**目的**: AI分析結果から新聞形式のHTMLを生成

**処理フロー**:
```
最近24時間のAI分析結果を取得
→ generateSummary関数でサマリー生成
→ カード形式のUIコンポーネントで表示
→ Google Chatに通知
```

**実装ファイル**:
- `apps/web/src/app/newspaper/page.tsx` - サーバーサイドレンダリング
- `apps/web/src/app/newspaper/NewspaperView.tsx` - クライアントコンポーネント
- `apps/web/src/components/ArticleCard.tsx` - 記事カード

**表示項目**:
- 会社名
- 商品/サービス名
- 記事タイプ（新商品/仕様情報/価格情報/事例/採用）
- トピックタグ
- 仕様リスト
- 価格帯
- インパクト評価（★1〜5）
- サマリー（自動生成）

---

## データベーススキーマ

### sources_raw（生データ）
```sql
CREATE TABLE sources_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('prtimes', 'media', 'company', 'sns')),
  url TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content TEXT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  UNIQUE(hash_sha256)
);
```

### extracts（抽出データ）
```sql
CREATE TABLE extracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_id UUID NOT NULL REFERENCES sources_raw(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  text TEXT NOT NULL,
  tables TEXT[],
  images JSONB[],
  extractor TEXT NOT NULL,
  version TEXT NOT NULL,
  UNIQUE(raw_id)
);
```

### ai_outputs（AI分析結果）
```sql
CREATE TABLE ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extract_id UUID NOT NULL REFERENCES extracts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role TEXT NOT NULL,
  model TEXT NOT NULL,
  output_md TEXT,
  output_json JSONB,
  tokens_in INT,
  tokens_out INT,
  usd_cost NUMERIC(10,4)
);
```

---

## 自動実行スケジュール

### vercel.json設定
```json
{
  "crons": [
    {
      "path": "/api/admin/run-daily",
      "schedule": "0 23 * * *"  // 8am JST (23:00 UTC)
    },
    {
      "path": "/api/report/weekly",
      "schedule": "0 23 * * 0"  // 毎週日曜8am JST
    }
  ]
}
```

### /api/admin/run-daily の処理フロー
1. Crawl（データ収集）
2. Extract（データ抽出）
3. Analyze（AI分析）
4. Report（新聞生成・配信）

**実行時間**: 約7〜10分
- Crawl: 30秒〜1分
- Extract: 5秒〜10秒
- Analyze: 5分〜6分（19件の場合）
- Report: 10秒〜30秒

---

## パフォーマンス制約

### Vercel Serverless Functions
- **タイムアウト**: 5分（300秒）
- **メモリ**: 1024MB（デフォルト）
- **リージョン**: hnd1（東京）

### 既知の問題
**Analyze処理のタイムアウト**:
- 19件の記事をGemini APIで分析: 約6分必要
- Vercelの5分制限を超過
- ローカル環境では正常動作確認済み

**対策案**:
1. 分析処理を分割実行（5〜10件ずつ）
2. Vercel Pro プランでタイムアウト延長（最大15分）
3. バックグラウンドジョブへの移行
4. Gemini API呼び出しの並列化

---

## エラーハンドリング

### 重複データ処理
- sources_raw.hash_sha256 にUNIQUE制約
- 重複検出時は`insertSourceRaw`がnullを返す
- エラーログに記録

### API呼び出し失敗
- try-catchで全てのAPI呼び出しをラップ
- Google Chat に通知（`notifyError`関数）
- ログに詳細情報を記録

### JSON パース失敗
- `safeJsonParse`関数でfallbackオブジェクトを返す
- markdown code fenceを自動除去
- パース失敗時もシステムは継続動作

---

## セキュリティ要件

### 環境変数管理
- `.env.local`ファイル（Gitにコミットしない）
- Vercel環境変数で本番設定
- Supabase Row Level Security (RLS) 有効化

### API認証
- Supabase Service Role Key（サーバーサイドのみ）
- Anthropic API Key（Claude）
- Gemini API Key（Google）
- Google Chat Webhook URL

---

## モニタリング・運用

### コスト管理
- `usage_meter`テーブルで日次トークン使用量を記録
- `credit_balance`テーブルで残高追跡
- リアルタイムでコスト表示

### ログ管理
- pino loggerでJSON形式ログ出力
- Vercel Logsで確認可能
- Google Chat に重要イベント通知

### データ保持期間
- sources_raw: 無期限（削除時はCASCADE）
- extracts: sources_raw削除時に自動削除
- ai_outputs: extracts削除時に自動削除
- usage_meter: 無期限
- trend_kpis: 無期限

---

## テスト要件

### ローカル検証
```bash
# データ収集
curl -X POST http://localhost:3001/api/admin/crawl

# データ抽出
curl -X POST http://localhost:3001/api/admin/extract

# AI分析
curl -X POST http://localhost:3001/api/admin/analyze

# 新聞表示
open http://localhost:3001/newspaper
```

### 本番検証
```bash
# 全パイプライン実行
curl -X POST https://product-planning-newspaper.vercel.app/api/admin/run-daily

# 新聞表示
open https://product-planning-newspaper.vercel.app/newspaper
```

---

## 変更履歴

### 2025-01-08
- **修正**: extractWithRules関数にplain textフォールバック処理を追加
- **理由**: bodyタグが存在しない場合の空文字列問題を解決
- **影響**: 【不明】情報の表示問題が解消
- **コミット**: 555550f
