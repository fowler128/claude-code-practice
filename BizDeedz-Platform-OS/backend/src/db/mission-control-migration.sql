-- Mission Control Migration
-- Adds cost control fields to work_orders and fixes defect_reasons

-- Add estimate and actual fields to work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS est_tokens_input INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS est_tokens_output INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS est_tokens_total INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS est_cost_usd DECIMAL(10, 4);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS cost_cap_usd DECIMAL(10, 4);

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS model_provider VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS model_name VARCHAR(100);

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS preflight_ran_at TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS preflight_notes JSONB;

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_tokens_input INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_tokens_output INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_tokens_total INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_cost_usd DECIMAL(10, 4);

-- Add approval tracking
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approval_required_reason TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(user_id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Fix defect_reasons table - add category column
ALTER TABLE defect_reasons ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Update existing defect reasons with categories
UPDATE defect_reasons SET category = 'data' WHERE defect_reason_id IN (
  SELECT defect_reason_id FROM defect_reasons WHERE name ILIKE '%missing%' OR name ILIKE '%incomplete%'
) AND category IS NULL;

UPDATE defect_reasons SET category = 'format' WHERE defect_reason_id IN (
  SELECT defect_reason_id FROM defect_reasons WHERE name ILIKE '%format%' OR name ILIKE '%invalid%'
) AND category IS NULL;

UPDATE defect_reasons SET category = 'compliance' WHERE defect_reason_id IN (
  SELECT defect_reason_id FROM defect_reasons WHERE name ILIKE '%compliance%' OR name ILIKE '%required%'
) AND category IS NULL;

UPDATE defect_reasons SET category = 'quality' WHERE category IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_orders_preflight ON work_orders(preflight_ran_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_cost ON work_orders(est_cost_usd, actual_cost_usd);
CREATE INDEX IF NOT EXISTS idx_work_orders_model ON work_orders(model_provider, model_name);
CREATE INDEX IF NOT EXISTS idx_work_orders_approval ON work_orders(status) WHERE status = 'awaiting_approval';

-- Create view for today's spend analytics
CREATE OR REPLACE VIEW v_today_spend AS
SELECT
  CURRENT_DATE as spend_date,
  COUNT(*) as total_work_orders,
  SUM(actual_cost_usd) as total_actual_cost,
  SUM(est_cost_usd) as total_estimated_cost,
  MAX(actual_cost_usd) as max_work_order_cost,
  AVG(actual_cost_usd) as avg_work_order_cost
FROM work_orders
WHERE DATE(created_at) = CURRENT_DATE;

-- Create view for spend by agent today
CREATE OR REPLACE VIEW v_agent_spend_today AS
SELECT
  agent_id,
  COUNT(*) as work_order_count,
  SUM(actual_cost_usd) as total_cost,
  MAX(actual_cost_usd) as max_cost,
  AVG(actual_cost_usd) as avg_cost
FROM work_orders
WHERE DATE(created_at) = CURRENT_DATE
  AND actual_cost_usd IS NOT NULL
GROUP BY agent_id;

-- Create view for spend by work type today
CREATE OR REPLACE VIEW v_work_type_spend_today AS
SELECT
  order_type,
  COUNT(*) as work_order_count,
  SUM(actual_cost_usd) as total_cost,
  MAX(actual_cost_usd) as max_cost,
  AVG(actual_cost_usd) as avg_cost
FROM work_orders
WHERE DATE(created_at) = CURRENT_DATE
  AND actual_cost_usd IS NOT NULL
GROUP BY order_type;

-- Cron jobs table for Mission Control
CREATE TABLE IF NOT EXISTS cron_jobs (
  job_id VARCHAR(100) PRIMARY KEY,
  job_name VARCHAR(255) NOT NULL,
  schedule VARCHAR(100) NOT NULL, -- cron expression
  description TEXT,
  agent_id VARCHAR(100) REFERENCES agent_directory(agent_id),
  job_config JSONB,

  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  last_run_status VARCHAR(50), -- 'success', 'failed', 'timeout'
  last_run_duration_ms INTEGER,
  last_run_error TEXT,

  next_run_at TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_active ON cron_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_next_run ON cron_jobs(next_run_at) WHERE is_active = true;

-- Insert default cron jobs
INSERT INTO cron_jobs (job_id, job_name, schedule, description, agent_id, is_active, next_run_at) VALUES
('daily_ops_brief', 'Daily Operations Brief', '0 8 * * *', 'Generate daily operations summary at 8am', 'analytics_agent', true, CURRENT_DATE + INTERVAL '1 day' + INTERVAL '8 hours'),
('lead_enrichment_batch', 'Batch Lead Enrichment', '0 */4 * * *', 'Enrich pending leads every 4 hours', 'lead_enrichment_agent', true, CURRENT_TIMESTAMP + INTERVAL '4 hours'),
('matter_health_check', 'Matter Health Score Update', '0 2 * * *', 'Recalculate matter health scores at 2am', 'analytics_agent', true, CURRENT_DATE + INTERVAL '1 day' + INTERVAL '2 hours')
ON CONFLICT (job_id) DO NOTHING;

CREATE TRIGGER update_cron_jobs_updated_at
  BEFORE UPDATE ON cron_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
