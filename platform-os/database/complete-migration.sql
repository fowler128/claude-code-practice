-- ============================================================================
-- BizDeedz Platform OS - Complete Database Migration
-- Postgres 14+ compatible
-- Run order: 1. This migration, 2. Seed data, 3. Load playbook templates
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- CONTROLLED LISTS / ENUMS
-- ============================================================================

-- Practice Areas
CREATE TABLE practice_areas (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matter Types
CREATE TABLE matter_types (
    id SERIAL PRIMARY KEY,
    practice_area_id INTEGER REFERENCES practice_areas(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Defect/Return Reasons
CREATE TABLE defect_reasons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    requires_note BOOLEAN DEFAULT false,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Artifact Types
CREATE TABLE artifact_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PLAYBOOK TEMPLATES
-- ============================================================================

CREATE TABLE playbook_templates (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(100) UNIQUE NOT NULL, -- e.g., bk-consumer-v1
    practice_area_id INTEGER REFERENCES practice_areas(id),
    matter_type_id INTEGER REFERENCES matter_types(id),
    name VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    template_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(practice_area_id, matter_type_id, version)
);

CREATE INDEX idx_playbook_templates_active ON playbook_templates(practice_area_id, matter_type_id, is_active, is_published);
CREATE INDEX idx_playbook_templates_template_id ON playbook_templates(template_id) WHERE is_active = true;

-- ============================================================================
-- CORE ENTITIES - MATTERS
-- ============================================================================

CREATE TABLE matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_number VARCHAR(50) UNIQUE NOT NULL,
    practice_area_id INTEGER REFERENCES practice_areas(id),
    matter_type_id INTEGER REFERENCES matter_types(id),
    playbook_template_id INTEGER REFERENCES playbook_templates(id),

    -- Basic info
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    opposing_party VARCHAR(255),

    -- Status & workflow
    current_status VARCHAR(100) NOT NULL,
    current_lane VARCHAR(100) NOT NULL,
    assigned_to VARCHAR(255),
    assigned_role VARCHAR(50),

    -- Dates & SLA
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    sla_breach_at TIMESTAMP,
    closed_at TIMESTAMP,

    -- Tracking
    defect_count INTEGER DEFAULT 0,
    return_count INTEGER DEFAULT 0,
    escalation_count INTEGER DEFAULT 0,

    -- Health Score
    health_score INTEGER DEFAULT 100,
    health_risk_tier VARCHAR(20) CHECK (health_risk_tier IN ('low', 'medium', 'high')),
    health_drivers JSONB,

    -- Metadata
    metadata JSONB,
    tags TEXT[],
    is_archived BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_matters_status ON matters(current_status, current_lane) WHERE is_archived = false;
CREATE INDEX idx_matters_assigned ON matters(assigned_to, assigned_role, is_archived);
CREATE INDEX idx_matters_health ON matters(health_risk_tier, health_score) WHERE is_archived = false;
CREATE INDEX idx_matters_sla ON matters(sla_breach_at) WHERE sla_breach_at IS NOT NULL AND closed_at IS NULL;
CREATE INDEX idx_matters_practice_type ON matters(practice_area_id, matter_type_id) WHERE is_archived = false;
CREATE INDEX idx_matters_status_changed ON matters(status_changed_at) WHERE closed_at IS NULL;

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,

    -- Task details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Assignment
    assigned_to VARCHAR(255),
    assigned_role VARCHAR(50),
    assigned_lane VARCHAR(100),

    -- Status & dates
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date TIMESTAMP,
    completed_at TIMESTAMP,

    -- Automation tracking
    is_automated BOOLEAN DEFAULT false,
    automation_rule_id VARCHAR(100),
    parent_task_id UUID REFERENCES tasks(id),

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for Smart Queue
CREATE INDEX idx_tasks_matter ON tasks(matter_id, status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, assigned_role, status, due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_tasks_due ON tasks(due_date, status, priority) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_tasks_role_status ON tasks(assigned_role, status, priority, due_date);

-- ============================================================================
-- ARTIFACTS
-- ============================================================================

CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    artifact_type_id INTEGER REFERENCES artifact_types(id),

    -- Artifact details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_url TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),

    -- Status & validation
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'validated', 'rejected', 'archived')),
    is_required BOOLEAN DEFAULT false,
    is_validated BOOLEAN DEFAULT false,
    validated_by VARCHAR(255),
    validated_at TIMESTAMP,

    -- Version control
    version INTEGER DEFAULT 1,
    parent_artifact_id UUID REFERENCES artifacts(id),

    -- QC & defects
    qc_status VARCHAR(50),
    defect_reason_id INTEGER REFERENCES defect_reasons(id),
    defect_notes TEXT,

    -- Metadata
    metadata JSONB,
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_artifacts_matter ON artifacts(matter_id, status);
CREATE INDEX idx_artifacts_required ON artifacts(matter_id, is_required, status) WHERE is_required = true;
CREATE INDEX idx_artifacts_type ON artifacts(artifact_type_id);

-- ============================================================================
-- AI RUNS
-- ============================================================================

CREATE TABLE ai_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id),

    -- AI action details
    action_type VARCHAR(100) NOT NULL,
    model_name VARCHAR(100),
    prompt_template VARCHAR(255),

    -- Input/Output
    input_data JSONB,
    output_data JSONB,
    tokens_used INTEGER,

    -- Risk & governance
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    requires_approval BOOLEAN DEFAULT false,
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,

    -- Execution tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,

    -- External send blocking
    can_send_externally BOOLEAN DEFAULT false,
    sent_externally_at TIMESTAMP,

    -- Metadata
    metadata JSONB,

    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_runs_matter ON ai_runs(matter_id, status);
