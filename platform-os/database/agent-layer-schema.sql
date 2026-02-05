-- ============================================================================
-- AGENT LAYER SCHEMA EXTENSION
-- ============================================================================
-- This extends the BizDeedz Platform OS with an Agent orchestration layer

-- ============================================================================
-- AGENT DIRECTORY
-- ============================================================================

CREATE TABLE agent_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(255) NOT NULL UNIQUE,
    agent_type VARCHAR(100) NOT NULL, -- orchestrator, specialist, analyst, reviewer
    description TEXT,

    -- Capabilities
    capabilities JSONB, -- Array of capability tags
    input_schema JSONB, -- Expected input structure
    output_schema JSONB, -- Expected output structure

    -- Configuration
    default_model VARCHAR(100), -- gpt-4, claude-3, etc.
    max_tokens INTEGER DEFAULT 4096,
    temperature DECIMAL(3, 2) DEFAULT 0.7,

    -- Governance
    risk_tier VARCHAR(20) DEFAULT 'medium' CHECK (risk_tier IN ('low', 'medium', 'high')),
    requires_human_approval BOOLEAN DEFAULT false,
    can_trigger_sub_agents BOOLEAN DEFAULT false,
    can_send_external BOOLEAN DEFAULT false,

    -- Performance tracking
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER,

    -- Metadata
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(50) DEFAULT '1.0.0',
    tags TEXT[],

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_directory_type ON agent_directory(agent_type, is_active);
CREATE INDEX idx_agent_directory_capabilities ON agent_directory USING GIN(capabilities);

-- ============================================================================
-- SUB-AGENT DIRECTORY
-- ============================================================================

CREATE TABLE sub_agent_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_agent_id UUID REFERENCES agent_directory(id) ON DELETE CASCADE,
    sub_agent_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Task specification
    task_type VARCHAR(100) NOT NULL, -- research, analysis, generation, validation, qa
    specialized_domain VARCHAR(100), -- legal, marketing, content, crm, sop

    -- Configuration
    prompt_template TEXT, -- Template with variables
    model VARCHAR(100),
    max_tokens INTEGER DEFAULT 2048,
    temperature DECIMAL(3, 2) DEFAULT 0.7,

    -- Execution
    execution_order INTEGER DEFAULT 0, -- For sequential sub-agents
    is_parallel BOOLEAN DEFAULT false, -- Can run in parallel
    retry_on_failure BOOLEAN DEFAULT true,
    max_retries INTEGER DEFAULT 2,

    -- Dependencies
    depends_on_sub_agents UUID[], -- Array of sub-agent IDs that must complete first

    -- Performance
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

-- ============================================================================
-- WORK ORDERS
-- ============================================================================

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_number VARCHAR(50) UNIQUE NOT NULL,

    -- Assignment
    agent_id UUID REFERENCES agent_directory(id),
    assigned_to_user VARCHAR(255), -- Human assignee (if applicable)

    -- Work order details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    work_type VARCHAR(100) NOT NULL, -- lead_scoring, content_generation, qa_review, sop_automation, etc.
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Status workflow
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'in_progress', 'agent_processing',
        'awaiting_approval', 'approved', 'rejected', 'completed', 'failed', 'cancelled'
    )),

    -- Related entities
    related_entity_type VARCHAR(50), -- lead, content, matter, sop
    related_entity_id UUID,

    -- Input/Output
    input_data JSONB,
    output_data JSONB,

    -- Governance & approval
    requires_approval BOOLEAN DEFAULT false,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason TEXT,

    -- Execution tracking
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    execution_time_ms INTEGER,
    error_message TEXT,

    -- Automation fields
    automation_candidate BOOLEAN DEFAULT false, -- Flag for SOP automation
    confidence_score DECIMAL(5, 2), -- 0-100 confidence in output

    -- Dates
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_orders_status ON work_orders(status, priority);
CREATE INDEX idx_work_orders_agent ON work_orders(agent_id, status);
CREATE INDEX idx_work_orders_assigned_user ON work_orders(assigned_to_user, status);
CREATE INDEX idx_work_orders_related ON work_orders(related_entity_type, related_entity_id);
CREATE INDEX idx_work_orders_due_date ON work_orders(due_date) WHERE status IN ('pending', 'assigned', 'in_progress');

