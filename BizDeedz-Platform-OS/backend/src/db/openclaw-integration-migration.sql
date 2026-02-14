-- OpenClaw Integration Migration
-- File-system-first integration between BizDeedz Platform OS and OpenClaw

-- ============================================================================
-- 1. SERVICE ACCOUNTS TABLE
-- ============================================================================
-- Service accounts for system-to-system authentication
CREATE TABLE IF NOT EXISTS service_accounts (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    api_key_hash VARCHAR(255) NOT NULL,
    scopes TEXT[] NOT NULL, -- Array of scopes: ingestion:write, artifacts:write, tasks:write, events:write, ai_runs:write
    enabled BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_accounts_name ON service_accounts(name);
CREATE INDEX idx_service_accounts_enabled ON service_accounts(enabled);

COMMENT ON TABLE service_accounts IS 'Service accounts for system-to-system API authentication';
COMMENT ON COLUMN service_accounts.scopes IS 'Array of permission scopes - service accounts cannot approve or close matters';

-- ============================================================================
-- 2. AUTOMATION_JOBS TABLE
-- ============================================================================
-- Registry of scheduled automation jobs
CREATE TABLE IF NOT EXISTS automation_jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    schedule VARCHAR(100), -- Cron expression
    enabled BOOLEAN DEFAULT true,
    risk_default VARCHAR(20) CHECK (risk_default IN ('low', 'medium', 'high')) DEFAULT 'low',
    service_account_id UUID REFERENCES service_accounts(service_id),
    config_json JSONB, -- Job-specific configuration
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_automation_jobs_name ON automation_jobs(name);
CREATE INDEX idx_automation_jobs_enabled ON automation_jobs(enabled);
CREATE INDEX idx_automation_jobs_next_run ON automation_jobs(next_run_at);

COMMENT ON TABLE automation_jobs IS 'Registry of scheduled automation jobs run by OpenClaw';

-- ============================================================================
-- 3. AUTOMATION_RUNS TABLE
-- ============================================================================
-- Audit log for all automation executions
CREATE TABLE IF NOT EXISTS automation_runs (
    run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES automation_jobs(job_id),
    job_name VARCHAR(100) NOT NULL, -- Denormalized for fast lookup
    correlation_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'timeout', 'cancelled')) DEFAULT 'running',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_ms INTEGER,
    error_message TEXT,
    inputs_ref TEXT, -- File path or reference to inputs
    outputs_ref TEXT, -- File path or reference to outputs
    items_processed INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,4),
    cost_actual DECIMAL(10,4),
    service_account_id UUID REFERENCES service_accounts(service_id),
    metadata_json JSONB
);

CREATE INDEX idx_automation_runs_job ON automation_runs(job_id);
CREATE INDEX idx_automation_runs_correlation ON automation_runs(correlation_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);
CREATE INDEX idx_automation_runs_started_at ON automation_runs(started_at);
CREATE INDEX idx_automation_runs_job_name ON automation_runs(job_name);

COMMENT ON TABLE automation_runs IS 'Complete audit trail of automation executions';
COMMENT ON COLUMN automation_runs.correlation_id IS 'Unique ID for tracking related operations across services';

-- ============================================================================
-- 4. JOB_LOCKS TABLE
-- ============================================================================
-- Distributed locking to prevent concurrent job execution
CREATE TABLE IF NOT EXISTS job_locks (
    lock_key VARCHAR(100) PRIMARY KEY,
    locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_by VARCHAR(100) NOT NULL, -- Service name or instance ID
    expires_at TIMESTAMP NOT NULL,
    run_id UUID REFERENCES automation_runs(run_id),
    metadata_json JSONB
);

CREATE INDEX idx_job_locks_expires_at ON job_locks(expires_at);

COMMENT ON TABLE job_locks IS 'Distributed locks to prevent duplicate job execution';

-- ============================================================================
-- 5. INGESTION_ITEMS TABLE
-- ============================================================================
-- Tracking for documents awaiting classification and filing
CREATE TABLE IF NOT EXISTS ingestion_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL, -- inbox, email, api, portal
    raw_uri TEXT NOT NULL, -- File path or URL
    original_filename VARCHAR(255),
    checksum_sha256 VARCHAR(64),
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    detected_type VARCHAR(100), -- Document type classification
    confidence DECIMAL(5,2), -- Classification confidence 0-100
    proposed_matter_id UUID REFERENCES matters(matter_id),
    proposed_artifact_type VARCHAR(50) REFERENCES artifact_types(artifact_type_id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'classified', 'filed', 'rejected', 'error')) DEFAULT 'pending',
    filed_artifact_id UUID REFERENCES artifacts(artifact_id),
    handled_by UUID REFERENCES users(user_id),
    automation_run_id UUID REFERENCES automation_runs(run_id),
    correlation_id UUID,
    error_message TEXT,
    metadata_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingestion_items_source ON ingestion_items(source);
