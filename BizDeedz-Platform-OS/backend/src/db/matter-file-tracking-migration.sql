-- Matter File Tracking Migration
-- Adds folder_path tracking for /srv/data file system integration

-- ============================================================================
-- 1. ADD FOLDER_PATH TO MATTERS TABLE
-- ============================================================================

-- Add folder_path column to track canonical file system location
ALTER TABLE matters ADD COLUMN IF NOT EXISTS folder_path VARCHAR(500);
ALTER TABLE matters ADD COLUMN IF NOT EXISTS client_key VARCHAR(100);

-- Create index for folder path lookups
CREATE INDEX IF NOT EXISTS idx_matters_folder_path ON matters(folder_path);
CREATE INDEX IF NOT EXISTS idx_matters_client_key ON matters(client_key);

COMMENT ON COLUMN matters.folder_path IS 'Canonical file system path: /srv/data/clients/{client_key}/matters/{matter_key}';
COMMENT ON COLUMN matters.client_key IS 'URL-safe client identifier for folder naming';

-- ============================================================================
-- 2. UPDATE ARTIFACTS TABLE (file_path is now primary location)
-- ============================================================================

-- Rename storage_pointer to legacy_storage_pointer (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'artifacts' AND column_name = 'storage_pointer'
    ) THEN
        ALTER TABLE artifacts RENAME COLUMN storage_pointer TO legacy_storage_pointer;
    END IF;
END $$;

-- Ensure file_path column exists (added in openclaw-integration-migration.sql)
-- This is idempotent - won't error if column already exists
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS file_path VARCHAR(1000);

-- Add file metadata columns if not exists
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

COMMENT ON COLUMN artifacts.file_path IS 'Actual file system path relative to /srv/data';
COMMENT ON COLUMN artifacts.original_filename IS 'Original filename when uploaded';

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function to generate client_key from client_name
-- Pattern: {last_name}_{first_initial}_{uuid_suffix}
-- Example: "John Smith" → "smith_j_a3f2"
CREATE OR REPLACE FUNCTION generate_client_key(p_client_name VARCHAR(255)) RETURNS VARCHAR(100) AS $$
DECLARE
    v_parts TEXT[];
    v_last_name TEXT;
    v_first_initial TEXT;
    v_suffix TEXT;
    v_client_key TEXT;