CREATE INDEX idx_ai_runs_approval ON ai_runs(approval_status, risk_level) WHERE requires_approval = true;
CREATE INDEX idx_ai_runs_risk ON ai_runs(risk_level);

-- ============================================================================
-- EVENTS (Audit Trail & Timeline)
-- ============================================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,

    -- Event classification
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),

    -- Event details
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Related entities
    related_task_id UUID REFERENCES tasks(id),
    related_artifact_id UUID REFERENCES artifacts(id),
    related_ai_run_id UUID REFERENCES ai_runs(id),

    -- Changes tracking
    old_value JSONB,
    new_value JSONB,

    -- Actor
    actor_id VARCHAR(255),
    actor_name VARCHAR(255),
    actor_role VARCHAR(100),

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for cycle time reports
CREATE INDEX idx_events_matter ON events(matter_id, created_at DESC);
CREATE INDEX idx_events_type ON events(event_type, created_at DESC);
CREATE INDEX idx_events_status_change ON events(matter_id, event_type, created_at) WHERE event_type = 'status_change';
CREATE INDEX idx_events_actor ON events(actor_id, created_at DESC);

-- ============================================================================
-- AGENT LAYER TABLES
-- ============================================================================

-- Agent Directory
CREATE TABLE agent_directory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(255) NOT NULL UNIQUE,
    agent_type VARCHAR(100) NOT NULL,
    description TEXT,
    capabilities JSONB,
    input_schema JSONB,
    output_schema JSONB,
    default_model VARCHAR(100),
    max_tokens INTEGER DEFAULT 4096,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    risk_tier VARCHAR(20) DEFAULT 'medium' CHECK (risk_tier IN ('low', 'medium', 'high')),
    requires_human_approval BOOLEAN DEFAULT false,
    can_trigger_sub_agents BOOLEAN DEFAULT false,
    can_send_external BOOLEAN DEFAULT false,
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER,
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(50) DEFAULT '1.0.0',
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_directory_type ON agent_directory(agent_type, is_active);
CREATE INDEX idx_agent_directory_capabilities ON agent_directory USING GIN(capabilities);

