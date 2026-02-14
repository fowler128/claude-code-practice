-- Agent Layer Database Schema
-- First-class agent infrastructure for BizDeedz Platform OS

-- Agent Directory: Registry of all parent agents
CREATE TABLE IF NOT EXISTS agent_directory (
  agent_id VARCHAR(100) PRIMARY KEY,
  agent_name VARCHAR(255) NOT NULL,
  agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('task_executor', 'content_generator', 'data_enrichment', 'qa_reviewer', 'orchestrator', 'analyst')),
  description TEXT,
  capabilities JSONB, -- Array of capabilities/skills
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  requires_approval BOOLEAN DEFAULT false,
  approval_roles VARCHAR(50)[], -- Roles that can approve this agent's output
  is_active BOOLEAN DEFAULT true,
  max_cost_per_run DECIMAL(10, 2), -- Cost cap per execution
  daily_run_limit INTEGER, -- Max runs per day
  metadata_json JSONB,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sub-Agent Directory: Registry of specialized sub-agents
CREATE TABLE IF NOT EXISTS sub_agent_directory (
  sub_agent_id VARCHAR(100) PRIMARY KEY,
  parent_agent_id VARCHAR(100) REFERENCES agent_directory(agent_id),
  sub_agent_name VARCHAR(255) NOT NULL,
  sub_agent_type VARCHAR(50) NOT NULL,
  description TEXT,
  specialization VARCHAR(100), -- e.g., "lead_scoring", "content_qa", "data_extraction"
  prompt_template TEXT,
  model_preference VARCHAR(50), -- e.g., "gpt-4", "claude-3-opus"
  temperature DECIMAL(3, 2),
  max_tokens INTEGER,
  is_active BOOLEAN DEFAULT true,
  metadata_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Orders: Tasks assigned to agents
CREATE TABLE IF NOT EXISTS work_orders (
  work_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_number VARCHAR(50) UNIQUE NOT NULL,
  agent_id VARCHAR(100) REFERENCES agent_directory(agent_id),
  order_type VARCHAR(50) NOT NULL, -- e.g., "lead_enrichment", "content_generation", "qa_review"
  status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'completed', 'failed', 'cancelled', 'needs_review', 'approved', 'rejected')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Related entities
  matter_id UUID REFERENCES matters(matter_id),
  task_id UUID,
  related_entity_type VARCHAR(50), -- 'lead', 'content', 'matter', 'task'
  related_entity_id VARCHAR(100),

  -- Input/Output
  input_data JSONB NOT NULL,
  output_data JSONB,
  error_message TEXT,

  -- Metadata
  requested_by UUID REFERENCES users(user_id),
  assigned_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(user_id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,

  -- Cost tracking
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  tokens_used INTEGER,

  metadata_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Run Logs: Audit trail for every agent execution
CREATE TABLE IF NOT EXISTS agent_run_logs (
  run_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(work_order_id),
  agent_id VARCHAR(100) REFERENCES agent_directory(agent_id),
  sub_agent_id VARCHAR(100) REFERENCES sub_agent_directory(sub_agent_id),

  run_type VARCHAR(50) NOT NULL, -- 'scheduled', 'on_demand', 'triggered'
  trigger_event VARCHAR(100), -- Event that triggered this run

  -- Execution details
  status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'timeout', 'cancelled')),
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  -- Input/Output snapshots
  input_snapshot JSONB,
  output_snapshot JSONB,
  error_details JSONB,

  -- Cost tracking
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  tokens_total INTEGER,
  cost_usd DECIMAL(10, 4),
  model_used VARCHAR(50),

  -- Approval tracking
  requires_human_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(user_id),
  review_status VARCHAR(50), -- 'pending', 'approved', 'rejected', 'modified'
  review_timestamp TIMESTAMP,
  review_notes TEXT,

  metadata_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prompt Packs: Reusable prompt templates
CREATE TABLE IF NOT EXISTS prompt_packs (
  prompt_pack_id VARCHAR(100) PRIMARY KEY,
  pack_name VARCHAR(255) NOT NULL,
  pack_version VARCHAR(20) NOT NULL,
  category VARCHAR(50), -- 'lead_enrichment', 'content_generation', 'qa_review', 'analysis'

  -- Prompts
  system_prompt TEXT,
  user_prompt_template TEXT NOT NULL,
  example_inputs JSONB,
  example_outputs JSONB,

  -- Configuration
  recommended_model VARCHAR(50),
  recommended_temperature DECIMAL(3, 2),
  recommended_max_tokens INTEGER,

  -- Validation
  input_schema JSONB, -- JSON schema for input validation
  output_schema JSONB, -- JSON schema for output validation

  is_active BOOLEAN DEFAULT true,
  tags VARCHAR(50)[],
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(pack_name, pack_version)
);

-- Governance Rules: Control agent behavior and approval gates
CREATE TABLE IF NOT EXISTS governance_rules (
  rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('approval_gate', 'cost_limit', 'rate_limit', 'content_filter', 'access_control')),

  -- Scope
  applies_to_agent_id VARCHAR(100) REFERENCES agent_directory(agent_id),
  applies_to_order_type VARCHAR(50),
  applies_to_risk_level VARCHAR(20),

  -- Rule configuration
  rule_config JSONB NOT NULL,
  /*
  Examples:
  - approval_gate: {"content_types": ["outbound_email", "social_post"], "requires_roles": ["attorney", "ops_lead"]}
  - cost_limit: {"max_per_run": 5.00, "max_daily": 50.00, "max_monthly": 1000.00}
  - rate_limit: {"max_runs_per_hour": 10, "max_runs_per_day": 100}
  - content_filter: {"blocked_keywords": ["urgent", "lawsuit"], "sensitive_data_check": true}
  */

  -- Actions
  violation_action VARCHAR(50) DEFAULT 'block' CHECK (violation_action IN ('block', 'require_approval', 'notify', 'log_only')),
  notify_roles VARCHAR(50)[],

  priority INTEGER DEFAULT 100, -- Lower number = higher priority
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  effective_until TIMESTAMP,

  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_directory_type ON agent_directory(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_directory_active ON agent_directory(is_active);

CREATE INDEX IF NOT EXISTS idx_sub_agent_parent ON sub_agent_directory(parent_agent_id);
CREATE INDEX IF NOT EXISTS idx_sub_agent_specialization ON sub_agent_directory(specialization);

CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_agent ON work_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_matter ON work_orders(matter_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_created ON work_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_entity ON work_orders(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_agent_run_logs_work_order ON agent_run_logs(work_order_id);
CREATE INDEX IF NOT EXISTS idx_agent_run_logs_agent ON agent_run_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_run_logs_started ON agent_run_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_agent_run_logs_review ON agent_run_logs(requires_human_review, review_status);

CREATE INDEX IF NOT EXISTS idx_prompt_packs_category ON prompt_packs(category);
CREATE INDEX IF NOT EXISTS idx_prompt_packs_active ON prompt_packs(is_active);

CREATE INDEX IF NOT EXISTS idx_governance_rules_agent ON governance_rules(applies_to_agent_id);
CREATE INDEX IF NOT EXISTS idx_governance_rules_type ON governance_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_governance_rules_active ON governance_rules(is_active);

-- Add triggers for updated_at
CREATE TRIGGER update_agent_directory_updated_at
  BEFORE UPDATE ON agent_directory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_agent_directory_updated_at
  BEFORE UPDATE ON sub_agent_directory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_packs_updated_at
  BEFORE UPDATE ON prompt_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_governance_rules_updated_at
  BEFORE UPDATE ON governance_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
