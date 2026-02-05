-- BizDeedz Platform OS Database Schema
-- Sprint 1: Core tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS table (for authentication and role-based access)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'attorney', 'paralegal', 'intake_specialist', 'billing_specialist', 'ops_lead')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRACTICE_AREAS controlled list
CREATE TABLE IF NOT EXISTS practice_areas (
    practice_area_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MATTER_TYPES controlled list
CREATE TABLE IF NOT EXISTS matter_types (
    matter_type_id VARCHAR(50) PRIMARY KEY,
    practice_area_id VARCHAR(50) NOT NULL REFERENCES practice_areas(practice_area_id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MATTERS table (core entity)
CREATE TABLE IF NOT EXISTS matters (
    matter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_entity VARCHAR(255),
    practice_area_id VARCHAR(50) NOT NULL REFERENCES practice_areas(practice_area_id),
    matter_type_id VARCHAR(50) NOT NULL REFERENCES matter_types(matter_type_id),
    status VARCHAR(50) NOT NULL,
    lane VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    owner_user_id UUID REFERENCES users(user_id),
    assigned_roles TEXT[], -- Array of role names
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    target_dates JSONB, -- Array of date objects with labels
    closed_at TIMESTAMP,
    matter_health_score INTEGER CHECK (matter_health_score BETWEEN 0 AND 100),
    risk_tier VARCHAR(20) CHECK (risk_tier IN ('low', 'medium', 'high', 'critical')),
    last_defect_reason VARCHAR(100),
    defect_count INTEGER DEFAULT 0,
    billing_type VARCHAR(50) CHECK (billing_type IN ('hourly', 'fixed', 'subscription', 'contingency')),
    metadata_json JSONB, -- Jurisdiction, court, opposing counsel, etc.
    playbook_id VARCHAR(50),
    playbook_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_matters_status ON matters(status);
CREATE INDEX idx_matters_lane ON matters(lane);
CREATE INDEX idx_matters_owner ON matters(owner_user_id);
CREATE INDEX idx_matters_practice_area ON matters(practice_area_id);
CREATE INDEX idx_matters_matter_type ON matters(matter_type_id);

-- TASKS table
CREATE TABLE IF NOT EXISTS tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(matter_id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(user_id),
    assigned_role VARCHAR(50),
    due_date TIMESTAMP,
    sla_minutes INTEGER,
    status VARCHAR(50) NOT NULL CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'cancelled')),
    depends_on UUID[], -- Array of task_ids
    created_by_type VARCHAR(20) CHECK (created_by_type IN ('human', 'automation', 'ai')),
    created_by_id UUID REFERENCES users(user_id),
    completion_notes TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_tasks_matter ON tasks(matter_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ARTIFACT_TYPES controlled list
CREATE TABLE IF NOT EXISTS artifact_types (
    artifact_type_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ARTIFACTS table
CREATE TABLE IF NOT EXISTS artifacts (
    artifact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(matter_id) ON DELETE CASCADE,
    artifact_type_id VARCHAR(50) NOT NULL REFERENCES artifact_types(artifact_type_id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    required BOOLEAN DEFAULT false,
    received BOOLEAN DEFAULT false,
    qc_status VARCHAR(50) CHECK (qc_status IN ('pending', 'pass', 'fail', 'needs_review')),
    source VARCHAR(50) CHECK (source IN ('client', 'email', 'portal', 'drive', 'court', 'agency', 'internal')),
    storage_pointer TEXT, -- URI or reference to external storage
    file_type VARCHAR(50),
    file_size_bytes BIGINT,
    uploaded_by UUID REFERENCES users(user_id),
    uploaded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_artifacts_matter ON artifacts(matter_id);
CREATE INDEX idx_artifacts_type ON artifacts(artifact_type_id);
CREATE INDEX idx_artifacts_required ON artifacts(required);

-- PROMPT_LIBRARY table (for AI OS)
CREATE TABLE IF NOT EXISTS prompt_library (
    prompt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_key VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    use_case VARCHAR(100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    requires_approval BOOLEAN DEFAULT false,
    allowed_roles TEXT[],
    practice_areas TEXT[], -- Array of practice_area_ids
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prompt_key, version)
);

-- Index for performance
CREATE INDEX idx_prompt_library_key ON prompt_library(prompt_key);
CREATE INDEX idx_prompt_library_risk ON prompt_library(risk_level);

-- AI_RUNS table (audit log for all AI actions)
CREATE TABLE IF NOT EXISTS ai_runs (
    ai_run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(matter_id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,
    model_used VARCHAR(100) NOT NULL,
    prompt_id UUID REFERENCES prompt_library(prompt_id),
    prompt_version VARCHAR(20),
    inputs_pointer TEXT, -- Hashed reference or storage pointer
    output_pointer TEXT, -- Storage pointer to output
    output_preview TEXT, -- First 500 chars for quick view
    confidence DECIMAL(5,2),
    approvals_required BOOLEAN DEFAULT false,
    approval_status VARCHAR(50) CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required')),
    reviewer_user_id UUID REFERENCES users(user_id),
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    citations JSONB, -- Array of source references
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,4),
    error_message TEXT,
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_ai_runs_matter ON ai_runs(matter_id);
CREATE INDEX idx_ai_runs_approval_status ON ai_runs(approval_status);
CREATE INDEX idx_ai_runs_risk_level ON ai_runs(risk_level);
CREATE INDEX idx_ai_runs_created_at ON ai_runs(created_at);

-- EVENTS table (audit log for everything)
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(matter_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) CHECK (event_category IN ('matter', 'task', 'artifact', 'ai_run', 'billing', 'status_change', 'defect', 'approval', 'system')),
    actor_type VARCHAR(20) CHECK (actor_type IN ('user', 'system', 'automation', 'ai')),
    actor_user_id UUID REFERENCES users(user_id),
    description TEXT NOT NULL,
    metadata_json JSONB,
    reference_id UUID, -- Reference to related record (task_id, artifact_id, ai_run_id, etc.)
    reference_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_events_matter ON events(matter_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_category ON events(event_category);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_actor ON events(actor_user_id);

-- BILLING_EVENTS table (optional for MVP but included)
CREATE TABLE IF NOT EXISTS billing_events (
    billing_event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(matter_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('time_entry', 'milestone', 'expense', 'invoice', 'payment', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('draft', 'pending', 'invoiced', 'paid', 'cancelled')),
    description TEXT,
    date DATE NOT NULL,
    external_ref VARCHAR(100), -- QuickBooks, Stripe, etc.
    metadata_json JSONB,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_billing_events_matter ON billing_events(matter_id);
CREATE INDEX idx_billing_events_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_status ON billing_events(status);
CREATE INDEX idx_billing_events_date ON billing_events(date);

-- DEFECT_REASONS controlled list
CREATE TABLE IF NOT EXISTS defect_reasons (
    defect_reason_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PLAYBOOK_TEMPLATES table (for Sprint 2)
CREATE TABLE IF NOT EXISTS playbook_templates (
    playbook_id VARCHAR(50) PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    practice_area_id VARCHAR(50) NOT NULL REFERENCES practice_areas(practice_area_id),
    matter_type_id VARCHAR(50) NOT NULL REFERENCES matter_types(matter_type_id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_json JSONB NOT NULL, -- Full playbook definition
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playbook_id, version)
);

-- Index for performance
CREATE INDEX idx_playbook_templates_practice_area ON playbook_templates(practice_area_id);
CREATE INDEX idx_playbook_templates_matter_type ON playbook_templates(matter_type_id);

-- AUTOMATION_RULES table (for Sprint 2)
CREATE TABLE IF NOT EXISTS automation_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id VARCHAR(50) REFERENCES playbook_templates(playbook_id),
    rule_name VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_conditions JSONB NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_automation_rules_playbook ON automation_rules(playbook_id);
CREATE INDEX idx_automation_rules_trigger ON automation_rules(trigger_type);

-- SLA_RULES table
CREATE TABLE IF NOT EXISTS sla_rules (
    sla_rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id VARCHAR(50) REFERENCES playbook_templates(playbook_id),
    status_code VARCHAR(50) NOT NULL,
    sla_hours INTEGER NOT NULL,
    escalation_enabled BOOLEAN DEFAULT true,
    escalation_roles TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_sla_rules_playbook ON sla_rules(playbook_id);
CREATE INDEX idx_sla_rules_status ON sla_rules(status_code);

-- Trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompt_library_updated_at BEFORE UPDATE ON prompt_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_runs_updated_at BEFORE UPDATE ON ai_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_events_updated_at BEFORE UPDATE ON billing_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playbook_templates_updated_at BEFORE UPDATE ON playbook_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
