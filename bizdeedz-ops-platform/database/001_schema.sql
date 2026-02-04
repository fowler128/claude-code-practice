-- BizDeedz Ops Platform - Supabase Database Schema
-- Version: 1.0 MVP
-- Description: Complete database schema for bankruptcy law firm workflow management

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy matching in conflicts

-- =============================================================================
-- CUSTOM TYPES (ENUMS)
-- =============================================================================

-- Firm status
CREATE TYPE firm_status AS ENUM ('active', 'on_hold', 'terminated');

-- Contact roles
CREATE TYPE contact_role AS ENUM ('attorney', 'staff', 'billing');

-- Case types
CREATE TYPE case_type AS ENUM ('ch7', 'ch13', 'amendment');

-- Matter stage pipeline
CREATE TYPE matter_stage AS ENUM (
    'assigned',
    'waiting_inputs',
    'conflicts_review',
    'in_progress',
    'qc',
    'delivered',
    'revision',
    'complete',
    'paused_ar'
);

-- Inputs status
CREATE TYPE inputs_status AS ENUM ('incomplete', 'complete', 'in_review');

-- Conflicts status
CREATE TYPE conflicts_status AS ENUM ('not_run', 'clear', 'potential', 'conflict');

-- Conflict check result
CREATE TYPE conflict_result AS ENUM ('clear', 'potential', 'conflict');

-- Conflict decision
CREATE TYPE conflict_decision AS ENUM ('approved', 'declined', 'overridden');

-- Entity type
CREATE TYPE entity_type AS ENUM ('person', 'business');

-- Entity role in matter
CREATE TYPE entity_role AS ENUM ('debtor', 'spouse', 'related_business');

-- Deficiency status
CREATE TYPE deficiency_status AS ENUM ('open', 'resolved');

-- Deficiency category
CREATE TYPE deficiency_category AS ENUM (
    'id',
    'income',
    'taxes',
    'banking',
    'assets',
    'debts',
    'household',
    'plan_inputs',
    'other'
);

-- Delivery type
CREATE TYPE delivery_type AS ENUM ('ch7', 'ch13', 'amendment');

-- Billable type
CREATE TYPE billable_type AS ENUM ('retainer', 'ch7', 'ch13', 'amendment', 'rush', 'overage');

-- Invoice status
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'partial');

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'client_attorney', 'client_staff');

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FIRMS
-- Client law firms that BizDeedz works with
-- -----------------------------------------------------------------------------
CREATE TABLE firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_name TEXT NOT NULL,
    status firm_status NOT NULL DEFAULT 'active',
    retainer_amount NUMERIC(10, 2) DEFAULT 0,
    retainer_due_day INTEGER DEFAULT 1 CHECK (retainer_due_day >= 1 AND retainer_due_day <= 28),
    invoice_cadence TEXT DEFAULT 'friday',
    billing_email TEXT,
    active_capacity BOOLEAN DEFAULT false,  -- True only when retainer is paid
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick status filtering
CREATE INDEX idx_firms_status ON firms(status);

-- -----------------------------------------------------------------------------
-- CONTACTS
-- People at client firms (attorneys, staff, billing contacts)
-- -----------------------------------------------------------------------------
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role contact_role NOT NULL DEFAULT 'staff',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_firm ON contacts(firm_id);

-- -----------------------------------------------------------------------------
-- MATTERS
-- Individual cases/assignments from client firms
-- -----------------------------------------------------------------------------
CREATE TABLE matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    matter_name TEXT NOT NULL,  -- e.g., "Smith, John – Ch 7"
    case_type case_type NOT NULL,
    district TEXT,  -- Jurisdiction/district
    deadline DATE,
    rush BOOLEAN DEFAULT false,
    status_stage matter_stage NOT NULL DEFAULT 'assigned',
    inputs_status inputs_status NOT NULL DEFAULT 'incomplete',
    conflicts_status conflicts_status NOT NULL DEFAULT 'not_run',
    assigned_to TEXT,  -- User/team member name or ID

    -- Timestamps for metrics calculation
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    inputs_complete_at TIMESTAMPTZ,
    in_progress_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Revision tracking
    revision_rounds INTEGER DEFAULT 0,

    -- Override notes (when proceeding despite incomplete inputs or potential conflicts)
    override_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matters_firm ON matters(firm_id);
