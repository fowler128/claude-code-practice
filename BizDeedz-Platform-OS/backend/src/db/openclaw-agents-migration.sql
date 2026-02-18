-- OpenClaw Agents Integration Schema
-- Enables autonomous agent execution with governance and escalation
-- This is separate from the existing agent_directory schema

-- Agents: OpenClaw agent definitions
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  purpose TEXT,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  default_model VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Versions: Version control for agent prompts and tools
CREATE TABLE IF NOT EXISTS agent_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  system_prompt TEXT,
  tools_allowed JSONB, -- Array of tool names/permissions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, version)
);

-- Agent Runs: Execution records
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  tenant_id VARCHAR(100), -- For multi-tenancy
  status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'needs_review', 'failed')),
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  cost NUMERIC(10, 4), -- Cost in USD
  latency_ms INTEGER,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Run Inputs: Separate table for input context (can be large)
CREATE TABLE IF NOT EXISTS agent_run_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  input_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Run Outputs: Separate table for output (can be large)
CREATE TABLE IF NOT EXISTS agent_run_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  output_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Escalations: When agents need human review
CREATE TABLE IF NOT EXISTS agent_escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason TEXT NOT NULL,
  assigned_to VARCHAR(100), -- User ID or role
  due_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active);

CREATE INDEX IF NOT EXISTS idx_agent_versions_agent ON agent_versions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_versions_lookup ON agent_versions(agent_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_tenant ON agent_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started ON agent_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_run_inputs_run ON agent_run_inputs(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_run_outputs_run ON agent_run_outputs(run_id);

CREATE INDEX IF NOT EXISTS idx_agent_escalations_run ON agent_escalations(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_escalations_pending ON agent_escalations(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_escalations_due ON agent_escalations(due_at) WHERE resolved_at IS NULL;

-- Sample seed data for OpenClaw agents
INSERT INTO agents (name, purpose, risk_level, default_model, is_active) VALUES
  ('markdown-organizer', 'Organize and structure Markdown files with metadata and cross-references', 'low', 'claude-3-5-sonnet-20241022', true),
  ('content-qa-reviewer', 'Review content drafts for quality, brand alignment, and compliance', 'medium', 'claude-3-5-sonnet-20241022', true),
  ('lead-enrichment', 'Enrich lead data with additional context and scoring', 'low', 'gpt-4o-mini', true),
  ('document-analyzer', 'Extract key information from legal documents', 'high', 'claude-3-5-sonnet-20241022', true)
ON CONFLICT (name) DO NOTHING;

-- Sample version for markdown-organizer
INSERT INTO agent_versions (agent_id, version, system_prompt, tools_allowed)
SELECT
  id,
  1,
  'You are a Markdown organization specialist. Your job is to analyze Markdown files and organize them by adding front matter metadata, fixing formatting issues, and creating cross-references between related documents. Always preserve the original content while improving structure.',
  '["read_file", "write_file", "list_directory", "create_metadata"]'::jsonb
FROM agents WHERE name = 'markdown-organizer'
ON CONFLICT (agent_id, version) DO NOTHING;

-- Sample version for content-qa-reviewer
INSERT INTO agent_versions (agent_id, version, system_prompt, tools_allowed)
SELECT
  id,
  1,
  'You are a content QA specialist. Review content drafts for: 1) Brand voice alignment, 2) Factual accuracy, 3) Legal compliance, 4) Engagement potential. Provide actionable feedback and a pass/fail recommendation.',
  '["read_file", "web_search", "analyze_sentiment"]'::jsonb
FROM agents WHERE name = 'content-qa-reviewer'
ON CONFLICT (agent_id, version) DO NOTHING;
