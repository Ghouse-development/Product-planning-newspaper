import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '@ghouse/core';

const logger = createLogger('ai:gemini');

let geminiClient: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (geminiClient) {
    return geminiClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  geminiClient = new GoogleGenerativeAI(apiKey);
  return geminiClient;
}

export interface GeminiResponse {
  text: string;
  tokens_in: number;
  tokens_out: number;
  usd_cost: number;
}

/**
 * Call Gemini API with prompt
 * Model: gemini-1.5-flash (latest, fast and cost-effective)
 */
export async function callGemini(
  prompt: string,
  options: {
    model?: string;
  } = {}
): Promise<GeminiResponse> {
  const client = getGeminiClient();

  const modelName = options.model || 'gemini-1.5-flash';
  const model = client.getGenerativeModel({ model: modelName });

  logger.info({ model: modelName, promptLength: prompt.length }, 'Calling Gemini API');

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Gemini doesn't provide token counts in the same way
  // Estimate: ~4 chars per token
  const tokens_in = Math.ceil(prompt.length / 4);
  const tokens_out = Math.ceil(text.length / 4);

  // Pricing for gemini-1.5-pro (approximate)
  // Input: $1.25 per 1M tokens
  // Output: $5.00 per 1M tokens
  const usd_cost = (tokens_in / 1_000_000) * 1.25 + (tokens_out / 1_000_000) * 5.0;

  logger.info(
    { tokens_in, tokens_out, usd_cost: usd_cost.toFixed(4) },
    'Gemini API response received'
  );

  return {
    text,
    tokens_in,
    tokens_out,
    usd_cost: Number(usd_cost.toFixed(4)),
  };
}

/**
 * Extract content from image URL
 */
export async function extractFromImage(imageUrl: string): Promise<GeminiResponse> {
  const prompt = `この画像から以下の情報を抽出してください：

1. テキスト（OCR）
2. 表やデータがあれば、Markdown形式で
3. 重要な視覚要素の説明

JSON形式で返してください：
{
  "text": "抽出されたテキスト",
  "tables": ["Markdown形式の表1", "表2"],
  "description": "画像の説明"
}`;

  // For now, we'll use text-only since image input requires different handling
  // TODO: Implement proper image input with Gemini Vision
  return callGemini(prompt);
}