-- ============================================================================
-- AGENT RUN LOGS (Audit Trail)
-- ============================================================================

CREATE TABLE agent_run_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agent_directory(id),
    sub_agent_id UUID REFERENCES sub_agent_directory(id),

    -- Execution details
    run_type VARCHAR(50) NOT NULL, -- full_agent, sub_agent, retry, validation
    execution_status VARCHAR(50) NOT NULL CHECK (execution_status IN (
        'started', 'running', 'completed', 'failed', 'timeout', 'cancelled'
    )),

    -- Input/Output
    input_data JSONB,
    output_data JSONB,
    prompt_used TEXT,

    -- Model information
    model_name VARCHAR(100),
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,
    cost_usd DECIMAL(10, 4),

    -- Timing
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    execution_time_ms INTEGER,

    -- Error handling
    error_message TEXT,
    error_code VARCHAR(50),
    retry_count INTEGER DEFAULT 0,

    -- Governance
    governance_check_passed BOOLEAN,
    governance_violations JSONB, -- Array of violated rules
    human_approval_required BOOLEAN DEFAULT false,

    -- Context
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_run_logs_work_order ON agent_run_logs(work_order_id, created_at DESC);
CREATE INDEX idx_agent_run_logs_agent ON agent_run_logs(agent_id, created_at DESC);
CREATE INDEX idx_agent_run_logs_status ON agent_run_logs(execution_status, created_at DESC);
CREATE INDEX idx_agent_run_logs_user ON agent_run_logs(user_id, created_at DESC);

-- ============================================================================
-- PROMPT PACKS
-- ============================================================================

CREATE TABLE prompt_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_name VARCHAR(255) NOT NULL UNIQUE,
    version VARCHAR(50) NOT NULL,
    description TEXT,

    -- Pack metadata
    category VARCHAR(100), -- legal, marketing, crm, content, ops
    use_cases TEXT[], -- Array of use case descriptions

    -- Prompts
    system_prompt TEXT,
    user_prompt_template TEXT, -- Template with {{variables}}
    prompt_variables JSONB, -- Schema of expected variables

    -- Examples
    example_inputs JSONB, -- Array of example input objects
    example_outputs JSONB, -- Array of example output objects

    -- Configuration
    recommended_model VARCHAR(100),
    recommended_temperature DECIMAL(3, 2),
    max_tokens INTEGER,

    -- Governance
    output_validation_rules JSONB, -- Rules for validating output
    requires_human_review BOOLEAN DEFAULT false,

    -- Performance
    usage_count INTEGER DEFAULT 0,
    avg_success_rate DECIMAL(5, 2),

    -- Status
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(pack_name, version)
);

CREATE INDEX idx_prompt_packs_category ON prompt_packs(category, is_active);
CREATE INDEX idx_prompt_packs_published ON prompt_packs(is_published, is_active);

-- ============================================================================
-- GOVERNANCE RULES
-- ============================================================================

CREATE TABLE governance_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL UNIQUE,
    rule_type VARCHAR(100) NOT NULL, -- approval_gate, content_filter, compliance_check, rate_limit
    description TEXT,

    -- Applicability
    applies_to_agent_types TEXT[], -- Array of agent types this rule applies to
    applies_to_work_types TEXT[], -- Array of work types
    applies_to_output_types TEXT[], -- client_facing, public, internal, draft

    -- Rule definition
    rule_config JSONB NOT NULL, -- Rule-specific configuration
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Actions on violation
    on_violation VARCHAR(50) DEFAULT 'flag' CHECK (on_violation IN (
        'flag', 'block', 'require_approval', 'notify', 'log_only'
    )),
    notify_roles TEXT[], -- Roles to notify on violation

    -- Enforcement
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100, -- Higher priority rules checked first

    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_governance_rules_type ON governance_rules(rule_type, is_active);

