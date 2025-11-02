# 🔒 401 Unauthorized エラー修正ガイド

## 問題の診断

**エラーステータス**: `HTTP/1.1 401 Unauthorized`（404ではありません）

**原因**: Vercel Deployment Protection（デプロイメント保護）が有効になっているため、サイトへのアクセスに認証が必要です。

```
✅ デプロイ: 成功
✅ ビルド: 正常
❌ アクセス: Vercel SSO 認証が必要
```

---

## 🔧 解決方法（3つの選択肢）

### 方法1: Deployment Protection を無効化（推奨）

この方法で、誰でもサイトにアクセス可能になります。

#### 手順:

1. **Vercel Dashboard にアクセス**
   ```
   https://vercel.com/ghouse-developments-projects/product-planning-newspaper/settings/deployment-protection
   ```

2. **Settings → Deployment Protection**

3. **Protection Method** を以下のいずれかに設定:
   - ✅ **Standard Protection** → Production は公開、Preview のみ保護
   - ✅ **無効** → すべて公開

4. **変更を保存**

5. **再デプロイ**（または次回のデプロイで反映）
   ```bash
   vercel --prod --yes
   ```

---

### 方法2: Vercel Authentication Bypass（一時的）

この方法で、認証をバイパスしてアクセスできます。

#### 手順:

1. **Vercel Dashboard → Settings → Deployment Protection**

2. **"Bypass for Automation"** トークンを取得

3. **URL にトークンを追加してアクセス**:
   ```
   https://product-planning-newspaper-fkll6snet.vercel.app?x-vercel-protection-bypass=YOUR_TOKEN
   ```

4. **Cookie が設定されれば、以降はトークン不要**

---

### 方法3: Vercel にログインしてアクセス

現在の設定を維持したまま、認証してアクセスします。

#### 手順:

1. ブラウザで以下にアクセス:
   ```
   https://product-planning-newspaper-fkll6snet.vercel.app
   ```

2. **"Authenticate"** ボタンをクリック

3. **Vercel アカウントでログイン**

4. 認証後、サイトにアクセス可能

---

## 📊 現在の設定確認

Vercel Dashboardで以下を確認してください：

```
Settings → Deployment Protection

現在の設定:
- Protection Method: ??? (確認必要)
- Production Protection: Enabled/Disabled
- Preview Protection: Enabled/Disabled
```

---

## 🎯 推奨設定（パブリックサイトの場合）

```
✅ Protection Method: Standard Protection
   → Production: Public（公開）
   → Preview: Protected（保護）

または

✅ Protection Method: Off
   → すべて公開
```

---

## ⚙️ API エンドポイントへのアクセス

APIエンドポイント（`/api/*`）も同様に保護されています。

Cronジョブは **Vercel内部から実行されるため問題ありません**が、外部からのテストには以下が必要：

### オプション1: Protection を無効化（推奨）

### オプション2: Bypass Token を使用
```bash
export BYPASS_TOKEN="your_bypass_token_here"

curl -H "x-vercel-protection-bypass: $BYPASS_TOKEN" \
  https://product-planning-newspaper-fkll6snet.vercel.app/api/health
```

---

## 🔍 確認コマンド

### 現在の状態確認
```bash
curl -I https://product-planning-newspaper-fkll6snet.vercel.app
# 期待: HTTP/1.1 200 OK（Protection無効化後）
# 現在: HTTP/1.1 401 Unauthorized（Protection有効）
```

### Protection無効化後の確認
```bash
curl https://product-planning-newspaper-fkll6snet.vercel.app
# 期待: HTMLが返ってくる

curl https://product-planning-newspaper-fkll6snet.vercel.app/api/health
# 期待: {"status": "ok"}
```

---

## ⚠️ 重要な注意事項

### Cron ジョブは影響を受けません

Vercel の Cron ジョブは **内部ネットワークから実行される** ため、Deployment Protection の影響を受けません。

```
✅ Cron は正常に動作します:
  - /api/admin/crawl   (02:00 JST)
  - /api/admin/extract (03:00 JST)
  - /api/admin/analyze (04:00 JST)
  - /api/report/daily  (08:00 JST)
```

### 影響を受けるもの

- ❌ ブラウザからのアクセス（認証が必要）
- ❌ 外部からのAPI呼び出し（認証またはBypass Token必要）
- ❌ Webhook（認証またはBypass Token必要）

---

## 📝 次のステップ

1. **Deployment Protection を無効化** (または Standard に変更)
2. **設定を保存**
3. **再デプロイ** (任意)
4. **アクセステスト**:
   ```bash
   curl https://product-planning-newspaper-fkll6snet.vercel.app
   ```
5. **Supabase マイグレーション実行**（まだの場合）
6. **初回手動実行**（DEPLOYMENT_SUCCESS.md 参照）

---

## ✅ 成功の確認

Protection を無効化後、以下が動作すれば成功です：

```bash
# 1. トップページアクセス
curl -s https://product-planning-newspaper-fkll6snet.vercel.app | head -20
# 期待: HTML が返ってくる

# 2. API ヘルスチェック
curl https://product-planning-newspaper-fkll6snet.vercel.app/api/health
# 期待: {"status": "ok"} または SUPABASE関連のエラー（環境変数設定済みの場合）

# 3. ブラウザアクセス
# https://product-planning-newspaper-fkll6snet.vercel.app
# 期待: トップページが表示される（認証画面が出ない）
```

---

**🎯 推奨アクション**: 方法1（Deployment Protection を無効化）を選択してください。
