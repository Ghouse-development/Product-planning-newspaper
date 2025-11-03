// Prompts are embedded directly to avoid fs.readFileSync issues in production

const CLASSIFY_PROMPT = `# Classification Prompt

あなたは住宅業界の専門アナリストです。以下のコンテンツを分析し、JSON形式で分類してください。

## 入力コンテンツ

{CONTENT}

## 出力形式

以下のJSON形式で回答してください。必ずこの形式を守ってください：

\`\`\`json
{
  "type": "product | spec | price | regulation | case_study | recruitment",
  "company": "会社名",
  "product": "商品名（該当する場合）",
  "price_band": "価格帯（例: 2000-3000万円）",
  "specs": ["仕様1", "仕様2", "仕様3"],
  "topic_tags": ["タグ1", "タグ2", "タグ3"]
}
\`\`\`

必ずJSON形式のみを返してください。説明文は不要です。`;

const COMPARE_PROMPT = `# Comparison Prompt

あなたは住宅業界の競合分析の専門家です。以下の情報を比較分析してください。

## 分析対象

{CONTENT}

## タスク

1. 同じカテゴリの商品・サービスの新旧差分を比較表にまとめる
2. **「Gハウスへの影響3点」**を箇条書きで記載

## 出力形式

### 比較表（Markdown）

| 項目 | 旧 | 新 | 差分 |
|------|----|----|------|

### Gハウスへの影響（必ず3点）

1. **【営業】** ...
2. **【商品企画】** ...
3. **【マーケティング】** ...`;

const TREND_PROMPT = `# Trend Analysis Prompt

あなたは住宅業界のトレンド分析の専門家です。SNS、メディア、企業発信の情報からトレンドを抽出してください。

## データ

{CONTENT}

## 出力形式（JSON）

\`\`\`json
{
  "trends": [
    {
      "keyword": "吹抜け",
      "frequency": 45,
      "change_rate": 1.25,
      "hypothesis": "...",
      "next_observation": "..."
    }
  ],
  "summary": "..."
}
\`\`\`

必ずJSON形式で返してください。`;

const STRATEGY_PROMPT = `# Strategy Prompt

あなたはGハウスの経営戦略アドバイザーです。収集した情報から、部署別の具体的なアクションプランを提案してください。

## 収集情報

{CONTENT}

## 出力形式（JSON）

\`\`\`json
{
  "sales": [{"action": "...", "owner": "...", "deadline": "...", "reason": "..."}],
  "design": [{"action": "...", "owner": "...", "deadline": "...", "reason": "..."}],
  "marketing": [{"action": "...", "owner": "...", "deadline": "...", "reason": "..."}],
  "product": [{"action": "...", "owner": "...", "deadline": "...", "reason": "..."}]
}
\`\`\`

必ずJSON形式で返してください。`;

const NEWSPAPER_PROMPT = `# Newspaper Generation Prompt

あなたは業界新聞の編集長です。収集した情報を元に、読みやすく実用的な「日刊AIインサイト」を作成してください。

## 重要な指示
- 入力情報には「会社名」「商品名」「発信元」「URL」が含まれています
- これらの情報を**必ず明確に**記事に含めてください
- URLは実際のリンクとして機能するように記載してください
- 見出しや強調を使って、読者が一目で情報を把握できるようにしてください

## 入力情報

### トップ記事
{TOP_STORIES}

### SNSトレンド
{TRENDS}

### 競合分析
{COMPARISONS}

### 戦略提案
{STRATEGIES}

## 出力形式

---

# G-HOUSE トレンドAIインサイト

**{DATE}（{DAY}）朝刊**

---

## 🏠 今朝のトピック TOP5

### 1. 【会社名】商品名・サービス名

**📍 発信元**: SNS/メディア/Web
**🔗 URL**: [元記事を見る](URL)
**📦 商品**: 商品名
**💰 価格帯**: 価格情報
**🔧 主な仕様**: 仕様情報
**🏷️ 関連タグ**: タグ1, タグ2

**要約**: ここに記事の要約を簡潔に記載

**影響度**: ★★★★★（5段階）

---

### 2. ...

（同様の形式で5件まで記載）

---

## 💬 SNSトレンド（24時間）

| 順位 | キーワード | 前週比 | AIコメント |

---

## 🧩 競合差分ダイジェスト

### 競合A社：...

| 項目 | 旧 | 新 | 差分 |

#### 📌 Gハウスへの影響3点

1. **【営業】** ...
2. **【商品企画】** ...
3. **【マーケティング】** ...

---

## 🚀 次の一手（部署別アクション）

### 営業部
- **今週中**: ...

### 設計部
- **1ヶ月以内**: ...

### 広報・マーケティング部
- **今週中**: ...

### 商品企画部
- **3ヶ月以内**: ...

---

**重要**: 入力情報に含まれるすべてのURLを記事内に必ず含めてください。各記事の「🔗 URL」欄に実際のリンクを記載してください。

---`;

function loadPrompt(prompt: string, variables: Record<string, string> = {}): string {
  let result = prompt;

  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });

  return result;
}

export function getClassifyPrompt(content: string): string {
  return loadPrompt(CLASSIFY_PROMPT, { CONTENT: content });
}

export function getComparePrompt(content: string): string {
  return loadPrompt(COMPARE_PROMPT, { CONTENT: content });
}

export function getTrendPrompt(content: string): string {
  return loadPrompt(TREND_PROMPT, { CONTENT: content });
}

export function getStrategyPrompt(content: string): string {
  return loadPrompt(STRATEGY_PROMPT, { CONTENT: content });
}

export function getNewspaperPrompt(
  topStories: string,
  trends: string,
  comparisons: string,
  strategies: string,
  date: string = new Date().toLocaleDateString('ja-JP')
): string {
  const day = new Date().toLocaleDateString('ja-JP', { weekday: 'long' });
  return loadPrompt(NEWSPAPER_PROMPT, {
    TOP_STORIES: topStories,
    TRENDS: trends,
    COMPARISONS: comparisons,
    STRATEGIES: strategies,
    DATE: date,
    DAY: day,
  });
}
