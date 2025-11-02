import { createLogger } from '@ghouse/core';

const logger = createLogger('ai:claude');

export interface ClaudeResponse {
  text: string;
  tokens_in: number;
  tokens_out: number;
  usd_cost: number;
}

/**
 * Call Claude API with prompt using fetch (Vercel-compatible)
 * Model: claude-3-5-sonnet-20241022 (latest Sonnet 3.5)
 */
export async function callClaude(
  prompt: string,
  options: {
    system?: string;
    model?: string;
    maxTokens?: number;
  } = {}
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  const model = options.model || 'claude-3-5-sonnet-20241022';
  const maxTokens = options.maxTokens || 4096;

  logger.info({ model, promptLength: prompt.length }, 'Calling Claude API via fetch');

  const requestBody: any = {
    model,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  if (options.system) {
    requestBody.system = options.system;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as any;

  const text = data.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('\n');

  const tokens_in = data.usage.input_tokens;
  const tokens_out = data.usage.output_tokens;

  // Pricing for claude-3-5-sonnet-20241022
  // Input: $3.00 per 1M tokens
  // Output: $15.00 per 1M tokens
  const usd_cost = (tokens_in / 1_000_000) * 3.0 + (tokens_out / 1_000_000) * 15.0;

  logger.info(
    { tokens_in, tokens_out, usd_cost: usd_cost.toFixed(4) },
    'Claude API response received'
  );

  return {
    text,
    tokens_in,
    tokens_out,
    usd_cost: Number(usd_cost.toFixed(4)),
  };
}