-- Sub-Agent Directory
CREATE TABLE sub_agent_directory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_agent_id UUID REFERENCES agent_directory(id) ON DELETE CASCADE,
    sub_agent_name VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(100) NOT NULL,
    specialized_domain VARCHAR(100),
    prompt_template TEXT,
    model VARCHAR(100),
    max_tokens INTEGER DEFAULT 2048,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    execution_order INTEGER DEFAULT 0,
    is_parallel BOOLEAN DEFAULT false,
    retry_on_failure BOOLEAN DEFAULT true,
    max_retries INTEGER DEFAULT 2,
    depends_on_sub_agents UUID[],
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_agent_id, sub_agent_name)
);

CREATE INDEX idx_sub_agent_parent ON sub_agent_directory(parent_agent_id, is_active);
CREATE INDEX idx_sub_agent_task_type ON sub_agent_directory(task_type);

-- Work Orders
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    agent_id UUID REFERENCES agent_directory(id),
    assigned_to_user VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    work_type VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'in_progress', 'agent_processing',
        'awaiting_approval', 'approved', 'rejected', 'completed', 'failed', 'cancelled'
    )),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    input_data JSONB,
    output_data JSONB,
    requires_approval BOOLEAN DEFAULT false,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    execution_time_ms INTEGER,
    error_message TEXT,
    automation_candidate BOOLEAN DEFAULT false,
    confidence_score DECIMAL(5, 2),
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_orders_status ON work_orders(status, priority);
CREATE INDEX idx_work_orders_agent ON work_orders(agent_id, status);
CREATE INDEX idx_work_orders_assigned_user ON work_orders(assigned_to_user, status);
CREATE INDEX idx_work_orders_related ON work_orders(related_entity_type, related_entity_id);
CREATE INDEX idx_work_orders_due_date ON work_orders(due_date) WHERE status IN ('pending', 'assigned', 'in_progress');

-- Agent Run Logs
CREATE TABLE agent_run_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agent_directory(id),
    sub_agent_id UUID REFERENCES sub_agent_directory(id),
    run_type VARCHAR(50) NOT NULL,
    execution_status VARCHAR(50) NOT NULL CHECK (execution_status IN (
        'started', 'running', 'completed', 'failed', 'timeout', 'cancelled'
    )),
    input_data JSONB,
    output_data JSONB,
    prompt_used TEXT,
    model_name VARCHAR(100),
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,
    cost_usd DECIMAL(10, 4),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    execution_time_ms INTEGER,
    error_message TEXT,
    error_code VARCHAR(50),
    retry_count INTEGER DEFAULT 0,
    governance_check_passed BOOLEAN,
    governance_violations JSONB,
    human_approval_required BOOLEAN DEFAULT false,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_run_logs_work_order ON agent_run_logs(work_order_id, created_at DESC);
CREATE INDEX idx_agent_run_logs_agent ON agent_run_logs(agent_id, created_at DESC);
CREATE INDEX idx_agent_run_logs_status ON agent_run_logs(execution_status, created_at DESC);
CREATE INDEX idx_agent_run_logs_user ON agent_run_logs(user_id, created_at DESC);

-- Prompt Packs
CREATE TABLE prompt_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_name VARCHAR(255) NOT NULL UNIQUE,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    use_cases TEXT[],
    system_prompt TEXT,
    user_prompt_template TEXT,
    prompt_variables JSONB,
    example_inputs JSONB,
    example_outputs JSONB,
    recommended_model VARCHAR(100),
    recommended_temperature DECIMAL(3, 2),
    max_tokens INTEGER,
    output_validation_rules JSONB,
    requires_human_review BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    avg_success_rate DECIMAL(5, 2),
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pack_name, version)
);

CREATE INDEX idx_prompt_packs_category ON prompt_packs(category, is_active);
CREATE INDEX idx_prompt_packs_published ON prompt_packs(is_published, is_active);

-- Governance Rules
CREATE TABLE governance_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL UNIQUE,
    rule_type VARCHAR(100) NOT NULL,
    description TEXT,
    applies_to_agent_types TEXT[],
    applies_to_work_types TEXT[],
    applies_to_output_types TEXT[],
    rule_config JSONB NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    on_violation VARCHAR(50) DEFAULT 'flag' CHECK (on_violation IN (
        'flag', 'block', 'require_approval', 'notify', 'log_only'
    )),
    notify_roles TEXT[],
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_governance_rules_type ON governance_rules(rule_type, is_active);

