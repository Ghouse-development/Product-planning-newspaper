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
 * Extract URLs from text and create visual link cards
 */
function extractURLs(text: string): Array<{ url: string; context: string }> {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.matchAll(urlRegex);
  const urls: Array<{ url: string; context: string }> = [];

  for (const match of matches) {
    const url = match[0];
    const index = match.index || 0;
    // Get surrounding context (50 chars before and after)
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + url.length + 50);
    const context = text.substring(start, end).trim();
    urls.push({ url, context });
  }

  return urls;
}

/**
 * Generate SVG bar chart for trend data
 */
function generateTrendChart(data: Array<{ label: string; value: number }>): string {
  if (data.length === 0) return '';

  const maxValue = Math.max(...data.map((d) => d.value));
  const barHeight = 40;
  const barSpacing = 10;
  const chartHeight = data.length * (barHeight + barSpacing);
  const chartWidth = 600;
  const labelWidth = 200;
  const barWidth = chartWidth - labelWidth - 100;

  const bars = data
    .map((item, i) => {
      const barLength = (item.value / maxValue) * barWidth;
      const y = i * (barHeight + barSpacing);

      return `
        <g>
          <text x="0" y="${y + 25}" fill="#333" font-size="14">${item.label}</text>
          <rect x="${labelWidth}" y="${y}" width="${barLength}" height="${barHeight}" fill="#457b9d" rx="5" />
          <text x="${labelWidth + barLength + 10}" y="${y + 25}" fill="#e63946" font-weight="bold" font-size="16">${item.value}</text>
        </g>
      `;
    })
    .join('\n');

  return `
    <svg width="${chartWidth}" height="${chartHeight + 20}" xmlns="http://www.w3.org/2000/svg">
      ${bars}
    </svg>
  `;
}

/**
 * Create visual summary boxes from markdown sections
 */
function createVisualSummary(html: string): string {
  // Wrap h2 sections in visual cards
  let enhanced = html.replace(
    /<h2>(.*?)<\/h2>/g,
    '<div class="section-card"><h2>$1</h2><div class="section-content">'
  );

  // Close the section cards before next h2 or at the end
  const sections = enhanced.split('<div class="section-card">');
  enhanced = sections
    .map((section, i) => {
      if (i === 0) return section; // Skip first part before any h2
      // Close previous section before next h2 or at end
      const nextH2Index = section.indexOf('<div class="section-card">');
      if (nextH2Index > 0) {
        return section.substring(0, nextH2Index) + '</div></div>' + section.substring(nextH2Index);
      }
      return section + '</div></div>';
    })
    .join('<div class="section-card">');

  return enhanced;
}

/**
 * Generate newspaper HTML from markdown
 */
