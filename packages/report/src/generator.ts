import { marked } from 'marked';
import { createLogger, UsageMetrics } from '@ghouse/core';
import { getUsageMetrics } from '@ghouse/supakit';

const logger = createLogger('report:generator');

export interface NewspaperData {
  markdown: string;
  metrics: UsageMetrics;
  date: string;
}

/**
 * Generate newspaper HTML from markdown
 */
export async function generateNewspaperHTML(markdown: string): Promise<string> {
  const metrics = await getUsageMetrics();
  const date = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });

  const html = await marked.parse(markdown);

  // Create complete HTML with styling
  const fullHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>G-HOUSE トレンドAIインサイト - ${date}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Noto Sans JP', sans-serif;
      line-height: 1.8;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      border-bottom: 4px solid #e63946;
      padding-bottom: 10px;
    }

    h2 {
      font-size: 1.8rem;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #e63946;
      border-left: 5px solid #e63946;
      padding-left: 15px;
    }

    h3 {
      font-size: 1.4rem;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #457b9d;
    }

    p {
      margin-bottom: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }

    th {
      background: #457b9d;
      color: white;
      font-weight: bold;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    ul, ol {
      margin: 15px 0 15px 30px;
    }

    li {
      margin-bottom: 8px;
    }

    strong {
      color: #e63946;
    }

    hr {
      border: none;
      border-top: 2px solid #ddd;
      margin: 30px 0;
    }

    .metrics {
      background: #f1faee;
      border: 2px solid #457b9d;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }

    .metrics h3 {
      color: #457b9d;
      margin-top: 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }

    .metric-item {
      background: white;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #457b9d;
    }

    .metric-label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 5px;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #e63946;
    }

    .date-header {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 30px;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${html}

    <div class="metrics">
      <h3>🧾 APIコストダッシュボード</h3>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">今日の使用</div>
          <div class="metric-value">$${metrics.today_cost.toFixed(4)}</div>
          <div class="metric-label">${metrics.today_calls} calls | ${metrics.today_tokens_in.toLocaleString()} in / ${metrics.today_tokens_out.toLocaleString()} out tokens</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">直近7日平均</div>
          <div class="metric-value">$${metrics.avg_7d_cost.toFixed(4)}</div>
          <div class="metric-label">/ 日</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">残高</div>
          <div class="metric-value">$${metrics.balance.toFixed(2)}</div>
          <div class="metric-label">あと ${metrics.remaining_reports} 回のレポート</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">今月累計</div>
          <div class="metric-value">$${metrics.month_total.toFixed(4)}</div>
        </div>
      </div>
    </div>

    <hr>
    <p style="text-align: center; color: #666; font-size: 0.9rem;">
      G-HOUSE トレンドAIインサイト | 生成日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
    </p>
  </div>
</body>
</html>
  `;

  return fullHtml;
}

/**
 * Generate summary text for Google Chat
 */
export function generateChatSummary(markdown: string, metrics: UsageMetrics): string {
  // Extract first 300-600 characters as summary
  const lines = markdown.split('\n').filter((line) => line.trim() && !line.startsWith('#'));
  const summary = lines.slice(0, 3).join('\n').substring(0, 600);

  const costInfo = `【コスト：今日 $${metrics.today_cost.toFixed(4)}｜残 $${metrics.balance.toFixed(2)}｜あと ${metrics.remaining_reports} 回】`;

  return `${summary}\n\n${costInfo}`;
}