-- ============================================================================
-- CRM / LEADS MODULE
-- ============================================================================

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_number VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    source VARCHAR(100),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'nurture'
    )),
    lead_score DECIMAL(5, 2),
    lead_score_factors JSONB,
    next_best_action VARCHAR(255),
    next_best_action_confidence DECIMAL(5, 2),
    budget_range VARCHAR(50),
    timeline VARCHAR(50),
    pain_points TEXT[],
    requirements JSONB,
    assigned_to VARCHAR(255),
    assigned_at TIMESTAMP,
    last_contact_at TIMESTAMP,
    last_activity_note TEXT,
    follow_up_date DATE,
    converted_to_matter_id UUID REFERENCES matters(id),
    converted_at TIMESTAMP,
    estimated_value DECIMAL(10, 2),
    actual_value DECIMAL(10, 2),
    tags TEXT[],
    custom_fields JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_status ON leads(status, lead_score DESC NULLS LAST);
CREATE INDEX idx_leads_assigned ON leads(assigned_to, status);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_date) WHERE status NOT IN ('won', 'lost');

-- ============================================================================
-- CONTENT CALENDAR MODULE
-- ============================================================================

CREATE TABLE content_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    platform VARCHAR(100),
    scheduled_date DATE,
    scheduled_time TIME,
    publication_status VARCHAR(50) DEFAULT 'draft' CHECK (publication_status IN (
        'draft', 'in_review', 'approved', 'scheduled', 'published', 'archived'
    )),
    content_brief TEXT,
    content_body TEXT,
    content_html TEXT,
    media_urls TEXT[],
    brand_qa_status VARCHAR(50) DEFAULT 'pending' CHECK (brand_qa_status IN (
        'pending', 'passed', 'failed', 'needs_review'
    )),
    brand_qa_issues JSONB,
    seo_score DECIMAL(5, 2),
    readability_score DECIMAL(5, 2),
    sentiment_score DECIMAL(5, 2),
    target_audience VARCHAR(255),
    keywords TEXT[],
    call_to_action VARCHAR(500),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    requires_approval BOOLEAN DEFAULT true,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    created_by VARCHAR(255),
    assigned_to VARCHAR(255),
    tags TEXT[],
    campaign_name VARCHAR(255),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_calendar_status ON content_calendar(publication_status, scheduled_date);
CREATE INDEX idx_content_calendar_type ON content_calendar(content_type, publication_status);
CREATE INDEX idx_content_calendar_brand_qa ON content_calendar(brand_qa_status);

-- ============================================================================
-- SOP / DELIVERY MODULE
-- ============================================================================

CREATE TABLE sop_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sop_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    description TEXT,
    procedure_steps JSONB,
    prerequisites TEXT[],
    tools_required TEXT[],
    estimated_time_minutes INTEGER,
    automation_candidate BOOLEAN DEFAULT false,
    automation_score DECIMAL(5, 2),
    automation_blockers TEXT[],
    automated_by_agent_id UUID REFERENCES agent_directory(id),
    compliance_requirements TEXT[],
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    requires_approval BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2),
    avg_completion_time_minutes INTEGER,
    version VARCHAR(50) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    parent_sop_id UUID REFERENCES sop_library(id),
    owner VARCHAR(255),
    reviewers TEXT[],
    last_reviewed_at TIMESTAMP,
    next_review_date DATE,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sop_library_category ON sop_library(category, is_active);
CREATE INDEX idx_sop_library_automation ON sop_library(automation_candidate, automation_score DESC NULLS LAST);

