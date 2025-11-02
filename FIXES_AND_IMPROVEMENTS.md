# 修正と改善事項

## ✅ 完了した修正

### 1. プロンプト読み込みの修正（重大）

**問題**: `fs.readFileSync`は本番環境（Vercel）でバンドル後に動作しない

**修正**: プロンプトを直接埋め込み
- `packages/ai/src/prompts/index.ts`でプロンプトを定数として定義
- `.md`ファイルではなくTypeScriptコードに埋め込み
- これにより、Webpackバンドル後も正常に動作

**影響**: 本番デプロイでプロンプトが正しく読み込まれる

---

### 2. API Route設定の追加

**問題**: Next.js App RouterのCronエンドポイントに必要な設定が不足

**修正**:
```typescript
export const dynamic = 'force-dynamic'  // キャッシュ無効化
export const maxDuration = 300  // タイムアウト5分
```

**対象ファイル**:
- `/api/admin/crawl/route.ts`
- `/api/admin/extract/route.ts`
- `/api/admin/analyze/route.ts`
- `/api/report/daily/route.ts`
- `/api/report/weekly/route.ts`

**影響**: Cronジョブが正常に実行される

---

### 3. GETエンドポイントの追加

**問題**: ブラウザから手動テストできない

**修正**: すべてのAPI RouteにGET methodを追加
```typescript
export async function GET() {
  return POST()
}
```

**影響**: ブラウザのアドレスバーから直接テスト可能

---

### 4. ヘルスチェックエンドポイントの追加

**新規**: `/api/health`

**機能**:
- 環境変数の存在チェック
- Supabase接続テスト
- システムステータスの返却

**使用方法**:
```bash
curl https://your-project.vercel.app/api/health
```

**レスポンス例**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T...",
  "environment": {
    "hasAnthropicKey": true,
    "hasGeminiKey": true,
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    "hasChatWebhook": true
  },
  "database": {
    "connected": true,
    "error": null
  }
}
```

---

### 5. テストエンドポイントの追加

**新規**: `/api/test`

**機能**: シンプルなAPIテスト

**使用方法**:
```bash
curl https://your-project.vercel.app/api/test
```

---

### 6. 新聞ページのスタイリング改善

**問題**: Markdownが正しく表示されない可能性

**修正**: CSS-in-JSでスタイル追加
- 見出しスタイル
- 表スタイル
- 強調スタイル
- レスポンシブ対応

---

## 🔍 チェック済み・問題なし

### TypeScript コンパイル
- すべてのパッケージでTypeScriptエラーなし
- 型定義が正しく解決される

### Supabaseクライアント
- シングルトンパターンで正しく初期化
- 環境変数から正しく読み込まれる
- エラーハンドリング実装済み

### エラーハンドリング
- すべてのAPI Routeでtry-catchブロック
- ログ出力実装済み
- 適切なHTTPステータスコード返却

---

## 🚀 デプロイ前チェックリスト

### 環境変数（Vercel）✅
- [x] ANTHROPIC_API_KEY
- [x] GEMINI_API_KEY
- [x] SUPABASE_URL
- [x] SUPABASE_SERVICE_KEY
- [x] SUPABASE_ANON_KEY
- [x] CHAT_WEBHOOK_URL

### Supabaseセットアップ ✅
- [x] テーブル作成（6テーブル）
- [x] 初期残高設定

### Vercel設定（必要な設定）

Vercel Dashboard → Settings → General → Build & Development Settings:

```
Framework Preset: Next.js
Root Directory: (空欄)
Build Command: npm install -g pnpm@8 && pnpm install && pnpm build --filter=@ghouse/web
Install Command: npm install -g pnpm@8 && pnpm install
Output Directory: apps/web/.next
```

---

## 🧪 デプロイ後のテスト手順

### 1. ヘルスチェック

```bash
curl https://your-project.vercel.app/api/health
```

期待される結果: `"status": "healthy"`

### 2. テストエンドポイント

```bash
curl https://your-project.vercel.app/api/test
```

期待される結果: `"message": "API is working!"`

### 3. データ収集テスト

```bash
curl https://your-project.vercel.app/api/admin/crawl
```

期待される結果: `"success": true`, `totalFetched > 0`

### 4. 抽出テスト

```bash
curl https://your-project.vercel.app/api/admin/extract
```

期待される結果: `"success": true`, `totalProcessed > 0`

### 5. 分析テスト

```bash
curl https://your-project.vercel.app/api/admin/analyze
```

期待される結果: `"success": true`, `totalAnalyzed > 0`

### 6. 新聞生成テスト

```bash
curl https://your-project.vercel.app/api/report/daily
```

期待される結果: `"success": true` + Google Chatに新聞が届く

---

## 💡 よくある問題と解決策

### Q: ビルドが失敗する

**原因**: モノレポの依存関係が解決されない

**解決策**:
1. Vercel Dashboardで Build Command を確認
2. `npm install -g pnpm@8 && pnpm install` が含まれているか確認
3. Root Directory が空欄（ルート）になっているか確認

---

### Q: API呼び出しで500エラー

**原因**: 環境変数が設定されていない

**解決策**:
```bash
cd apps/web
vercel env ls  # 環境変数を確認
```

すべてのキーが表示されるか確認

---

### Q: Cronが実行されない

**原因**: Vercel Proプランが必要

**解決策**:
1. Vercel Proプランにアップグレード
2. Vercel Dashboard → Project → Settings → Cron Jobs で確認

---

### Q: Supabaseに接続できない

**原因**:
- URLが間違っている
- Service Keyが間違っている
- RLSポリシーの問題

**解決策**:
1. `/api/health` でデータベース接続を確認
2. Supabase Dashboard → Settings → API で URL とキーを再確認
3. RLSポリシーが正しく設定されているか確認

---

### Q: Google Chatに届かない

**原因**: Webhook URLが間違っている

**解決策**:
1. Google Chat → Space Settings → Webhooks で URL を再確認
2. 手動でcurlテスト:
```bash
curl -X POST $CHAT_WEBHOOK_URL -H 'Content-Type: application/json' -d '{"text":"Test"}'
```

---

## 📝 今後の改善案

### パフォーマンス
- [ ] 並列処理の最適化（crawl時）
- [ ] キャッシュ戦略の導入
- [ ] Gemini呼び出しの制限（必要な場合のみ）

### 機能追加
- [ ] エラー通知（Slack/Discord）
- [ ] 管理画面（監視対象の追加/削除）
- [ ] メトリクスダッシュボードの拡充
- [ ] PDFエクスポート機能

### 運用
- [ ] ログ集約（Datadog/LogRocket）
- [ ] アラート設定（Cronジョブ失敗時）
- [ ] バックアップ戦略
- [ ] コスト監視アラート

---

**最終更新**: 2025年11月2日