-- ============================================================================
-- CRM / LEADS MODULE
-- ============================================================================

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_number VARCHAR(50) UNIQUE NOT NULL,

    -- Lead information
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Lead details
    source VARCHAR(100), -- website, referral, cold_outreach, event
    industry VARCHAR(100),
    company_size VARCHAR(50), -- startup, smb, mid_market, enterprise

    -- Status
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'nurture'
    )),

    -- AI-enhanced fields
    lead_score DECIMAL(5, 2), -- 0-100 AI-calculated score
    lead_score_factors JSONB, -- Breakdown of score calculation
    next_best_action VARCHAR(255), -- AI-suggested next step
    next_best_action_confidence DECIMAL(5, 2), -- Confidence in suggestion

    -- Qualification
    budget_range VARCHAR(50),
    timeline VARCHAR(50),
    pain_points TEXT[],
    requirements JSONB,

    -- Assignment
    assigned_to VARCHAR(255),
    assigned_at TIMESTAMP,

    -- Tracking
    last_contact_at TIMESTAMP,
    last_activity_note TEXT,
    follow_up_date DATE,

    -- Conversion
    converted_to_matter_id UUID REFERENCES matters(id),
    converted_at TIMESTAMP,
    estimated_value DECIMAL(10, 2),
    actual_value DECIMAL(10, 2),

    -- Metadata
    tags TEXT[],
    custom_fields JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_status ON leads(status, lead_score DESC);
CREATE INDEX idx_leads_assigned ON leads(assigned_to, status);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_date) WHERE status NOT IN ('won', 'lost');

-- ============================================================================
-- CONTENT CALENDAR MODULE
-- ============================================================================

CREATE TABLE content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(50) UNIQUE NOT NULL,

    -- Content details
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL, -- blog_post, social_media, email, video, whitepaper
    platform VARCHAR(100), -- linkedin, twitter, website, email_campaign

    -- Scheduling
    scheduled_date DATE,
    scheduled_time TIME,
    publication_status VARCHAR(50) DEFAULT 'draft' CHECK (publication_status IN (
        'draft', 'in_review', 'approved', 'scheduled', 'published', 'archived'
    )),

    -- Content
    content_brief TEXT,
    content_body TEXT,
    content_html TEXT,
    media_urls TEXT[],

    -- AI-enhanced fields
    brand_qa_status VARCHAR(50) DEFAULT 'pending' CHECK (brand_qa_status IN (
        'pending', 'passed', 'failed', 'needs_review'
    )),
    brand_qa_issues JSONB, -- Array of brand guideline violations
    seo_score DECIMAL(5, 2), -- 0-100 SEO optimization score
    readability_score DECIMAL(5, 2),
    sentiment_score DECIMAL(5, 2), -- -100 to +100

    -- Target audience
    target_audience VARCHAR(255),
    keywords TEXT[],
    call_to_action VARCHAR(500),

    -- Engagement (post-publication)
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,

    -- Approval workflow
    requires_approval BOOLEAN DEFAULT true,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,

    -- Assignment
    created_by VARCHAR(255),
    assigned_to VARCHAR(255),

    -- Metadata
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sop_id VARCHAR(50) UNIQUE NOT NULL,

    -- SOP details
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100), -- onboarding, delivery, operations, support
    subcategory VARCHAR(100),

    -- Content
    description TEXT,
    procedure_steps JSONB, -- Array of step objects with details
    prerequisites TEXT[],
    tools_required TEXT[],
    estimated_time_minutes INTEGER,

    -- Automation
    automation_candidate BOOLEAN DEFAULT false,
    automation_score DECIMAL(5, 2), -- 0-100 score for automation potential
    automation_blockers TEXT[], -- Reasons why it can't be automated
    automated_by_agent_id UUID REFERENCES agent_directory(id),

    -- Compliance
    compliance_requirements TEXT[],
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    requires_approval BOOLEAN DEFAULT false,

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2),
    avg_completion_time_minutes INTEGER,

    -- Version control
    version VARCHAR(50) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    parent_sop_id UUID REFERENCES sop_library(id), -- For versioning

    -- Ownership
    owner VARCHAR(255),
    reviewers TEXT[],
    last_reviewed_at TIMESTAMP,
    next_review_date DATE,

    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sop_library_category ON sop_library(category, is_active);
CREATE INDEX idx_sop_library_automation ON sop_library(automation_candidate, automation_score DESC);

