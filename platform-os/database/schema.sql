-- BizDeedz Platform OS Database Schema
-- PostgreSQL 14+

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
    category VARCHAR(50), -- intake, engagement, evidence, filing, output
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PLAYBOOK TEMPLATES
-- ============================================================================

CREATE TABLE playbook_templates (
    id SERIAL PRIMARY KEY,
    practice_area_id INTEGER REFERENCES practice_areas(id),
    matter_type_id INTEGER REFERENCES matter_types(id),
    name VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    template_data JSONB NOT NULL, -- Full template structure
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(practice_area_id, matter_type_id, version)
);

-- Index for fast template lookups
CREATE INDEX idx_playbook_templates_active ON playbook_templates(practice_area_id, matter_type_id, is_active, is_published);

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Matters
CREATE TABLE matters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    health_drivers JSONB, -- Array of top 3 drivers

    -- Metadata
    metadata JSONB,
    tags TEXT[],
    is_archived BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for matters
CREATE INDEX idx_matters_status ON matters(current_status, current_lane);
CREATE INDEX idx_matters_assigned ON matters(assigned_to, is_archived);
CREATE INDEX idx_matters_health ON matters(health_risk_tier, health_score);
CREATE INDEX idx_matters_sla ON matters(sla_breach_at) WHERE sla_breach_at IS NOT NULL;
CREATE INDEX idx_matters_practice_type ON matters(practice_area_id, matter_type_id);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,

    -- Task details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50), -- manual, automated, reminder, correction
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

-- Indexes for tasks
CREATE INDEX idx_tasks_matter ON tasks(matter_id, status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, status, due_date);
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE status IN ('pending', 'in_progress');

-- Artifacts
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Indexes for artifacts
CREATE INDEX idx_artifacts_matter ON artifacts(matter_id, status);
CREATE INDEX idx_artifacts_required ON artifacts(matter_id, is_required) WHERE is_required = true;
CREATE INDEX idx_artifacts_type ON artifacts(artifact_type_id);

-- AI Runs
CREATE TABLE ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id),

    -- AI action details
    action_type VARCHAR(100) NOT NULL, -- document_generation, analysis, qa_check, etc.
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

-- Indexes for AI runs
CREATE INDEX idx_ai_runs_matter ON ai_runs(matter_id, status);
CREATE INDEX idx_ai_runs_approval ON ai_runs(approval_status) WHERE requires_approval = true;
CREATE INDEX idx_ai_runs_risk ON ai_runs(risk_level);

-- Events (audit trail & timeline)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,

    -- Event classification
    event_type VARCHAR(100) NOT NULL, -- status_change, task_created, artifact_uploaded, ai_run, etc.
    event_category VARCHAR(50), -- workflow, document, communication, system

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

-- Indexes for events
CREATE INDEX idx_events_matter ON events(matter_id, created_at DESC);
CREATE INDEX idx_events_type ON events(event_type, created_at DESC);
CREATE INDEX idx_events_actor ON events(actor_id, created_at DESC);

-- ============================================================================
-- BILLING (Optional for MVP)
-- ============================================================================

CREATE TABLE billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,

    -- Billing details
    event_type VARCHAR(50) NOT NULL, -- time_entry, expense, flat_fee, milestone
    description TEXT NOT NULL,

    -- Amounts
    quantity DECIMAL(10, 2),
    rate DECIMAL(10, 2),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Categorization
    billing_code VARCHAR(50),
    is_billable BOOLEAN DEFAULT true,
    is_invoiced BOOLEAN DEFAULT false,
    invoice_id VARCHAR(100),

    -- Actor
    billed_by VARCHAR(255),
    billed_by_role VARCHAR(100),

    -- Dates
    service_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for billing
CREATE INDEX idx_billing_matter ON billing_events(matter_id, service_date DESC);
CREATE INDEX idx_billing_invoice ON billing_events(invoice_id) WHERE invoice_id IS NOT NULL;

-- ============================================================================
-- AUTOMATION RULES
-- ============================================================================

CREATE TABLE automation_rules (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Trigger configuration
    trigger_type VARCHAR(50) NOT NULL, -- status_change, artifact_update, sla_breach, etc.
    trigger_conditions JSONB, -- Conditions that must be met

    -- Action configuration
    action_type VARCHAR(50) NOT NULL, -- create_task, send_notification, escalate, etc.
    action_config JSONB, -- Action-specific configuration

    -- Scope
    practice_area_id INTEGER REFERENCES practice_areas(id),
    matter_type_id INTEGER REFERENCES matter_types(id),
    applies_to_all BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for automation rules
CREATE INDEX idx_automation_rules_trigger ON automation_rules(trigger_type, is_active);

-- ============================================================================
-- USERS & ROLES (Basic)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100), -- admin, ops_lead, paralegal, attorney, client
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role, is_active);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all relevant tables
CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_runs_updated_at BEFORE UPDATE ON ai_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate matter number
CREATE OR REPLACE FUNCTION generate_matter_number()
RETURNS TRIGGER AS $$
DECLARE
    practice_code VARCHAR(10);
    year_code VARCHAR(4);
    sequence_num INTEGER;