CREATE INDEX idx_matters_stage ON matters(status_stage);
CREATE INDEX idx_matters_deadline ON matters(deadline);

-- -----------------------------------------------------------------------------
-- MATTER_INPUTS
-- Checklist of required inputs for each matter
-- -----------------------------------------------------------------------------
CREATE TABLE matter_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    input_type TEXT NOT NULL,  -- e.g., "IDs", "Paystubs", "Tax Returns"
    input_category deficiency_category,
    required BOOLEAN DEFAULT true,
    received BOOLEAN DEFAULT false,
    received_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matter_inputs_matter ON matter_inputs(matter_id);

-- -----------------------------------------------------------------------------
-- DEFICIENCIES
-- Missing or incomplete items that need client action
-- -----------------------------------------------------------------------------
CREATE TABLE deficiencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    category deficiency_category DEFAULT 'other',
    deficiency_text TEXT NOT NULL,
    status deficiency_status NOT NULL DEFAULT 'open',
    created_by TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deficiencies_matter ON deficiencies(matter_id);
CREATE INDEX idx_deficiencies_status ON deficiencies(status);

-- -----------------------------------------------------------------------------
-- ENTITIES
-- People and businesses for conflicts checking
-- -----------------------------------------------------------------------------
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type entity_type NOT NULL,
    full_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,  -- Lowercased, stripped, for matching
    aliases TEXT[],  -- Array of alternate names
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigram index for fuzzy matching
CREATE INDEX idx_entities_normalized_trgm ON entities USING gin (normalized_name gin_trgm_ops);
CREATE INDEX idx_entities_full_name ON entities(full_name);

-- -----------------------------------------------------------------------------
-- MATTER_ENTITIES
-- Links entities to matters with their role
-- -----------------------------------------------------------------------------
CREATE TABLE matter_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    role entity_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(matter_id, entity_id, role)
);

CREATE INDEX idx_matter_entities_matter ON matter_entities(matter_id);
CREATE INDEX idx_matter_entities_entity ON matter_entities(entity_id);

-- -----------------------------------------------------------------------------
-- RESTRICTED_ENTITIES
-- Do-not-work entities (internal blocklist)
-- -----------------------------------------------------------------------------
CREATE TABLE restricted_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    normalized_name TEXT NOT NULL,
    display_name TEXT,
    reason TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_restricted_normalized ON restricted_entities(normalized_name);
CREATE INDEX idx_restricted_active ON restricted_entities(active) WHERE active = true;

-- -----------------------------------------------------------------------------
-- CONFLICT_CHECKS
-- Audit log of all conflicts checks run
-- -----------------------------------------------------------------------------
CREATE TABLE conflict_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    run_at TIMESTAMPTZ DEFAULT NOW(),
    run_by TEXT,
    result conflict_result NOT NULL,
    matches JSONB,  -- Array of {entity_id, name, match_type, score}
    decision conflict_decision,
    decision_by TEXT,
    decision_notes TEXT,
    decision_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conflict_checks_matter ON conflict_checks(matter_id);

-- -----------------------------------------------------------------------------
-- DELIVERIES
-- Record of all deliverables sent to clients
-- -----------------------------------------------------------------------------
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    delivery_type delivery_type NOT NULL,
    delivery_version INTEGER DEFAULT 1,  -- 1 = initial, 2+ = revised
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_by TEXT,
    qc_completed BOOLEAN DEFAULT false,
    qc_completed_by TEXT,
    qc_completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_matter ON deliveries(matter_id);

