import { getSupabaseClient } from './client';
import {
  SourceRaw,
  Extract,
  AIOutput,
  TrendKPI,
  UsageMeter,
  CreditBalance,
  UsageMetrics,
  createLogger,
  formatDateJST,
} from '@ghouse/core';

const logger = createLogger('supakit:repos');

// ===== Source Raw Repository =====
export async function insertSourceRaw(data: Omit<SourceRaw, 'id' | 'fetched_at'>) {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from('sources_raw')
    .insert({
      source_type: data.source_type,
      url: data.url,
      content: data.content,
      hash_sha256: data.hash_sha256,
      meta: data.meta,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation (duplicate hash)
    if (error.code === '23505') {
      logger.debug({ hash: data.hash_sha256 }, 'Duplicate content detected, skipping');
      return null;
    }
    throw error;
  }

  return result as SourceRaw;
}

export async function getExistingUrls(sourceType?: string): Promise<Set<string>> {
  const supabase = getSupabaseClient();

  let query = supabase.from('sources_raw').select('url');

  if (sourceType) {
    query = query.eq('source_type', sourceType);
  }

  const { data, error } = await query;

  if (error) throw error;

  return new Set((data || []).map(r => r.url));
}

export async function getUnprocessedSourceRaws(limit = 100) {
  const supabase = getSupabaseClient();

  // Get all processed raw_ids
  const { data: processedIds } = await supabase
    .from('extracts')
    .select('raw_id');

  const processedIdSet = new Set(processedIds?.map(r => r.raw_id) || []);

  // Get all sources
  const { data: allSources, error } = await supabase
    .from('sources_raw')
    .select('*')
    .order('fetched_at', { ascending: false });

  if (error) throw error;

  // Filter unprocessed
  const unprocessed = (allSources || []).filter(s => !processedIdSet.has(s.id)).slice(0, limit);

  return unprocessed as SourceRaw[];
}

// ===== Extract Repository =====
export async function insertExtract(data: Omit<Extract, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from('extracts')
    .insert({
      raw_id: data.raw_id,
      text: data.text,
      tables: data.tables,
      images: data.images,
      extractor: data.extractor,
      version: data.version,
    })
    .select()
    .single();

  if (error) throw error;
  return result as Extract;
}

export async function getUnanalyzedExtracts(limit = 100) {
  const supabase = getSupabaseClient();

  // Get all analyzed extract_ids (only classify role to avoid duplicates)
  const { data: analyzedIds } = await supabase
    .from('ai_outputs')
    .select('extract_id')
    .eq('role', 'classify');

  const analyzedIdSet = new Set(analyzedIds?.map(r => r.extract_id) || []);

  // Get all extracts
  const { data: allExtracts, error } = await supabase
    .from('extracts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter unanalyzed
  const unanalyzed = (allExtracts || []).filter(e => !analyzedIdSet.has(e.id)).slice(0, limit);

  return unanalyzed as Extract[];
}

export async function getExtractById(id: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('extracts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Extract;
}

// ===== AI Output Repository =====
export async function insertAIOutput(data: Omit<AIOutput, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from('ai_outputs')
    .insert({
      extract_id: data.extract_id,
      role: data.role,
      model: data.model,
      output_md: data.output_md,
      output_json: data.output_json,
      tokens_in: data.tokens_in,
      tokens_out: data.tokens_out,
      usd_cost: data.usd_cost,
    })
    .select()
    .single();

  if (error) throw error;

  // Update usage meter
  await upsertUsageMeter({
    day: formatDateJST(),
    model: data.model,
    calls: 1,
    tokens_in: data.tokens_in,
    tokens_out: data.tokens_out,
    usd_cost: data.usd_cost,
  });

  return result as AIOutput;
}

export async function getAIOutputsByRole(role: string, limit = 100) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('ai_outputs')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as AIOutput[];
}

export async function getRecentAIOutputs(hoursAgo = 24) {
  const supabase = getSupabaseClient();
  const sinceDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('ai_outputs')
    .select('*')
    .gte('created_at', sinceDate)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AIOutput[];
}

export interface AIOutputWithSource extends AIOutput {
  extract?: Extract;
  source_url?: string;
  source_type?: string;
}

export async function getRecentAIOutputsWithSource(hoursAgo = 24) {
  const supabase = getSupabaseClient();
  const sinceDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('ai_outputs')
    .select(`
      *,
      extracts!inner(
        id,
        raw_id,
        text,
        extractor,
        created_at
      )
    `)
    .gte('created_at', sinceDate)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get source_raw data for each extract
  const outputs = data as any[];
  const enriched: AIOutputWithSource[] = await Promise.all(
    outputs.map(async (output) => {
      if (!output.extracts) return output;

      const extract = Array.isArray(output.extracts) ? output.extracts[0] : output.extracts;

      // Get source_raw
      const { data: sourceData } = await supabase
        .from('sources_raw')
        .select('url, source_type')
        .eq('id', extract.raw_id)
        .single();

      return {
        ...output,
        extracts: undefined, // Remove nested structure
        extract: extract,
        source_url: sourceData?.url,
        source_type: sourceData?.source_type,
      };
    })
  );

  return enriched;
}

// ===== Trend KPI Repository =====
export async function upsertTrendKPI(data: Omit<TrendKPI, 'id'>) {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from('trend_kpis')
    .upsert(
      {
        date: data.date,
        keyword: data.keyword,
        source: data.source,
        count: data.count,
        meta: data.meta,
      },
      {
        onConflict: 'date,keyword,source',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return result as TrendKPI;
}

export async function getTrendKPIs(days = 7) {
  const supabase = getSupabaseClient();
  const sinceDate = formatDateJST(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  const { data, error } = await supabase
    .from('trend_kpis')
    .select('*')
    .gte('date', sinceDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as TrendKPI[];
}

// ===== Usage Meter Repository =====
export async function upsertUsageMeter(data: Omit<UsageMeter, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();

  // Get existing record to add to it
  const { data: existing } = await supabase
    .from('usage_meter')
    .select('*')
    .eq('day', data.day)
    .eq('model', data.model)
    .single();

  const upsertData = existing
    ? {
        day: data.day,
        model: data.model,
        calls: (existing.calls || 0) + (data.calls || 0),
        tokens_in: (existing.tokens_in || 0) + (data.tokens_in || 0),
        tokens_out: (existing.tokens_out || 0) + (data.tokens_out || 0),
        usd_cost: Number((Number(existing.usd_cost || 0) + Number(data.usd_cost || 0)).toFixed(4)),
      }
    : data;

  const { data: result, error } = await supabase
    .from('usage_meter')
    .upsert(upsertData, {
      onConflict: 'day,model',
    })
    .select()
    .single();

  if (error) throw error;
  return result as UsageMeter;
}

export async function getUsageMetrics(): Promise<UsageMetrics> {
  const supabase = getSupabaseClient();
  const today = formatDateJST();

  // Today's usage
  const { data: todayData } = await supabase
    .from('usage_meter')
    .select('*')
    .eq('day', today);

  const todayUsage = todayData || [];
  const today_cost = todayUsage.reduce((sum, r) => sum + Number(r.usd_cost || 0), 0);
  const today_tokens_in = todayUsage.reduce((sum, r) => sum + (r.tokens_in || 0), 0);
  const today_tokens_out = todayUsage.reduce((sum, r) => sum + (r.tokens_out || 0), 0);
  const today_calls = todayUsage.reduce((sum, r) => sum + (r.calls || 0), 0);

  // Last 7 days average
  const since7d = formatDateJST(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const { data: last7dData } = await supabase
    .from('usage_meter')
    .select('*')
    .gte('day', since7d);

  const last7d = last7dData || [];
  const avg_7d_cost = last7d.length > 0
    ? last7d.reduce((sum, r) => sum + Number(r.usd_cost || 0), 0) / 7
    : today_cost;

  // This month total
  const monthStart = formatDateJST(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { data: monthData } = await supabase
    .from('usage_meter')
    .select('*')
    .gte('day', monthStart);

  const month_total = (monthData || []).reduce((sum, r) => sum + Number(r.usd_cost || 0), 0);

  // Latest balance
  const { data: balanceData } = await supabase
    .from('credit_balance')
    .select('*')
    .eq('provider', 'anthropic')
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  const balance = balanceData ? Number(balanceData.balance_usd) : 5.0;

  // Calculate remaining reports
  const report_unit_cost = Math.max(avg_7d_cost, today_cost, 0.01);
  const remaining_reports = Math.floor(balance / report_unit_cost);

  return {
    today_cost: Number(today_cost.toFixed(4)),
    today_tokens_in,
    today_tokens_out,
    today_calls,
    avg_7d_cost: Number(avg_7d_cost.toFixed(4)),
    balance: Number(balance.toFixed(2)),
    remaining_reports,
    month_total: Number(month_total.toFixed(4)),
  };
}

// ===== Credit Balance Repository =====
export async function insertCreditBalance(data: Omit<CreditBalance, 'id' | 'captured_at'>) {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from('credit_balance')
    .insert({
      provider: data.provider,
      balance_usd: data.balance_usd,
    })
    .select()
    .single();

  if (error) throw error;
  return result as CreditBalance;
}

export async function getLatestCreditBalance(provider: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('credit_balance')
    .select('*')
    .eq('provider', provider)
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data as CreditBalance | null;
}