CREATE TABLE sop_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sop_id UUID REFERENCES sop_library(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id),
    executed_by VARCHAR(255),
    execution_type VARCHAR(50) DEFAULT 'manual' CHECK (execution_type IN ('manual', 'automated', 'hybrid')),
    current_step INTEGER,
    total_steps INTEGER,
    steps_completed JSONB,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN (
        'in_progress', 'completed', 'failed', 'paused', 'cancelled'
    )),
    execution_notes TEXT,
    completion_time_minutes INTEGER,
    issues_encountered TEXT[],
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sop_executions_sop ON sop_executions(sop_id, status);
CREATE INDEX idx_sop_executions_work_order ON sop_executions(work_order_id);

-- ============================================================================
-- USERS & ROLES
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role, is_active);

-- ============================================================================
-- AUTO-GENERATED SEQUENCES
-- ============================================================================

CREATE SEQUENCE matter_seq START 1;
CREATE SEQUENCE work_order_seq START 1;
CREATE SEQUENCE lead_seq START 1;
CREATE SEQUENCE content_seq START 1;
CREATE SEQUENCE sop_seq START 1;

-- ============================================================================
-- AUTO-GENERATE FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_matter_number()
RETURNS TRIGGER AS $$
DECLARE
    practice_code VARCHAR(10);
    year_code VARCHAR(4);
    sequence_num INTEGER;
BEGIN
    SELECT code INTO practice_code FROM practice_areas WHERE id = NEW.practice_area_id;
    year_code := TO_CHAR(CURRENT_DATE, 'YY');
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM matters
    WHERE practice_area_id = NEW.practice_area_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    NEW.matter_number := UPPER(practice_code) || '-' || year_code || '-' || LPAD(sequence_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.work_order_number := 'WO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                              LPAD(NEXTVAL('work_order_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_lead_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.lead_number := 'LEAD-' || TO_CHAR(CURRENT_DATE, 'YY') || '-' ||
                       LPAD(NEXTVAL('lead_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_content_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content_id := 'CNT-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' ||
                      LPAD(NEXTVAL('content_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_sop_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.sop_id := 'SOP-' || UPPER(LEFT(COALESCE(NEW.category, 'GEN'), 3)) || '-' ||
                  LPAD(NEXTVAL('sop_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER update_practice_areas_updated_at BEFORE UPDATE ON practice_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matter_types_updated_at BEFORE UPDATE ON matter_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_runs_updated_at BEFORE UPDATE ON ai_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_directory_updated_at BEFORE UPDATE ON agent_directory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_calendar_updated_at BEFORE UPDATE ON content_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sop_library_updated_at BEFORE UPDATE ON sop_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate ID triggers
CREATE TRIGGER generate_matter_number_trigger
BEFORE INSERT ON matters
FOR EACH ROW
WHEN (NEW.matter_number IS NULL OR NEW.matter_number = '')
EXECUTE FUNCTION generate_matter_number();

CREATE TRIGGER generate_work_order_number_trigger
BEFORE INSERT ON work_orders
FOR EACH ROW
WHEN (NEW.work_order_number IS NULL OR NEW.work_order_number = '')
EXECUTE FUNCTION generate_work_order_number();

CREATE TRIGGER generate_lead_number_trigger
BEFORE INSERT ON leads
FOR EACH ROW
WHEN (NEW.lead_number IS NULL OR NEW.lead_number = '')
EXECUTE FUNCTION generate_lead_number();

CREATE TRIGGER generate_content_id_trigger
BEFORE INSERT ON content_calendar
FOR EACH ROW
WHEN (NEW.content_id IS NULL OR NEW.content_id = '')
EXECUTE FUNCTION generate_content_id();

CREATE TRIGGER generate_sop_id_trigger
BEFORE INSERT ON sop_library
FOR EACH ROW
WHEN (NEW.sop_id IS NULL OR NEW.sop_id = '')
EXECUTE FUNCTION generate_sop_id();

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
\echo 'BizDeedz Platform OS migration completed successfully!'
\echo 'Next steps:'
\echo '1. Run seed data: psql -d bizdeedz_platform -f database/seed-data.sql'
\echo '2. Load playbook templates: npm run load-templates'