-- -----------------------------------------------------------------------------
-- BILLABLES
-- Line items for billing (auto-generated from deliveries + manual adjustments)
-- -----------------------------------------------------------------------------
CREATE TABLE billables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    billable_type billable_type NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1,
    unit TEXT DEFAULT 'each',  -- 'each' or 'hour'
    approved BOOLEAN DEFAULT true,
    billable_date DATE DEFAULT CURRENT_DATE,
    invoice_id UUID,  -- Set when attached to invoice
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billables_firm ON billables(firm_id);
CREATE INDEX idx_billables_matter ON billables(matter_id);
CREATE INDEX idx_billables_invoice ON billables(invoice_id);
CREATE INDEX idx_billables_uninvoiced ON billables(invoice_id) WHERE invoice_id IS NULL;

-- -----------------------------------------------------------------------------
-- INVOICES
-- Weekly invoices to client firms
-- -----------------------------------------------------------------------------
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    invoice_number TEXT,  -- Human-readable invoice number
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status invoice_status NOT NULL DEFAULT 'draft',
    total NUMERIC(10, 2) DEFAULT 0,
    stripe_invoice_id TEXT,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint after invoices table exists
ALTER TABLE billables ADD CONSTRAINT fk_billables_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

CREATE INDEX idx_invoices_firm ON invoices(firm_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- -----------------------------------------------------------------------------
-- PAYMENTS
-- Payment records (mirrors Stripe for reference)
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- -----------------------------------------------------------------------------
-- TIME_LOGS
-- Time tracking for overage billing
-- -----------------------------------------------------------------------------
CREATE TABLE time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    logged_by TEXT,
    minutes INTEGER NOT NULL CHECK (minutes > 0),
    work_type TEXT,
    description TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_logs_matter ON time_logs(matter_id);

-- -----------------------------------------------------------------------------
-- APP_USERS
-- Application users for RLS (BizDeedz staff + client portal users)
-- -----------------------------------------------------------------------------
CREATE TABLE app_users (
    id UUID PRIMARY KEY,  -- Matches auth.users.id
    email TEXT NOT NULL,
    name TEXT,
    role user_role NOT NULL DEFAULT 'staff',
    firm_id UUID REFERENCES firms(id) ON DELETE SET NULL,  -- NULL for BizDeedz users
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_users_role ON app_users(role);
CREATE INDEX idx_app_users_firm ON app_users(firm_id);

-- -----------------------------------------------------------------------------
-- AUDIT_LOGS
-- General audit trail for important actions
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'ai_action', etc.
    changes JSONB,
    performed_by TEXT,
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at);

-- -----------------------------------------------------------------------------
-- INPUT_TEMPLATES
-- Default input checklists by case type
-- -----------------------------------------------------------------------------
CREATE TABLE input_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_type case_type NOT NULL,
    input_type TEXT NOT NULL,
    input_category deficiency_category,
    required BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(case_type, input_type)
);

-- =============================================================================
-- DEFAULT DATA: Input Templates
-- =============================================================================

-- Chapter 7 Required Inputs
INSERT INTO input_templates (case_type, input_type, input_category, required, sort_order) VALUES
-- Identity
('ch7', 'Government ID (front/back)', 'id', true, 1),
('ch7', 'Social Security card or proof of SSN', 'id', true, 2),
-- Income
('ch7', 'Paystubs - last 6 months', 'income', true, 10),
('ch7', 'Proof of other income (SSI/SSDI, child support, unemployment, pension)', 'income', false, 11),
-- Taxes
('ch7', 'Federal tax returns - last 2 years', 'taxes', true, 20),
-- Banking
('ch7', 'Bank statements - last 3 months (all accounts)', 'banking', true, 30),
-- Assets
('ch7', 'Vehicle info: year/make/model/VIN + loan statement', 'assets', false, 40),
('ch7', 'Real property: deed/mortgage statement + valuation', 'assets', false, 41),
('ch7', 'Retirement account statements', 'assets', false, 42),
('ch7', 'Insurance policies (auto/home/renters)', 'assets', false, 43),
('ch7', 'Lawsuits/claims details', 'assets', false, 44),
-- Debts
('ch7', 'Creditor list or credit report', 'debts', true, 50),
('ch7', 'Secured debt statements (auto/mortgage)', 'debts', false, 51),
('ch7', 'Priority claims (tax notices, child support arrears)', 'debts', false, 52),
-- Household
('ch7', 'Household size + dependents info', 'household', true, 60),
('ch7', 'Lease or mortgage statement', 'household', true, 61),
('ch7', 'Utility statements', 'household', false, 62),
-- Prior filings
('ch7', 'Prior bankruptcy case info', 'other', false, 70);