CREATE INDEX idx_ingestion_items_status ON ingestion_items(status);
CREATE INDEX idx_ingestion_items_matter ON ingestion_items(proposed_matter_id);
CREATE INDEX idx_ingestion_items_checksum ON ingestion_items(checksum_sha256);
CREATE INDEX idx_ingestion_items_automation_run ON ingestion_items(automation_run_id);
CREATE INDEX idx_ingestion_items_correlation ON ingestion_items(correlation_id);
CREATE INDEX idx_ingestion_items_created_at ON ingestion_items(created_at);

COMMENT ON TABLE ingestion_items IS 'Tracking for unfiled documents awaiting classification';

-- ============================================================================
-- 6. UPDATE ARTIFACTS TABLE (file-authoritative)
-- ============================================================================
-- Add new columns to make artifacts file-system authoritative
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS file_uri TEXT;
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50) CHECK (storage_provider IN ('local', 'sharepoint', 'gdrive', 's3')) DEFAULT 'local';
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS checksum_sha256 VARCHAR(64);
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS status VARCHAR(50) CHECK (status IN ('draft', 'qc_pending', 'approved', 'filed', 'rejected')) DEFAULT 'draft';
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS qc_gate VARCHAR(100);
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) CHECK (created_by_type IN ('user', 'service', 'automation', 'ai')) DEFAULT 'user';
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS ingestion_item_id UUID REFERENCES ingestion_items(item_id);
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS correlation_id UUID;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_artifacts_file_uri ON artifacts(file_uri);
CREATE INDEX IF NOT EXISTS idx_artifacts_checksum ON artifacts(checksum_sha256);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_ingestion_item ON artifacts(ingestion_item_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_correlation ON artifacts(correlation_id);

-- Update existing records to have default status
UPDATE artifacts SET status = 'filed' WHERE status IS NULL;

COMMENT ON COLUMN artifacts.file_uri IS 'Canonical file path or remote URL';
COMMENT ON COLUMN artifacts.checksum_sha256 IS 'SHA-256 hash for integrity verification';
COMMENT ON COLUMN artifacts.correlation_id IS 'Links artifact to automation run that created it';

-- ============================================================================
-- 7. UPDATE EVENTS TABLE
-- ============================================================================
-- Enhance events table for better integration tracking
ALTER TABLE events ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS correlation_id UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS service_account_id UUID REFERENCES service_accounts(service_id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS automation_run_id UUID REFERENCES automation_runs(run_id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS payload JSONB;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON events(entity_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_correlation ON events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_service_account ON events(service_account_id);
CREATE INDEX IF NOT EXISTS idx_events_automation_run ON events(automation_run_id);

COMMENT ON COLUMN events.correlation_id IS 'Groups related events across systems';
COMMENT ON COLUMN events.entity_type IS 'Type of entity: ingestion_item, artifact, task, matter, etc';
COMMENT ON COLUMN events.entity_id IS 'ID of the entity being tracked';

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to acquire a job lock
CREATE OR REPLACE FUNCTION acquire_job_lock(
    p_lock_key VARCHAR(100),
    p_locked_by VARCHAR(100),
    p_expiry_seconds INTEGER DEFAULT 300,
    p_run_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
    v_expires_at TIMESTAMP := v_now + (p_expiry_seconds || ' seconds')::INTERVAL;
    v_existing_lock RECORD;
BEGIN
    -- Check for existing lock
    SELECT * INTO v_existing_lock FROM job_locks WHERE lock_key = p_lock_key;

    -- If lock exists and not expired, return false
    IF FOUND AND v_existing_lock.expires_at > v_now THEN
        RETURN FALSE;
    END IF;

    -- If lock exists but expired, delete it
    IF FOUND THEN
        DELETE FROM job_locks WHERE lock_key = p_lock_key;
    END IF;

    -- Insert new lock
    INSERT INTO job_locks (lock_key, locked_by, locked_at, expires_at, run_id)
    VALUES (p_lock_key, p_locked_by, v_now, v_expires_at, p_run_id);

    RETURN TRUE;
EXCEPTION
    WHEN unique_violation THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to release a job lock
CREATE OR REPLACE FUNCTION release_job_lock(
    p_lock_key VARCHAR(100),
    p_locked_by VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM job_locks
    WHERE lock_key = p_lock_key
      AND locked_by = p_locked_by;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks() RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM job_locks WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION acquire_job_lock IS 'Attempts to acquire a distributed lock for job execution';
COMMENT ON FUNCTION release_job_lock IS 'Releases a lock held by the specified service';
COMMENT ON FUNCTION cleanup_expired_locks IS 'Removes all expired locks from the table';

-- ============================================================================
-- 9. VIEWS FOR MONITORING
-- ============================================================================

-- View for recent automation activity
CREATE OR REPLACE VIEW v_automation_runs_recent AS
SELECT
    ar.run_id,
    ar.job_name,
    ar.correlation_id,
    ar.status,
    ar.started_at,
    ar.ended_at,
    ar.duration_ms,
    ar.items_processed,
    ar.items_created,
    ar.items_failed,
    sa.name as service_account_name,
    aj.risk_default
FROM automation_runs ar
LEFT JOIN service_accounts sa ON ar.service_account_id = sa.service_id
LEFT JOIN automation_jobs aj ON ar.job_id = aj.job_id
ORDER BY ar.started_at DESC
LIMIT 100;

COMMENT ON VIEW v_automation_runs_recent IS 'Last 100 automation runs with service account info';

-- View for pending ingestion items
CREATE OR REPLACE VIEW v_ingestion_items_pending AS
SELECT
    ii.item_id,
    ii.source,
    ii.original_filename,
    ii.mime_type,
    ii.file_size_bytes,
    ii.detected_type,
    ii.confidence,
    ii.status,
    ii.created_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ii.created_at)) / 3600 AS age_hours,
    m.matter_number,
    m.client_name,
    at.name as artifact_type_name
FROM ingestion_items ii
LEFT JOIN matters m ON ii.proposed_matter_id = m.matter_id
LEFT JOIN artifact_types at ON ii.proposed_artifact_type = at.artifact_type_id
WHERE ii.status IN ('pending', 'classified')
ORDER BY ii.created_at ASC;

COMMENT ON VIEW v_ingestion_items_pending IS 'Pending ingestion items with age and proposal details';

-- View for active locks
CREATE OR REPLACE VIEW v_active_locks AS
SELECT
    lock_key,
    locked_by,
    locked_at,
    expires_at,
    EXTRACT(EPOCH FROM (expires_at - CURRENT_TIMESTAMP)) AS seconds_until_expiry,
    run_id,
    ar.job_name,
    ar.status as run_status
FROM job_locks jl
LEFT JOIN automation_runs ar ON jl.run_id = ar.run_id
WHERE expires_at > CURRENT_TIMESTAMP
ORDER BY expires_at ASC;

COMMENT ON VIEW v_active_locks IS 'Currently active job locks with expiry details';

-- ============================================================================
-- 10. SEED DATA
-- ============================================================================

-- Insert default automation jobs
INSERT INTO automation_jobs (name, description, schedule, enabled, risk_default) VALUES
    ('inbox-scan', 'Scan inbox directory for new documents', '*/5 * * * *', true, 'low'),
    ('matter-health-update', 'Update health scores for all active matters', '0 */6 * * *', false, 'low'),
    ('backup-artifacts', 'Backup artifact files to external storage', '0 2 * * *', false, 'low')
ON CONFLICT (name) DO NOTHING;

-- Insert default artifact types if they don't exist
INSERT INTO artifact_types (artifact_type_id, name, category) VALUES
    ('unclassified', 'Unclassified Document', 'inbox'),
    ('client_id', 'Client Identification', 'client_docs'),
    ('signed_contract', 'Signed Contract', 'legal_docs'),
    ('court_filing', 'Court Filing', 'legal_docs'),
    ('evidence', 'Evidence Document', 'case_materials')
ON CONFLICT (artifact_type_id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration
DO $$
BEGIN
    RAISE NOTICE 'OpenClaw Integration Migration completed successfully';
    RAISE NOTICE 'Tables created: service_accounts, automation_jobs, automation_runs, job_locks, ingestion_items';
    RAISE NOTICE 'Tables updated: artifacts, events';
    RAISE NOTICE 'Functions created: acquire_job_lock, release_job_lock, cleanup_expired_locks';
    RAISE NOTICE 'Views created: v_automation_runs_recent, v_ingestion_items_pending, v_active_locks';
END $$;
