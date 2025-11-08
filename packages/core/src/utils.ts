import crypto from 'crypto';

/**
 * Generate SHA-256 hash for content deduplication
 */
export function generateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry logic with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = 2 } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoff, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Format date to JST YYYY-MM-DD
 */
export function formatDateJST(date: Date = new Date()): string {
  return date.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');
}

/**
 * Format datetime to JST ISO string
 */
export function formatDateTimeJST(date: Date = new Date()): string {
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T = unknown>(json: string, fallback: T): T {
  try {
    // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    let cleanJson = json.trim();
    if (cleanJson.startsWith('```')) {
      // Remove opening code fence (```json or ```)
      cleanJson = cleanJson.replace(/^```(?:json)?\s*\n/, '');
      // Remove closing code fence
      cleanJson = cleanJson.replace(/\n```\s*$/, '');
    }
    return JSON.parse(cleanJson) as T;
  } catch {
    return fallback;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}