-- Chapter 13 Required Inputs (includes all Ch7 + additional)
INSERT INTO input_templates (case_type, input_type, input_category, required, sort_order) VALUES
-- Identity
('ch13', 'Government ID (front/back)', 'id', true, 1),
('ch13', 'Social Security card or proof of SSN', 'id', true, 2),
-- Income
('ch13', 'Paystubs - last 6 months', 'income', true, 10),
('ch13', 'Proof of other income (SSI/SSDI, child support, unemployment, pension)', 'income', false, 11),
-- Taxes
('ch13', 'Federal tax returns - last 2 years', 'taxes', true, 20),
-- Banking
('ch13', 'Bank statements - last 3 months (all accounts)', 'banking', true, 30),
-- Assets
('ch13', 'Vehicle info: year/make/model/VIN + loan statement', 'assets', false, 40),
('ch13', 'Real property: deed/mortgage statement + valuation', 'assets', false, 41),
('ch13', 'Retirement account statements', 'assets', false, 42),
('ch13', 'Insurance policies (auto/home/renters)', 'assets', false, 43),
('ch13', 'Lawsuits/claims details', 'assets', false, 44),
-- Debts
('ch13', 'Creditor list or credit report', 'debts', true, 50),
('ch13', 'Secured debt statements (auto/mortgage)', 'debts', false, 51),
('ch13', 'Priority claims (tax notices, child support arrears)', 'debts', false, 52),
-- Household
('ch13', 'Household size + dependents info', 'household', true, 60),
('ch13', 'Lease or mortgage statement', 'household', true, 61),
('ch13', 'Utility statements', 'household', false, 62),
-- Prior filings
('ch13', 'Prior bankruptcy case info', 'other', false, 70),
-- Ch13-specific
('ch13', 'Mortgage arrearage breakdown', 'plan_inputs', true, 80),
('ch13', 'Vehicle payoff + interest rate info', 'plan_inputs', false, 81),
('ch13', 'Monthly budget inputs', 'plan_inputs', true, 82),
('ch13', 'Domestic support obligations', 'plan_inputs', false, 83),
('ch13', 'Tax debt details (years/amounts)', 'plan_inputs', false, 84),
('ch13', 'Attorney plan direction notes', 'plan_inputs', true, 85);

-- Amendment Required Inputs
INSERT INTO input_templates (case_type, input_type, input_category, required, sort_order) VALUES
('amendment', 'Written instruction: what changed + why', 'other', true, 1),
('amendment', 'Updated supporting documents', 'other', true, 2),
('amendment', 'Impacted schedules/forms identification', 'other', true, 3);

-- =============================================================================
-- BILLING RATES CONFIGURATION
-- =============================================================================
CREATE TABLE billing_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billable_type billable_type NOT NULL UNIQUE,
    default_amount NUMERIC(10, 2) NOT NULL,
    unit TEXT DEFAULT 'each',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO billing_rates (billable_type, default_amount, unit, description) VALUES
('ch7', 200.00, 'each', 'Chapter 7 Petition Preparation'),
('ch13', 350.00, 'each', 'Chapter 13 Petition Preparation'),
('amendment', 250.00, 'each', 'Amendment/Modification'),
('rush', 150.00, 'each', 'Rush Fee (24-48 hours)'),
('overage', 95.00, 'hour', 'Out of Scope Work'),
('retainer', 0.00, 'each', 'Monthly Retainer');

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to normalize names for conflict matching
CREATE OR REPLACE FUNCTION normalize_name(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(input_name, '\s+(jr|sr|ii|iii|iv)\.?$', '', 'i'),
                '[^\w\s]', '', 'g'
            ),
            '\s+', ' ', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create input checklist from templates