export async function generateNewspaperHTML(markdown: string): Promise<string> {
  const metrics = await getUsageMetrics();
  const date = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });

  // Extract URLs for prominent display
  const urls = extractURLs(markdown);

  let html = await marked.parse(markdown);

  // Enhance HTML with visual sections
  html = createVisualSummary(html);

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
      font-weight: 700;
    }

    /* Enhanced badges and labels */
    .company-badge {
      display: inline-block;
      background: linear-gradient(135deg, #e639466 20%, #d62839 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 0.95rem;
      margin-right: 8px;
      box-shadow: 0 2px 4px rgba(230, 57, 70, 0.3);
    }

    .source-badge {
      display: inline-block;
      background: #457b9d;
      color: white;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-right: 6px;
    }

    .source-badge.sns {
      background: #1DA1F2;
    }

    .source-badge.media {
      background: #FF6B6B;
    }

    .info-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 12px 0;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
    }

    .info-label {
      font-weight: 600;
      color: #457b9d;
    }

    .info-value {
      color: #333;
    }

    .article-url {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fff9e6;
      border: 2px solid #ffb703;
      padding: 8px 14px;
      border-radius: 6px;
      color: #023047;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s ease;
      margin: 8px 0;
    }

    .article-url:hover {
      background: #ffb703;
      color: white;
      transform: translateX(4px);
      box-shadow: 0 3px 8px rgba(255, 183, 3, 0.4);
    }

    .article-url::before {
      content: '🔗';
      font-size: 1.1rem;
    }

    /* Enhanced article card styling */
    .article-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-left: 6px solid #e63946;
    }

    .article-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .article-url-primary {
      display: inline-block;
      background: linear-gradient(135deg, #e63946 0%, #d62839 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
      box-shadow: 0 4px 12px rgba(230, 57, 70, 0.4);
      transition: all 0.3s ease;
      margin: 12px 0;
    }

    .article-url-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(230, 57, 70, 0.6);
      background: linear-gradient(135deg, #d62839 0%, #c41e2a 100%);
    }

    .article-url-primary::before {
      content: '🔗 ';
      margin-right: 8px;
      font-size: 1.2rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }

    .info-card {
      background: #f8f9fa;
      border-left: 4px solid #457b9d;
      padding: 12px;
      border-radius: 6px;
    }

    .info-card-label {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .info-card-value {
      font-size: 1rem;
      color: #333;
      font-weight: 500;
    }

    .impact-rating {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #ffb703 0%, #fb8500 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 1.1rem;
      box-shadow: 0 3px 8px rgba(255, 183, 3, 0.3);
    }

    .price-bar {
      width: 100%;
      height: 32px;
      background: linear-gradient(90deg, #e8f4f8 0%, #457b9d 100%);
      border-radius: 6px;
      position: relative;
      margin: 12px 0;
      display: flex;
      align-items: center;
      padding: 0 12px;
      color: white;
      font-weight: bold;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }

    .spec-list {
      list-style: none;
      padding: 0;
      margin: 12px 0;
    }

    .spec-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: white;
      border-radius: 6px;
      margin: 8px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border-left: 3px solid #457b9d;
    }

    .spec-item::before {
      content: '✓';
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: #457b9d;
      color: white;
      border-radius: 50%;
      font-weight: bold;
      flex-shrink: 0;
    }

    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0;
    }

    .tag {
      background: linear-gradient(135deg, #f1faee 0%, #a8dadc 100%);
      color: #023047;
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 0.9rem;
      font-weight: 600;
      border: 2px solid #457b9d;
    }

    .summary-box {
      background: linear-gradient(135deg, #fff9e6 0%, #ffe8cc 100%);
      border: 2px solid #ffb703;
      border-radius: 10px;
      padding: 16px;
      margin: 16px 0;
      box-shadow: 0 3px 8px rgba(255, 183, 3, 0.2);
    }

    .summary-box::before {
      content: '📝 要約';
      display: block;
      font-weight: bold;
      color: #fb8500;
      margin-bottom: 8px;
      font-size: 1.1rem;
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

    .section-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-left: 6px solid #e63946;
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .section-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

    .section-card h2 {
      margin-top: 0;
      border-left: none;
      padding-left: 0;
      position: relative;
    }

    .section-card h2::before {
      content: '📊';
      margin-right: 10px;
      font-size: 1.5rem;
    }

    .section-content {
      margin-top: 15px;
    }

    .url-links {
      background: #fff9e6;
      border: 2px solid #ffb703;
      border-radius: 10px;
      padding: 20px;
      margin: 30px 0;
    }

    .url-links h3 {
      color: #fb8500;
      margin-top: 0;
      font-size: 1.3rem;
      display: flex;
      align-items: center;
    }

    .url-links h3::before {
      content: '🔗';
      margin-right: 10px;
      font-size: 1.4rem;
    }

    .url-card {
      background: white;
      border-left: 4px solid #ffb703;
      border-radius: 8px;
      padding: 15px;
      margin: 12px 0;
      transition: all 0.2s ease;
    }

    .url-card:hover {
      border-left-width: 8px;
      padding-left: 19px;
      box-shadow: 0 3px 10px rgba(251, 133, 0, 0.2);
    }

    .url-card a {
      color: #023047;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
      display: block;
      margin-bottom: 8px;
      word-break: break-all;
    }

    .url-card a:hover {
      color: #e63946;
      text-decoration: underline;
    }

    .url-context {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.6;
      margin-top: 5px;
    }

    .chart-container {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 20px;
      margin: 25px 0;
      overflow-x: auto;
    }

    .chart-title {
      font-size: 1.2rem;
      font-weight: bold;
      color: #457b9d;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }

    .chart-title::before {
      content: '📈';
      margin-right: 10px;
      font-size: 1.3rem;
    }

    a {
      color: #457b9d;
      text-decoration: none;
      border-bottom: 2px solid transparent;
      transition: border-bottom 0.2s ease;
    }

    a:hover {
      border-bottom: 2px solid #e63946;
    }

    code {
      background: #f1f3f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #e63946;
    }

    blockquote {
      border-left: 4px solid #ffb703;
      background: #fff9e6;
      padding: 15px 20px;
      margin: 20px 0;
      font-style: italic;
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

      .section-card {
        box-shadow: none;
        page-break-inside: avoid;
      }
    }

    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .container {
        padding: 20px;
      }

      h1 {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${html}

    ${
      urls.length > 0
        ? `
    <div class="url-links">
      <h3>関連リンク・参照URL</h3>
      ${urls
        .map(
          (item) => `
        <div class="url-card">
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.url}</a>
          <div class="url-context">${item.context.replace(item.url, '').trim()}</div>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

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
