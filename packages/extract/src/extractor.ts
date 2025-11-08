import * as cheerio from 'cheerio';
import { callGemini } from '@ghouse/ai';
import { createLogger, safeJsonParse } from '@ghouse/core';

const logger = createLogger('extract:extractor');

export interface ExtractedContent {
  text: string;
  tables: string[];
  images: Array<{ url: string; alt: string }>;
}

/**
 * Extract content using rule-based approach
 */
export async function extractWithRules(html: string): Promise<ExtractedContent> {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, footer, header, .advertisement').remove();

  // Extract text
  let text = $('body').text().trim().replace(/\s+/g, ' ');

  // If no body tag found (plain text input), use the content as-is
  if (!text || text.length === 0) {
    text = html.trim().replace(/\s+/g, ' ');
  }

  // Extract tables
  const tables: string[] = [];
  $('table').each((_, elem) => {
    const tableHtml = $(elem).html() || '';
    tables.push(tableHtml);
  });

  // Extract images
  const images: Array<{ url: string; alt: string }> = [];
  $('img').each((_, elem) => {
    const url = $(elem).attr('src') || '';
    const alt = $(elem).attr('alt') || '';
    if (url) {
      images.push({ url, alt });
    }
  });

  return { text, tables, images };
}

/**
 * Extract content using Gemini (for images and complex tables)
 */
export async function extractWithGemini(content: string): Promise<ExtractedContent> {
  logger.info('Extracting content with Gemini');

  const prompt = `以下のHTMLまたはテキストコンテンツから、重要な情報を抽出してください。

コンテンツ:
${content.substring(0, 5000)}

以下の形式で JSON で返してください：
{
  "text": "抽出されたテキスト（重要な部分のみ、500文字以内）",
  "tables": ["Markdown形式の表1", "Markdown形式の表2"],
  "images": [{"url": "画像URL", "alt": "説明"}]
}

必ず有効なJSONのみを返してください。`;

  try {
    const response = await callGemini(prompt);

    // Try to parse JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = safeJsonParse<ExtractedContent>(jsonMatch[0], {
        text: content.substring(0, 500),
        tables: [],
        images: [],
      });

      return extracted;
    }
  } catch (error) {
    logger.error({ error }, 'Failed to extract with Gemini');
  }

  // Fallback to rule-based extraction
  return extractWithRules(content);
}

/**
 * Main extraction function
 */
export async function extractContent(
  content: string,
  useGemini = false
): Promise<ExtractedContent> {
  if (useGemini) {
    return extractWithGemini(content);
  }

  // Default: rule-based extraction
  return extractWithRules(content);
}