CREATE OR REPLACE FUNCTION create_matter_inputs(p_matter_id UUID, p_case_type case_type)
RETURNS void AS $$
BEGIN
    INSERT INTO matter_inputs (matter_id, input_type, input_category, required)
    SELECT p_matter_id, input_type, input_category, required
    FROM input_templates
    WHERE case_type = p_case_type
    ORDER BY sort_order;
END;
$$ LANGUAGE plpgsql;

-- Function to run conflicts check
CREATE OR REPLACE FUNCTION run_conflicts_check(
    p_matter_id UUID,
    p_run_by TEXT DEFAULT 'system'
)
RETURNS conflict_result AS $$
DECLARE
    v_result conflict_result := 'clear';
    v_matches JSONB := '[]'::jsonb;
    v_entity RECORD;
    v_match RECORD;
    v_similarity FLOAT;
BEGIN
    -- Get all entities for this matter
    FOR v_entity IN
        SELECT e.id, e.normalized_name, e.full_name
        FROM matter_entities me
        JOIN entities e ON e.id = me.entity_id
        WHERE me.matter_id = p_matter_id
    LOOP
        -- Check against restricted entities (exact match)
        IF EXISTS (
            SELECT 1 FROM restricted_entities
            WHERE active = true
            AND normalized_name = v_entity.normalized_name
        ) THEN
            v_result := 'conflict';
            v_matches := v_matches || jsonb_build_object(
                'entity_id', v_entity.id,
                'name', v_entity.full_name,
                'match_type', 'restricted_exact',
                'score', 1.0
            );
        END IF;

        -- Check against other matters (exact match on normalized name)
        FOR v_match IN
            SELECT DISTINCT e.id, e.full_name, m.matter_name, m.firm_id
            FROM matter_entities me
            JOIN entities e ON e.id = me.entity_id
            JOIN matters m ON m.id = me.matter_id
            WHERE me.matter_id != p_matter_id
            AND e.normalized_name = v_entity.normalized_name
        LOOP
            IF v_result != 'conflict' THEN
                v_result := 'potential';
            END IF;
            v_matches := v_matches || jsonb_build_object(
                'entity_id', v_match.id,
                'name', v_match.full_name,
                'match_type', 'exact',
                'matched_matter', v_match.matter_name,
                'score', 1.0
            );
        END LOOP;

        -- Fuzzy match (similarity >= 0.85) against other entities
        FOR v_match IN
            SELECT e.id, e.full_name, similarity(e.normalized_name, v_entity.normalized_name) as sim
            FROM entities e
            WHERE e.id != v_entity.id
            AND e.normalized_name % v_entity.normalized_name
            AND similarity(e.normalized_name, v_entity.normalized_name) >= 0.85
        LOOP
            IF v_result = 'clear' THEN
                v_result := 'potential';
            END IF;
            v_matches := v_matches || jsonb_build_object(
                'entity_id', v_match.id,
                'name', v_match.full_name,
                'match_type', 'fuzzy',
                'score', v_match.sim
            );
        END LOOP;
    END LOOP;

    -- Record the check
    INSERT INTO conflict_checks (matter_id, run_by, result, matches)
    VALUES (p_matter_id, p_run_by, v_result, v_matches);

    -- Update matter status
    UPDATE matters
    SET conflicts_status = v_result::text::conflicts_status,
        updated_at = NOW()
    WHERE id = p_matter_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to create billables from delivery
CREATE OR REPLACE FUNCTION create_delivery_billables(
    p_matter_id UUID,
    p_delivery_type delivery_type,
    p_is_rush BOOLEAN DEFAULT false
)
RETURNS void AS $$
DECLARE
    v_firm_id UUID;
    v_base_amount NUMERIC;
    v_rush_amount NUMERIC;
    v_matter_name TEXT;