CREATE TABLE sop_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sop_id UUID REFERENCES sop_library(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id),

    -- Execution details
    executed_by VARCHAR(255), -- user or agent
    execution_type VARCHAR(50) DEFAULT 'manual' CHECK (execution_type IN ('manual', 'automated', 'hybrid')),

    -- Progress
    current_step INTEGER,
    total_steps INTEGER,
    steps_completed JSONB, -- Array of completed step IDs

    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN (
        'in_progress', 'completed', 'failed', 'paused', 'cancelled'
    )),

    -- Results
    execution_notes TEXT,
    completion_time_minutes INTEGER,
    issues_encountered TEXT[],

    -- Related entity
    related_entity_type VARCHAR(50),
    related_entity_id UUID,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sop_executions_sop ON sop_executions(sop_id, status);
CREATE INDEX idx_sop_executions_work_order ON sop_executions(work_order_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_agent_directory_updated_at BEFORE UPDATE ON agent_directory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sub_agent_directory_updated_at BEFORE UPDATE ON sub_agent_directory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompt_packs_updated_at BEFORE UPDATE ON prompt_packs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_governance_rules_updated_at BEFORE UPDATE ON governance_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_calendar_updated_at BEFORE UPDATE ON content_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sop_library_updated_at BEFORE UPDATE ON sop_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-GENERATE IDENTIFIERS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.work_order_number := 'WO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                              LPAD(NEXTVAL('work_order_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE SEQUENCE work_order_seq START 1;
CREATE TRIGGER generate_work_order_number_trigger
BEFORE INSERT ON work_orders
FOR EACH ROW
WHEN (NEW.work_order_number IS NULL OR NEW.work_order_number = '')
EXECUTE FUNCTION generate_work_order_number();

CREATE OR REPLACE FUNCTION generate_lead_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.lead_number := 'LEAD-' || TO_CHAR(CURRENT_DATE, 'YY') || '-' ||
                       LPAD(NEXTVAL('lead_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE SEQUENCE lead_seq START 1;
CREATE TRIGGER generate_lead_number_trigger
BEFORE INSERT ON leads
FOR EACH ROW
WHEN (NEW.lead_number IS NULL OR NEW.lead_number = '')
EXECUTE FUNCTION generate_lead_number();

CREATE OR REPLACE FUNCTION generate_content_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content_id := 'CNT-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' ||
                      LPAD(NEXTVAL('content_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE SEQUENCE content_seq START 1;
CREATE TRIGGER generate_content_id_trigger
BEFORE INSERT ON content_calendar
FOR EACH ROW
WHEN (NEW.content_id IS NULL OR NEW.content_id = '')
EXECUTE FUNCTION generate_content_id();

CREATE OR REPLACE FUNCTION generate_sop_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.sop_id := 'SOP-' || UPPER(LEFT(NEW.category, 3)) || '-' ||
                  LPAD(NEXTVAL('sop_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE SEQUENCE sop_seq START 1;
CREATE TRIGGER generate_sop_id_trigger
BEFORE INSERT ON sop_library
FOR EACH ROW
WHEN (NEW.sop_id IS NULL OR NEW.sop_id = '')
EXECUTE FUNCTION generate_sop_id();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE agent_directory IS 'Registry of all agents (orchestrators and specialists)';
COMMENT ON TABLE sub_agent_directory IS 'Registry of sub-agents that can be called by parent agents';
COMMENT ON TABLE work_orders IS 'Work items assigned to agents or humans';
COMMENT ON TABLE agent_run_logs IS 'Complete audit trail of all agent executions';
COMMENT ON TABLE prompt_packs IS 'Versioned prompt templates with examples and validation';
COMMENT ON TABLE governance_rules IS 'Rules enforcing approval gates and compliance';
COMMENT ON TABLE leads IS 'CRM lead tracking with AI-enhanced scoring and recommendations';
COMMENT ON TABLE content_calendar IS 'Content planning and publishing with brand QA';
COMMENT ON TABLE sop_library IS 'Standard Operating Procedures with automation potential';
COMMENT ON TABLE sop_executions IS 'Tracking of SOP execution instances';
