-- ===================================================================
-- クリーンアップ & マイグレーション（完全版）
-- ===================================================================
-- このSQLは既存のテーブルを削除してから、新しくテーブルを作成します
-- ===================================================================

-- ステップ1: 既存のテーブルを削除（存在する場合）
DROP TABLE IF EXISTS ai_outputs CASCADE;
DROP TABLE IF EXISTS extracts CASCADE;
DROP TABLE IF EXISTS sources_raw CASCADE;
DROP TABLE IF EXISTS trend_kpis CASCADE;
DROP TABLE IF EXISTS usage_meter CASCADE;
DROP TABLE IF EXISTS credit_balance CASCADE;

-- ステップ2: UUID拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- テーブル作成
-- ===================================================================

-- ① 原本 (Raw sources)
CREATE TABLE sources_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('prtimes', 'media', 'company', 'sns')),
  url TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content TEXT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  UNIQUE(hash_sha256)
);

CREATE INDEX idx_sources_raw_source_type ON sources_raw(source_type);
CREATE INDEX idx_sources_raw_fetched_at ON sources_raw(fetched_at DESC);
CREATE INDEX idx_sources_raw_hash ON sources_raw(hash_sha256);

-- ② 抽出/正規化 (Extracts)
CREATE TABLE extracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_id UUID REFERENCES sources_raw(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  tables JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  extractor TEXT NOT NULL CHECK (extractor IN ('gemini', 'rule', 'none')),
  version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extracts_raw_id ON extracts(raw_id);
CREATE INDEX idx_extracts_created_at ON extracts(created_at DESC);

-- ③ AI出力 (AI outputs)
CREATE TABLE ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extract_id UUID REFERENCES extracts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('classify', 'compare', 'trend', 'strategy', 'newspaper')),
  model TEXT NOT NULL,
  output_md TEXT,
  output_json JSONB,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,
  usd_cost NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_outputs_extract_id ON ai_outputs(extract_id);
CREATE INDEX idx_ai_outputs_role ON ai_outputs(role);
CREATE INDEX idx_ai_outputs_created_at ON ai_outputs(created_at DESC);
CREATE INDEX idx_ai_outputs_model ON ai_outputs(model);

-- ④ トレンドKPI (Trend KPIs)
CREATE TABLE trend_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  keyword TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('sns', 'media', 'company')),
  count INT NOT NULL,
  meta JSONB DEFAULT '{}'
);

CREATE INDEX idx_trend_kpis_date ON trend_kpis(date DESC);
CREATE INDEX idx_trend_kpis_keyword ON trend_kpis(keyword);
CREATE INDEX idx_trend_kpis_source ON trend_kpis(source);
CREATE UNIQUE INDEX idx_trend_kpis_unique ON trend_kpis(date, keyword, source);

-- ⑤ API料金メータ (Usage meter)
CREATE TABLE usage_meter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day DATE NOT NULL,
  model TEXT NOT NULL,
  calls INT DEFAULT 0,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,
  usd_cost NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day, model)
);

CREATE INDEX idx_usage_meter_day ON usage_meter(day DESC);
CREATE INDEX idx_usage_meter_model ON usage_meter(model);

-- ⑥ 残高スナップショット (Credit balance)
CREATE TABLE credit_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'google')),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  balance_usd NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_credit_balance_provider ON credit_balance(provider);
CREATE INDEX idx_credit_balance_captured_at ON credit_balance(captured_at DESC);

-- 初期残高を設定
INSERT INTO credit_balance (provider, balance_usd)
VALUES ('anthropic', 5.00);

-- ===================================================================
-- Row Level Security (RLS) 設定
-- ===================================================================

-- RLSを有効化
ALTER TABLE sources_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_meter ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balance ENABLE ROW LEVEL SECURITY;

-- Service Role: 全アクセス許可
CREATE POLICY "Service role has full access to sources_raw" ON sources_raw FOR ALL USING (true);
CREATE POLICY "Service role has full access to extracts" ON extracts FOR ALL USING (true);
CREATE POLICY "Service role has full access to ai_outputs" ON ai_outputs FOR ALL USING (true);
CREATE POLICY "Service role has full access to trend_kpis" ON trend_kpis FOR ALL USING (true);
CREATE POLICY "Service role has full access to usage_meter" ON usage_meter FOR ALL USING (true);
CREATE POLICY "Service role has full access to credit_balance" ON credit_balance FOR ALL USING (true);

-- Anon Role: 読み取り専用
CREATE POLICY "Anon can read sources_raw" ON sources_raw FOR SELECT USING (true);
CREATE POLICY "Anon can read extracts" ON extracts FOR SELECT USING (true);
CREATE POLICY "Anon can read ai_outputs" ON ai_outputs FOR SELECT USING (true);
CREATE POLICY "Anon can read trend_kpis" ON trend_kpis FOR SELECT USING (true);
CREATE POLICY "Anon can read usage_meter" ON usage_meter FOR SELECT USING (true);
CREATE POLICY "Anon can read credit_balance" ON credit_balance FOR SELECT USING (true);
