-- Work Order Estimates Table
-- Stores preflight token and cost estimates before execution

CREATE TABLE IF NOT EXISTS work_order_estimates (
  estimate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(work_order_id) ON DELETE CASCADE,

  -- Estimation inputs
  assembled_prompt_length INTEGER NOT NULL, -- Characters in full prompt
  model VARCHAR(50) NOT NULL, -- e.g., "gpt-4", "claude-3-opus"

  -- Token estimates
  estimated_input_tokens INTEGER NOT NULL,
  estimated_output_tokens INTEGER NOT NULL,
  safety_margin DECIMAL(3, 2) DEFAULT 1.2, -- Multiplier for safety
  expected_total_tokens INTEGER NOT NULL, -- With safety margin
  worst_case_tokens INTEGER NOT NULL, -- Max possible (e.g., max_turns * max_output)

  -- Cost estimates
  input_token_price DECIMAL(10, 6), -- Price per 1K input tokens
  output_token_price DECIMAL(10, 6), -- Price per 1K output tokens
  estimated_cost_usd DECIMAL(10, 4),
  worst_case_cost_usd DECIMAL(10, 4),

  -- Configuration
  max_output_tokens INTEGER,
  expected_turns INTEGER DEFAULT 1,
  max_turns INTEGER DEFAULT 1,

  -- Budget check results
  within_per_run_limit BOOLEAN DEFAULT true,
  within_daily_budget BOOLEAN DEFAULT true,
  daily_budget_remaining DECIMAL(10, 2),
  blocking_reason TEXT,

  -- Metadata
  estimate_method VARCHAR(50) DEFAULT 'fallback', -- 'tiktoken', 'claude_tokenizer', 'fallback'
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(work_order_id, created_at) -- Allow multiple estimates over time
);

-- Actual execution results table (extends agent_run_logs concept)
CREATE TABLE IF NOT EXISTS work_order_executions (
  execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(work_order_id) ON DELETE CASCADE,
  estimate_id UUID REFERENCES work_order_estimates(estimate_id),

  -- Execution details
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'timeout', 'cancelled')),

  -- Actual usage
  actual_input_tokens INTEGER,
  actual_output_tokens INTEGER,
  actual_total_tokens INTEGER,
  actual_cost_usd DECIMAL(10, 4),

  -- Variance from estimate
  token_variance_pct DECIMAL(5, 2), -- % difference from estimate
  cost_variance_pct DECIMAL(5, 2),

  -- Response data
  model_used VARCHAR(50),
  provider VARCHAR(50), -- 'openai', 'anthropic', 'openrouter'
  response_data JSONB,
  error_details JSONB,

  -- Execution metadata
  execution_duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  override_approved_by UUID REFERENCES users(user_id), -- If budget override was used
  override_reason TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model pricing configuration table
CREATE TABLE IF NOT EXISTS model_pricing (
  model_id VARCHAR(100) PRIMARY KEY,
  model_name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,

  -- Pricing per 1K tokens
  input_price_per_1k DECIMAL(10, 6) NOT NULL,
  output_price_per_1k DECIMAL(10, 6) NOT NULL,

  -- Context and output limits
  context_window INTEGER,
  max_output_tokens INTEGER,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Insert default model pricing (as of Feb 2026)
INSERT INTO model_pricing (model_id, model_name, provider, input_price_per_1k, output_price_per_1k, context_window, max_output_tokens) VALUES
-- OpenAI Models
('gpt-4-turbo', 'GPT-4 Turbo', 'openai', 0.01000, 0.03000, 128000, 4096),
('gpt-4', 'GPT-4', 'openai', 0.03000, 0.06000, 8192, 4096),
('gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', 0.00050, 0.00150, 16385, 4096),

-- Anthropic Models
('claude-3-opus', 'Claude 3 Opus', 'anthropic', 0.01500, 0.07500, 200000, 4096),
('claude-3-sonnet', 'Claude 3 Sonnet', 'anthropic', 0.00300, 0.01500, 200000, 4096),
('claude-3-haiku', 'Claude 3 Haiku', 'anthropic', 0.00025, 0.00125, 200000, 4096),

-- OpenRouter aggregated models
('openrouter/gpt-4-turbo', 'GPT-4 Turbo (OpenRouter)', 'openrouter', 0.01000, 0.03000, 128000, 4096),
('openrouter/claude-3-opus', 'Claude 3 Opus (OpenRouter)', 'openrouter', 0.01500, 0.07500, 200000, 4096)
ON CONFLICT (model_id) DO NOTHING;

-- Budget tracking table (daily aggregate)
CREATE TABLE IF NOT EXISTS daily_budget_tracking (
  tracking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Budget limits (can be updated)
  daily_limit DECIMAL(10, 2) DEFAULT 100.00,
  warning_threshold DECIMAL(10, 2) DEFAULT 80.00,

  -- Actual spend
  total_estimated_spend DECIMAL(10, 2) DEFAULT 0.00,
  total_actual_spend DECIMAL(10, 2) DEFAULT 0.00,

  -- Work order counts
  total_work_orders INTEGER DEFAULT 0,
  completed_work_orders INTEGER DEFAULT 0,
  failed_work_orders INTEGER DEFAULT 0,
  blocked_work_orders INTEGER DEFAULT 0,

  -- Last updated
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tracking_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_order_estimates_work_order ON work_order_estimates(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_estimates_created ON work_order_estimates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_order_estimates_blocking ON work_order_estimates(within_per_run_limit, within_daily_budget);

CREATE INDEX IF NOT EXISTS idx_work_order_executions_work_order ON work_order_executions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_executions_estimate ON work_order_executions(estimate_id);
CREATE INDEX IF NOT EXISTS idx_work_order_executions_started ON work_order_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_daily_budget_tracking_date ON daily_budget_tracking(tracking_date DESC);

-- Add triggers
CREATE TRIGGER update_model_pricing_updated_at
  BEFORE UPDATE ON model_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update daily budget tracking
CREATE OR REPLACE FUNCTION update_daily_budget()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_budget_tracking (tracking_date, total_actual_spend, total_work_orders)
  VALUES (CURRENT_DATE, NEW.actual_cost_usd, 1)
  ON CONFLICT (tracking_date)
  DO UPDATE SET
    total_actual_spend = daily_budget_tracking.total_actual_spend + COALESCE(NEW.actual_cost_usd, 0),
    total_work_orders = daily_budget_tracking.total_work_orders + 1,
    completed_work_orders = CASE WHEN NEW.status = 'completed'
                            THEN daily_budget_tracking.completed_work_orders + 1
                            ELSE daily_budget_tracking.completed_work_orders END,
    failed_work_orders = CASE WHEN NEW.status = 'failed'
                         THEN daily_budget_tracking.failed_work_orders + 1
                         ELSE daily_budget_tracking.failed_work_orders END,
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_budget
  AFTER INSERT OR UPDATE ON work_order_executions
  FOR EACH ROW
  WHEN (NEW.actual_cost_usd IS NOT NULL)
  EXECUTE FUNCTION update_daily_budget();