BEGIN
    -- Get firm and matter info
    SELECT firm_id, matter_name INTO v_firm_id, v_matter_name
    FROM matters WHERE id = p_matter_id;

    -- Get base rate
    SELECT default_amount INTO v_base_amount
    FROM billing_rates
    WHERE billable_type = p_delivery_type::text::billable_type;

    -- Create base billable
    INSERT INTO billables (firm_id, matter_id, billable_type, amount, description, billable_date)
    VALUES (
        v_firm_id,
        p_matter_id,
        p_delivery_type::text::billable_type,
        v_base_amount,
        p_delivery_type::text || ' Petition Prep – [Matter: ' || v_matter_name || ']',
        CURRENT_DATE
    );

    -- Add rush fee if applicable
    IF p_is_rush THEN
        SELECT default_amount INTO v_rush_amount
        FROM billing_rates WHERE billable_type = 'rush';

        INSERT INTO billables (firm_id, matter_id, billable_type, amount, description, billable_date)
        VALUES (
            v_firm_id,
            p_matter_id,
            'rush',
            v_rush_amount,
            'Rush Fee (24-48 hrs) – [Matter: ' || v_matter_name || '] – Authorized',
            CURRENT_DATE
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_firms_updated_at BEFORE UPDATE ON firms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_matters_updated_at BEFORE UPDATE ON matters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_matter_inputs_updated_at BEFORE UPDATE ON matter_inputs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_deficiencies_updated_at BEFORE UPDATE ON deficiencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_restricted_entities_updated_at BEFORE UPDATE ON restricted_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_billables_updated_at BEFORE UPDATE ON billables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_app_users_updated_at BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_billing_rates_updated_at BEFORE UPDATE ON billing_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to create input checklist when matter is created
CREATE OR REPLACE FUNCTION on_matter_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Create input checklist from templates
    PERFORM create_matter_inputs(NEW.id, NEW.case_type);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_matter_created AFTER INSERT ON matters
    FOR EACH ROW EXECUTE FUNCTION on_matter_created();

-- Trigger to normalize entity names
CREATE OR REPLACE FUNCTION on_entity_insert_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name := normalize_name(NEW.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entity_normalize BEFORE INSERT OR UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION on_entity_insert_update();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE billables ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Admin and staff have full access
CREATE POLICY admin_staff_all ON firms
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY admin_staff_all ON contacts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY admin_staff_all ON matters
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY admin_staff_all ON matter_inputs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY admin_staff_all ON deficiencies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY admin_staff_all ON deliveries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY admin_staff_all ON billables
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY admin_staff_all ON invoices
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'staff')
        )
    );

-- Policy: Client users can only see their firm's data
CREATE POLICY client_firm_read ON matters
    FOR SELECT
    USING (
        firm_id = (
            SELECT firm_id FROM app_users WHERE id = auth.uid()
        )
    );

CREATE POLICY client_firm_read ON invoices
    FOR SELECT
    USING (
        firm_id = (
            SELECT firm_id FROM app_users WHERE id = auth.uid()
        )
    );

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Sample firm
INSERT INTO firms (id, firm_name, status, retainer_amount, billing_email, active_capacity)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Johnson & Associates', 'active', 2500.00, 'billing@johnsonlaw.com', true),
    ('22222222-2222-2222-2222-222222222222', 'Smith Legal Group', 'active', 1500.00, 'accounts@smithlegal.com', true),
    ('33333333-3333-3333-3333-333333333333', 'Davis Bankruptcy Law', 'on_hold', 2000.00, 'davis@dbllaw.com', false);

-- Sample contacts
INSERT INTO contacts (firm_id, name, email, phone, role, is_primary) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Mark Johnson', 'mjohnson@johnsonlaw.com', '555-0100', 'attorney', true),
    ('11111111-1111-1111-1111-111111111111', 'Sarah Williams', 'swilliams@johnsonlaw.com', '555-0101', 'staff', false),
    ('22222222-2222-2222-2222-222222222222', 'Linda Smith', 'lsmith@smithlegal.com', '555-0200', 'attorney', true),
    ('33333333-3333-3333-3333-333333333333', 'Robert Davis', 'rdavis@dbllaw.com', '555-0300', 'attorney', true);

