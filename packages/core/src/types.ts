import { z } from 'zod';

// Source types
export const SourceTypeSchema = z.enum(['prtimes', 'media', 'company', 'sns']);
export type SourceType = z.infer<typeof SourceTypeSchema>;

// Extractor types
export const ExtractorSchema = z.enum(['gemini', 'rule', 'none']);
export type Extractor = z.infer<typeof ExtractorSchema>;

// AI role types
export const AIRoleSchema = z.enum(['classify', 'compare', 'trend', 'strategy', 'newspaper']);
export type AIRole = z.infer<typeof AIRoleSchema>;

// Company configuration
export const CompanySchema = z.object({
  name: z.string(),
  domain: z.string(),
  paths: z.array(z.string()),
});
export type Company = z.infer<typeof CompanySchema>;

// Sources configuration
export const SourcesConfigSchema = z.object({
  pr_times_queries: z.array(z.string()),
  media_rss: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })),
  instagram_rss: z.object({
    tags: z.array(z.string()),
    provider: z.string(),
    urls: z.array(z.string()).optional(),
  }),
  x_queries: z.array(z.string()),
  youtube_channels: z.array(z.string()),
});
export type SourcesConfig = z.infer<typeof SourcesConfigSchema>;

// Database schemas
export const SourceRawSchema = z.object({
  id: z.string().uuid(),
  source_type: SourceTypeSchema,
  url: z.string(),
  fetched_at: z.string().datetime(),
  content: z.string(),
  hash_sha256: z.string(),
  meta: z.record(z.unknown()).default({}),
});
export type SourceRaw = z.infer<typeof SourceRawSchema>;

export const ExtractSchema = z.object({
  id: z.string().uuid(),
  raw_id: z.string().uuid(),
  text: z.string(),
  tables: z.array(z.unknown()).default([]),
  images: z.array(z.unknown()).default([]),
  extractor: ExtractorSchema,
  version: z.string().default('v1'),
  created_at: z.string().datetime(),
});
export type Extract = z.infer<typeof ExtractSchema>;

export const AIOutputSchema = z.object({
  id: z.string().uuid(),
  extract_id: z.string().uuid(),
  role: AIRoleSchema,
  model: z.string(),
  output_md: z.string().nullable(),
  output_json: z.record(z.unknown()).nullable(),
  tokens_in: z.number().int().default(0),
  tokens_out: z.number().int().default(0),
  usd_cost: z.number().default(0),
  created_at: z.string().datetime(),
});
export type AIOutput = z.infer<typeof AIOutputSchema>;

export const TrendKPISchema = z.object({
  id: z.string().uuid(),
  date: z.string().date(),
  keyword: z.string(),
  source: z.enum(['sns', 'media', 'company']),
  count: z.number().int(),
  meta: z.record(z.unknown()).default({}),
});
export type TrendKPI = z.infer<typeof TrendKPISchema>;

export const UsageMeterSchema = z.object({
  id: z.string().uuid(),
  day: z.string().date(),
  model: z.string(),
  calls: z.number().int().default(0),
  tokens_in: z.number().int().default(0),
  tokens_out: z.number().int().default(0),
  usd_cost: z.number().default(0),
  created_at: z.string().datetime(),
});
export type UsageMeter = z.infer<typeof UsageMeterSchema>;

export const CreditBalanceSchema = z.object({
  id: z.string().uuid(),
  provider: z.enum(['anthropic', 'google']),
  captured_at: z.string().datetime(),
  balance_usd: z.number(),
});
export type CreditBalance = z.infer<typeof CreditBalanceSchema>;

// Classification output
export const ClassificationOutputSchema = z.object({
  type: z.enum(['product', 'spec', 'price', 'regulation', 'case_study', 'recruitment']),
  company: z.string(),
  product: z.string().nullable(),
  price_band: z.string().nullable(),
  specs: z.array(z.string()),
  topic_tags: z.array(z.string()),
});
export type ClassificationOutput = z.infer<typeof ClassificationOutputSchema>;

// Comparison output
export const ComparisonOutputSchema = z.object({
  company: z.string(),
  category: z.string(),
  comparison_table: z.string(), // Markdown table
  ghouse_impact: z.array(z.string()).length(3), // Exactly 3 impact points
});
export type ComparisonOutput = z.infer<typeof ComparisonOutputSchema>;

// Trend output
export const TrendOutputSchema = z.object({
  keyword: z.string(),
  frequency: z.number(),
  change_rate: z.number(),
  hypothesis: z.string(),
  next_observation: z.string(),
});
export type TrendOutput = z.infer<typeof TrendOutputSchema>;

// Strategy output
export const StrategyOutputSchema = z.object({
  department: z.enum(['sales', 'design', 'marketing', 'product']),
  actions: z.array(z.object({
    action: z.string(),
    owner: z.string(),
    deadline: z.string(),
    reason: z.string(),
  })),
});
export type StrategyOutput = z.infer<typeof StrategyOutputSchema>;

// Usage metrics for cost dashboard
export interface UsageMetrics {
  today_cost: number;
  today_tokens_in: number;
  today_tokens_out: number;
  today_calls: number;
  avg_7d_cost: number;
  balance: number;
  remaining_reports: number;
  month_total: number;
}
