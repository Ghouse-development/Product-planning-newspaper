import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '@ghouse/core';

const logger = createLogger('ai:claude');

let claudeClient: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (claudeClient) {
    return claudeClient;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  claudeClient = new Anthropic({ apiKey });
  return claudeClient;
}

export interface ClaudeResponse {
  text: string;
  tokens_in: number;
  tokens_out: number;
  usd_cost: number;
}

/**
 * Call Claude API with prompt
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
  const client = getClaudeClient();

  const model = options.model || 'claude-3-5-sonnet-20241022';
  const maxTokens = options.maxTokens || 4096;

  logger.info({ model, promptLength: prompt.length }, 'Calling Claude API');

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: options.system,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('\n');

  const tokens_in = response.usage.input_tokens;
  const tokens_out = response.usage.output_tokens;

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