BEGIN
    -- Split name on space
    v_parts := string_to_array(LOWER(TRIM(p_client_name)), ' ');

    -- Get last name (last element)
    v_last_name := regexp_replace(v_parts[array_length(v_parts, 1)], '[^a-z0-9]', '', 'g');

    -- Get first initial
    IF array_length(v_parts, 1) > 1 THEN
        v_first_initial := substring(v_parts[1], 1, 1);
    ELSE
        v_first_initial := substring(v_last_name, 1, 1);
    END IF;

    -- Generate short suffix from UUID
    v_suffix := substring(md5(random()::text || p_client_name), 1, 4);

    -- Combine
    v_client_key := v_last_name || '_' || v_first_initial || '_' || v_suffix;

    -- Ensure max 100 chars
    RETURN substring(v_client_key, 1, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to generate matter_key from matter data
-- Pattern: {matter_type}_{number_suffix}
-- Example: "bankruptcy_001", "divorce_042"
CREATE OR REPLACE FUNCTION generate_matter_key(p_matter_type_id VARCHAR(50), p_matter_number VARCHAR(50)) RETURNS VARCHAR(100) AS $$
DECLARE
    v_matter_key TEXT;
    v_number_suffix TEXT;
BEGIN
    -- Extract numeric suffix from matter_number or use random
    v_number_suffix := regexp_replace(p_matter_number, '[^0-9]', '', 'g');

    IF v_number_suffix = '' THEN
        v_number_suffix := lpad(floor(random() * 1000)::text, 3, '0');
    END IF;

    -- Combine matter type with number
    v_matter_key := p_matter_type_id || '_' || v_number_suffix;

    RETURN substring(v_matter_key, 1, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to generate full folder path for a matter
CREATE OR REPLACE FUNCTION generate_matter_folder_path(
    p_client_name VARCHAR(255),
    p_matter_type_id VARCHAR(50),
    p_matter_number VARCHAR(50)
) RETURNS VARCHAR(500) AS $$
DECLARE
    v_client_key VARCHAR(100);
    v_matter_key VARCHAR(100);
    v_folder_path VARCHAR(500);
BEGIN
    v_client_key := generate_client_key(p_client_name);
    v_matter_key := generate_matter_key(p_matter_type_id, p_matter_number);

    v_folder_path := 'clients/' || v_client_key || '/matters/' || v_matter_key;

    RETURN v_folder_path;
END;
$$ LANGUAGE plpgsql;

-- Function to update folder_path when matter is created/updated
CREATE OR REPLACE FUNCTION update_matter_folder_path() RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if folder_path is NULL
    IF NEW.folder_path IS NULL THEN
        NEW.client_key := generate_client_key(NEW.client_name);
        NEW.folder_path := generate_matter_folder_path(
            NEW.client_name,
            NEW.matter_type_id,
            NEW.matter_number
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate folder paths
DROP TRIGGER IF EXISTS trigger_matter_folder_path ON matters;
CREATE TRIGGER trigger_matter_folder_path
    BEFORE INSERT OR UPDATE ON matters
    FOR EACH ROW
    EXECUTE FUNCTION update_matter_folder_path();

-- ============================================================================
-- 4. BACKFILL EXISTING MATTERS
-- ============================================================================

-- Generate folder paths for existing matters without them
UPDATE matters
SET
    client_key = generate_client_key(client_name),
    folder_path = generate_matter_folder_path(client_name, matter_type_id, matter_number)
WHERE folder_path IS NULL;

-- ============================================================================
-- 5. VIEWS FOR FILE MANAGEMENT
-- ============================================================================

-- View showing all matters with their file system paths
CREATE OR REPLACE VIEW v_matters_with_paths AS
SELECT
    m.matter_id,
    m.matter_number,
    m.client_name,
    m.client_key,
    m.folder_path,
    CONCAT('/srv/data/', m.folder_path) as full_path,
    CONCAT('/srv/data/', m.folder_path, '/artifacts') as artifacts_path,
    CONCAT('/srv/data/', m.folder_path, '/work_product') as work_product_path,
    CONCAT('/srv/data/', m.folder_path, '/exports') as exports_path,
    m.status,
    m.opened_at,
    m.closed_at,
    pa.name as practice_area_name,
    mt.name as matter_type_name
FROM matters m
LEFT JOIN practice_areas pa ON m.practice_area_id = pa.practice_area_id
LEFT JOIN matter_types mt ON m.matter_type_id = mt.matter_type_id;

COMMENT ON VIEW v_matters_with_paths IS 'Matters with computed file system paths';

-- View showing all artifacts with file locations
CREATE OR REPLACE VIEW v_artifacts_with_files AS
SELECT
    a.artifact_id,
    a.matter_id,
    a.name as artifact_name,
    a.file_path,
    CONCAT('/srv/data/', a.file_path) as full_file_path,
    a.original_filename,
    a.mime_type,
    a.file_size_bytes,
    a.checksum_sha256,
    a.version,
    a.status as artifact_status,
    a.storage_provider,
    a.created_by_type,
    a.created_at,
    m.matter_number,
    m.client_name,
    m.folder_path as matter_folder_path,
    at.name as artifact_type_name
FROM artifacts a
LEFT JOIN matters m ON a.matter_id = m.matter_id
LEFT JOIN artifact_types at ON a.artifact_type_id = at.artifact_type_id;

COMMENT ON VIEW v_artifacts_with_files IS 'Artifacts with file system locations and matter context';

-- View for file orphan detection
CREATE OR REPLACE VIEW v_artifact_file_status AS
SELECT
    a.artifact_id,
    a.name,
    a.file_path,
    a.status,
    CASE
        WHEN a.file_path IS NULL THEN 'missing_path'
        WHEN a.checksum_sha256 IS NULL THEN 'missing_checksum'
        WHEN a.file_size_bytes IS NULL THEN 'missing_size'
        WHEN a.file_path IS NOT NULL AND a.checksum_sha256 IS NOT NULL THEN 'ok'
        ELSE 'unknown'
    END as file_status,
    a.created_at,
    m.matter_number,
    m.client_name
FROM artifacts a
LEFT JOIN matters m ON a.matter_id = m.matter_id;

COMMENT ON VIEW v_artifact_file_status IS 'Artifact file integrity status for monitoring';

-- ============================================================================
-- 6. STORED PROCEDURES FOR OPENCLAW
-- ============================================================================

-- Procedure to register an artifact with file path
-- This is called by OpenClaw after moving a file to canonical location
CREATE OR REPLACE FUNCTION register_artifact_file(
    p_artifact_id UUID,
    p_file_path VARCHAR(1000),
    p_checksum_sha256 VARCHAR(64),
    p_file_size_bytes BIGINT,
    p_mime_type VARCHAR(100),
    p_original_filename VARCHAR(255)
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE artifacts
    SET
        file_path = p_file_path,
        checksum_sha256 = p_checksum_sha256,
        file_size_bytes = p_file_size_bytes,
        mime_type = p_mime_type,
        original_filename = COALESCE(p_original_filename, original_filename),
        status = CASE
            WHEN status = 'draft' THEN 'filed'
            ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE artifact_id = p_artifact_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION register_artifact_file IS 'Update artifact with actual file system location and metadata';

-- Procedure to ensure matter folder exists (for OpenClaw to call before filing)
CREATE OR REPLACE FUNCTION get_or_create_matter_folder(
    p_matter_id UUID
) RETURNS TABLE(
    matter_id UUID,
    client_key VARCHAR(100),
    folder_path VARCHAR(500),
    full_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.matter_id,
        m.client_key,
        m.folder_path,
        CONCAT('/srv/data/', m.folder_path) as full_path
    FROM matters m
    WHERE m.matter_id = p_matter_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_create_matter_folder IS 'Get matter folder path (OpenClaw creates physical directory)';

-- ============================================================================
-- 7. CONSTRAINTS AND VALIDATIONS
-- ============================================================================

-- Ensure artifacts with file_path have checksums
ALTER TABLE artifacts ADD CONSTRAINT chk_artifact_file_integrity
    CHECK (
        (file_path IS NULL) OR
        (file_path IS NOT NULL AND checksum_sha256 IS NOT NULL)
    );

-- Ensure folder_path follows pattern
ALTER TABLE matters ADD CONSTRAINT chk_matter_folder_path_pattern
    CHECK (
        folder_path IS NULL OR
        folder_path ~ '^clients/[a-z0-9_]+/matters/[a-z0-9_]+$'
    );

-- ============================================================================
-- 8. MIGRATION LOG
-- ============================================================================

-- Log this migration
DO $$
BEGIN
    RAISE NOTICE '==============================================================';
    RAISE NOTICE 'Matter File Tracking Migration completed successfully';
    RAISE NOTICE '==============================================================';
    RAISE NOTICE 'Tables updated:';
    RAISE NOTICE '  - matters: Added folder_path and client_key columns';
    RAISE NOTICE '  - artifacts: Renamed storage_pointer, added file metadata';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - generate_client_key(client_name)';
    RAISE NOTICE '  - generate_matter_key(matter_type_id, matter_number)';
    RAISE NOTICE '  - generate_matter_folder_path(client_name, matter_type, number)';
    RAISE NOTICE '  - register_artifact_file(artifact_id, file_path, checksum, size, mime, filename)';
    RAISE NOTICE '  - get_or_create_matter_folder(matter_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  - v_matters_with_paths: Matters with file system paths';
    RAISE NOTICE '  - v_artifacts_with_files: Artifacts with file locations';
    RAISE NOTICE '  - v_artifact_file_status: File integrity monitoring';
    RAISE NOTICE '';
    RAISE NOTICE 'Triggers created:';
    RAISE NOTICE '  - trigger_matter_folder_path: Auto-generate folder paths on insert/update';
    RAISE NOTICE '==============================================================';
END $$;