BEGIN
    -- Get practice area code
    SELECT code INTO practice_code FROM practice_areas WHERE id = NEW.practice_area_id;

    -- Get current year
    year_code := TO_CHAR(CURRENT_DATE, 'YY');

    -- Get next sequence number for this practice area and year
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM matters
    WHERE practice_area_id = NEW.practice_area_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

    -- Format: BK-26-0001 (practice-year-sequence)
    NEW.matter_number := UPPER(practice_code) || '-' || year_code || '-' || LPAD(sequence_num::TEXT, 4, '0');

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_matter_number_trigger
BEFORE INSERT ON matters
FOR EACH ROW
WHEN (NEW.matter_number IS NULL OR NEW.matter_number = '')
EXECUTE FUNCTION generate_matter_number();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Practice Areas
INSERT INTO practice_areas (code, name, description) VALUES
('BK', 'Bankruptcy', 'Consumer and business bankruptcy matters'),
('FL', 'Family Law', 'Divorce, custody, and family legal matters'),
('IM', 'Immigration', 'Immigration petitions and applications'),
('PE', 'Probate / Estate Planning', 'Estate planning and probate administration');

-- Matter Types
INSERT INTO matter_types (practice_area_id, code, name) VALUES
((SELECT id FROM practice_areas WHERE code = 'BK'), 'BK-CONSUMER', 'Bankruptcy: Consumer (General)'),
((SELECT id FROM practice_areas WHERE code = 'FL'), 'FL-DIVORCE', 'Family Law: Divorce'),
((SELECT id FROM practice_areas WHERE code = 'FL'), 'FL-CUSTODY', 'Family Law: Custody/Modification'),
((SELECT id FROM practice_areas WHERE code = 'IM'), 'IM-PETITION', 'Immigration: Petition/Application (General)'),
((SELECT id FROM practice_areas WHERE code = 'IM'), 'IM-RFE', 'Immigration: RFE Response'),
((SELECT id FROM practice_areas WHERE code = 'PE'), 'PE-ESTATE', 'Probate/Estate: Estate Planning Package'),
((SELECT id FROM practice_areas WHERE code = 'PE'), 'PE-PROBATE', 'Probate/Estate: Probate Administration');

-- Defect Reasons
INSERT INTO defect_reasons (code, name, requires_note, severity) VALUES
('MISSING_ARTIFACT', 'Missing Required Artifact', false, 'high'),
('INCORRECT_NAMES', 'Incorrect Party Names / Spelling', false, 'medium'),
('INCORRECT_JURISDICTION', 'Incorrect Jurisdiction / Venue', false, 'high'),
('MISSING_SIGNATURE', 'Signature Missing / Invalid', false, 'high'),
('INCOMPLETE_FIELDS', 'Incomplete Form Fields', false, 'medium'),
('WRONG_TEMPLATE', 'Wrong Template Used', false, 'high'),
('INCONSISTENT_FACTS', 'Inconsistent Facts Across Docs', false, 'medium'),
('DEADLINE_RISK', 'Deadline Miss Risk / Late', false, 'high'),
('PAYMENT_ISSUE', 'Payment / Retainer Issue', false, 'medium'),
('OTHER', 'Other (Requires Note)', true, 'low');

-- Artifact Types
INSERT INTO artifact_types (code, name, category) VALUES
('INTAKE_QUESTIONNAIRE', 'Intake Questionnaire', 'intake'),
('ENGAGEMENT_UNSIGNED', 'Engagement Letter (Unsigned)', 'engagement'),
('ENGAGEMENT_SIGNED', 'Engagement Letter (Signed)', 'engagement'),
('PAYMENT_CONFIRMATION', 'Payment Confirmation', 'engagement'),
('IDENTITY_DOCS', 'Identity Documentation', 'evidence'),
('FINANCIAL_DOCS', 'Financial Documentation', 'evidence'),
('EVIDENCE_PACKET', 'Supporting Evidence Packet', 'evidence'),
('DRAFT_FILING', 'Draft Filing/Submission Packet', 'filing'),
('FINAL_FILING', 'Final Filed/Submitted Packet', 'filing'),
('COURT_NOTICES', 'Court/Agency Notices', 'output'),
('FINAL_ORDERS', 'Final Orders / Executed Docs', 'output');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE matters IS 'Core entity representing a legal matter/case';
COMMENT ON TABLE tasks IS 'Tasks and action items within a matter';
COMMENT ON TABLE artifacts IS 'Documents and files associated with matters';
COMMENT ON TABLE ai_runs IS 'AI-powered actions with governance and approval tracking';
COMMENT ON TABLE events IS 'Complete audit trail and timeline of matter activities';
COMMENT ON TABLE playbook_templates IS 'Versioned JSON templates defining workflows by practice area';
COMMENT ON TABLE automation_rules IS 'Rules engine for automated workflows and actions';

COMMENT ON COLUMN matters.health_score IS 'Calculated score 0-100 based on matter state and compliance';
COMMENT ON COLUMN matters.health_drivers IS 'Top 3 factors affecting health score (JSON array)';
COMMENT ON COLUMN ai_runs.requires_approval IS 'True when risk_level is medium or high';
COMMENT ON COLUMN ai_runs.can_send_externally IS 'Blocked until approved for medium/high risk';