-- Sample matters
INSERT INTO matters (id, firm_id, matter_name, case_type, district, deadline, rush, status_stage, inputs_status, conflicts_status, assigned_to) VALUES
    ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Adams, Michael – Ch 7', 'ch7', 'N.D. Texas', '2026-02-15', false, 'in_progress', 'complete', 'clear', 'Turea'),
    ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Baker, Jennifer – Ch 13', 'ch13', 'N.D. Texas', '2026-02-20', true, 'qc', 'complete', 'clear', 'Turea'),
    ('aaaa3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Clark, David – Ch 7', 'ch7', 'S.D. Texas', '2026-02-18', false, 'waiting_inputs', 'incomplete', 'not_run', 'Staff'),
    ('aaaa4444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Evans, Susan – Amendment', 'amendment', 'S.D. Texas', '2026-02-10', false, 'delivered', 'complete', 'clear', 'Turea'),
    ('aaaa5555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Foster, William – Ch 7', 'ch7', 'E.D. Texas', '2026-02-25', false, 'paused_ar', 'complete', 'clear', 'Staff');

-- Sample entities
INSERT INTO entities (id, entity_type, full_name, address) VALUES
    ('eeee1111-1111-1111-1111-111111111111', 'person', 'Michael Adams', '123 Main St, Dallas, TX'),
    ('eeee2222-2222-2222-2222-222222222222', 'person', 'Jennifer Baker', '456 Oak Ave, Fort Worth, TX'),
    ('eeee3333-3333-3333-3333-333333333333', 'person', 'Thomas Baker', '456 Oak Ave, Fort Worth, TX'),
    ('eeee4444-4444-4444-4444-444444444444', 'person', 'David Clark', '789 Elm St, Houston, TX'),
    ('eeee5555-5555-5555-5555-555555555555', 'person', 'Susan Evans', '321 Pine Rd, Austin, TX'),
    ('eeee6666-6666-6666-6666-666666666666', 'person', 'William Foster', '654 Cedar Ln, San Antonio, TX');

-- Link entities to matters
INSERT INTO matter_entities (matter_id, entity_id, role) VALUES
    ('aaaa1111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111', 'debtor'),
    ('aaaa2222-2222-2222-2222-222222222222', 'eeee2222-2222-2222-2222-222222222222', 'debtor'),
    ('aaaa2222-2222-2222-2222-222222222222', 'eeee3333-3333-3333-3333-333333333333', 'spouse'),
    ('aaaa3333-3333-3333-3333-333333333333', 'eeee4444-4444-4444-4444-444444444444', 'debtor'),
    ('aaaa4444-4444-4444-4444-444444444444', 'eeee5555-5555-5555-5555-555555555555', 'debtor'),
    ('aaaa5555-5555-5555-5555-555555555555', 'eeee6666-6666-6666-6666-666666666666', 'debtor');

-- Sample deliveries
INSERT INTO deliveries (matter_id, delivery_type, delivered_at, delivered_by, qc_completed, qc_completed_by) VALUES
    ('aaaa4444-4444-4444-4444-444444444444', 'amendment', '2026-02-03 14:30:00', 'Turea', true, 'QC Team');

-- Sample billables
INSERT INTO billables (firm_id, matter_id, billable_type, amount, description, billable_date) VALUES
    ('22222222-2222-2222-2222-222222222222', 'aaaa4444-4444-4444-4444-444444444444', 'amendment', 250.00, 'Amendment/Modification – [Matter: Evans, Susan – Amendment] – Delivered 2026-02-03', '2026-02-03'),
    ('11111111-1111-1111-1111-111111111111', NULL, 'retainer', 2500.00, 'Monthly Retainer - February 2026', '2026-02-01'),
    ('22222222-2222-2222-2222-222222222222', NULL, 'retainer', 1500.00, 'Monthly Retainer - February 2026', '2026-02-01');

-- Sample invoice
INSERT INTO invoices (id, firm_id, invoice_number, invoice_date, status, total) VALUES
    ('iiii1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'INV-2026-001', '2026-01-31', 'overdue', 650.00);
