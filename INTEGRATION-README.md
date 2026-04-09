# OpenClaw ↔ BizDeedz Platform OS Integration

**File-System-First Integration for Law Firm Automation**

## Overview

This integration creates a production-grade connection between:
- **BizDeedz Platform OS**: System of record (PostgreSQL + REST API + governance)
- **OpenClaw**: Automation runtime (cron jobs, document ingestion, classification, processing)

Both systems run on the same VPS and share a canonical file lake for deterministic, observable document management.

## Architecture Principles

### Non-Negotiables
✅ Deterministic file paths - no guessing
✅ Platform OS owns all IDs, approvals, and audit logs
✅ OpenClaw never acts as admin - uses service accounts with scoped permissions
✅ Every automation run is fully observable (run records, correlation IDs, logs)
✅ Safe-by-default: locks prevent double-runs, retries with backoff, no destructive operations

### Key Design Decisions
- **File-System as Source of Truth**: All documents stored in `/srv/data/clients/{client}/{matter}/`
- **Correlation IDs**: Every operation tracked end-to-end across systems
- **Service Accounts**: Scoped API keys for system-to-system auth
- **Distributed Locking**: Prevents concurrent job execution
- **Immutable Audit Trail**: All automation runs logged in `automation_runs` table

## Directory Structure

```
/srv/
├── bizdeedz/                    # BizDeedz Platform OS (linked from repo)
├── openclaw/                    # OpenClaw runtime (linked from repo)
└── data/
    ├── inbox/                   # Raw unfiled documents
    │   └── processed/           # Processed files archived by date
    ├── clients/                 # Canonical client/matter folders
    │   └── {client_key}/
    │       └── matters/{matter_key}/
    │           ├── artifacts/   # Filed documents
    │           ├── work_product/# Generated documents
    │           └── exports/     # External submissions
    ├── knowledge_base/          # RAG store (future)
    ├── logs/                    # System logs
    │   ├── openclaw/
    │   ├── bizdeedz/
    │   └── integration/
    └── backups/                 # Backups
        ├── database/
        └── files/
```

## Database Schema Additions

### New Tables

#### 1. `service_accounts`
Service-to-service authentication with scoped permissions.
```sql
- service_id (PK)
- name (unique)
- api_key_hash
- scopes[] (ingestion:write, artifacts:write, tasks:write, events:write, ai_runs:write)
- enabled
- last_used_at
```

**Key Constraint**: Service accounts cannot approve AI runs or close matters.

#### 2. `automation_jobs`
Registry of scheduled automation jobs.
```sql
- job_id (PK)
- name (unique)
- schedule (cron expression)
- enabled
- risk_default
- service_account_id (FK)
- config_json (JSONB)
- last_run_at, next_run_at
```

#### 3. `automation_runs`
Complete audit trail of all automation executions.
```sql
- run_id (PK)
- job_id (FK)
- correlation_id (UUID) -- Links all related operations
- status (running|success|failed|timeout|cancelled)
- started_at, ended_at, duration_ms
- error_message
- inputs_ref, outputs_ref (file paths)
- items_processed, items_created, items_updated, items_failed
- cost_estimate, cost_actual
- service_account_id (FK)
- metadata_json (JSONB)
```

#### 4. `job_locks`
Distributed locking to prevent concurrent execution.
```sql
- lock_key (PK)
- locked_at, locked_by, expires_at
- run_id (FK)
```

**Helper Functions**:
- `acquire_job_lock(lock_key, locked_by, expiry_seconds, run_id) → BOOLEAN`
- `release_job_lock(lock_key, locked_by) → BOOLEAN`
- `cleanup_expired_locks() → INTEGER`

#### 5. `ingestion_items`
Tracks documents awaiting classification and filing.
```sql
- item_id (PK)
- source (inbox|email|api|portal)
- raw_uri (file path or URL)
- original_filename
- checksum_sha256
- mime_type, file_size_bytes
- detected_type, confidence (0-100)
- proposed_matter_id (FK), proposed_artifact_type (FK)
- status (pending|classified|filed|rejected|error)
- filed_artifact_id (FK)
- handled_by (FK user), automation_run_id (FK)
- correlation_id
```

### Enhanced Tables

#### `artifacts` (file-authoritative)
Added columns:
- `file_uri` - Canonical file path or remote URL
- `storage_provider` (local|sharepoint|gdrive|s3)
- `checksum_sha256` - SHA-256 for integrity verification
- `mime_type`
- `version` - Integer version number
- `status` (draft|qc_pending|approved|filed|rejected)
- `qc_gate` - Quality control gate name
- `created_by_type` (user|service|automation|ai)
- `ingestion_item_id` (FK) - Links to originating ingestion item
- `correlation_id` - Traces to automation run

#### `events` (enhanced observability)
Added columns:
- `entity_type` - Type of entity (ingestion_item, artifact, task, etc.)
- `entity_id` - UUID of the entity
- `correlation_id` - Groups related events
- `service_account_id` (FK) - Which service performed action
- `automation_run_id` (FK) - Links to automation run
- `payload` (JSONB) - Structured event data

## API Endpoints

### Integration Endpoints (Service Auth Required)

All endpoints require `X-Service-Key` header for authentication.

#### Ingestion Items
```
POST   /api/integration/ingestion-items
       Scope: ingestion:write
       Body: CreateIngestionItemRequest

PATCH  /api/integration/ingestion-items/:item_id
       Scope: ingestion:write
       Body: UpdateIngestionItemRequest
```

#### Artifacts
```
POST   /api/integration/artifacts
       Scope: artifacts:write
       Body: CreateArtifactExtendedRequest
       Includes file_uri, checksum, storage_provider
```

#### Events
```
POST   /api/integration/events
       Scope: events:write
       Body: CreateEventExtendedRequest
       Includes correlation_id, entity tracking
```

#### Automation Runs
```
POST   /api/integration/automation-runs/start
       Body: StartAutomationRunRequest
       Returns: run_id, correlation_id

POST   /api/integration/automation-runs/:run_id/finish
       Body: FinishAutomationRunRequest
       Updates: status, metrics, cost
```

#### Job Locks
```
POST   /api/integration/locks/acquire
       Body: { lock_key, locked_by, expiry_seconds?, run_id? }
       Returns: { acquired: boolean, lock? }

POST   /api/integration/locks/release
       Body: { lock_key, locked_by }
       Returns: { released: boolean }
```

### Response Format
All integration endpoints return:
```typescript
{
  success: boolean,
  data?: T,
  error?: string,
  correlation_id?: string,
  timestamp: string (ISO 8601)
}
```

## OpenClaw Components

### Directory Structure
```
OpenClaw/
├── src/
│   ├── skills/
│   │   └── bizdeedz-os/        # Integration skill
│   │       ├── client.ts       # API client
│   │       └── index.ts        # Exports
│   ├── jobs/
│   │   └── inbox-scan.ts       # Document ingestion job
│   ├── lib/
│   │   ├── logger.ts           # Winston logging
│   │   ├── retry.ts            # Retry logic with backoff
│   │   └── checksum.ts         # File hashing utilities
│   └── index.ts
├── logs/                       # JSONL logs
├── package.json
├── tsconfig.json
└── .env.example
```

### Environment Variables
```bash
# BizDeedz Platform OS Integration
BIZDEEDZ_OS_BASE_URL=http://localhost:3001/api
BIZDEEDZ_OS_SERVICE_KEY=<generated-key>

# File System Paths
DATA_ROOT=/srv/data
INBOX_PATH=/srv/data/inbox
CLIENTS_PATH=/srv/data/clients

# Job Configuration
INBOX_SCAN_ENABLED=true
INBOX_SCAN_INTERVAL=300000  # 5 minutes
LOCK_EXPIRY_SECONDS=300

# Retry Configuration
API_RETRY_COUNT=3
API_RETRY_BASE_DELAY_MS=1000
API_RETRY_JITTER_MS=200

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## Workflows

### Document Ingestion (inbox-scan)

1. **Acquire Lock**
   ```
   POST /integration/locks/acquire
   {
     "lock_key": "inbox-scan",
     "locked_by": "openclaw-instance-1",
     "expiry_seconds": 300
   }
   ```

2. **Start Automation Run**
   ```
   POST /integration/automation-runs/start
   {
     "job_name": "inbox-scan",
     "correlation_id": "<uuid>",
     "inputs_ref": "/srv/data/inbox"
   }
   ```

3. **Scan Inbox Directory**
   - Find new files (.pdf, .docx, .jpg, .png)
   - Compute SHA-256 checksum
   - Detect mime type
   - Simple classification (filename heuristics)

4. **Create Ingestion Item**
   ```
   POST /integration/ingestion-items
   {
     "source": "inbox",
     "raw_uri": "/srv/data/inbox/document.pdf",
     "original_filename": "document.pdf",
     "checksum_sha256": "<hash>",
     "mime_type": "application/pdf",
     "file_size_bytes": 12345,
     "detected_type": "contract",
     "confidence": 75.0,
     "automation_run_id": "<run_id>",
     "correlation_id": "<correlation_id>"
   }
   ```

5. **Move File to Processed**
   ```
   mv /srv/data/inbox/document.pdf /srv/data/inbox/processed/2026-02-14/document.pdf
   ```

6. **Create Event**
   ```
   POST /integration/events
   {
     "event_type": "ingestion_item.created",
     "event_category": "system",
     "actor_type": "automation",
     "description": "Document ingested from inbox",
     "entity_type": "ingestion_item",
     "entity_id": "<item_id>",
     "correlation_id": "<correlation_id>",
     "automation_run_id": "<run_id>"
   }
   ```

7. **Finish Automation Run**
   ```
   POST /integration/automation-runs/<run_id>/finish
   {
     "status": "success",
     "items_processed": 5,
     "items_created": 5,
     "items_failed": 0,
     "outputs_ref": "/srv/data/inbox/processed/2026-02-14"
   }
   ```

8. **Release Lock**
   ```
   POST /integration/locks/release
   {
     "lock_key": "inbox-scan",
     "locked_by": "openclaw-instance-1"
   }
   ```

## Safety & Observability

### Locking
- Acquires distributed lock before job starts
- Expires after 5 minutes (configurable)
- Prevents duplicate processing
- Stale locks auto-cleaned by `cleanup_expired_locks()`

### Retries
- 3 retries for all API calls
- Exponential backoff: 1s, 2s, 4s
- Jitter: ±200ms to prevent thundering herd

### Correlation IDs
- Generated at job start
- Flows through all operations
- Enables end-to-end tracing
- Logged in all tables (automation_runs, ingestion_items, artifacts, events)

### Logging
- JSONL format in `/srv/data/logs/openclaw/`
- Fields: timestamp, level, correlation_id, job_name, message, metadata
- Structured for log aggregation (ELK, Datadog, etc.)

### Error Handling
- Failed items logged with error_message
- Automation run marked as 'failed' with error details
- Files never deleted - moved to processed folder
- Retryable on next run

## Setup Instructions

### 1. Create Directory Structure
```bash
chmod +x setup-data-directories.sh
./setup-data-directories.sh
```

### 2. Run Database Migration
```bash
cd BizDeedz-Platform-OS/backend
psql -U postgres -d bizdeedz_platform_os -f src/db/openclaw-integration-migration.sql
```

### 3. Create Service Account
```bash
cd BizDeedz-Platform-OS/backend
npm run create-service-account -- \
  --name "OpenClaw Main" \
  --scopes "ingestion:write,artifacts:write,events:write"
```

Save the returned API key - it's only shown once!

### 4. Configure OpenClaw
```bash
cd OpenClaw
cp .env.example .env
# Edit .env with your service key
npm install
```

### 5. Start Systems
```bash
# Terminal 1: BizDeedz Platform OS
cd BizDeedz-Platform-OS/backend
npm run dev

# Terminal 2: OpenClaw
cd OpenClaw
npm run job:inbox-scan
```

### 6. Test Integration
```bash
# Drop a test file
cp test-document.pdf /srv/data/inbox/

# Check logs
tail -f /srv/data/logs/openclaw/inbox-scan.jsonl

# Query ingestion items
psql -d bizdeedz_platform_os -c \
  "SELECT * FROM v_ingestion_items_pending;"
```

## Monitoring

### Database Views

#### v_automation_runs_recent
Last 100 automation runs with service account info.
```sql
SELECT * FROM v_automation_runs_recent
WHERE job_name = 'inbox-scan'
ORDER BY started_at DESC;
```

#### v_ingestion_items_pending
Pending ingestion items with age and proposal details.
```sql
SELECT * FROM v_ingestion_items_pending
WHERE age_hours > 24;  -- Items pending over 24 hours
```

#### v_active_locks
Currently active job locks with expiry details.
```sql
SELECT * FROM v_active_locks;
```

### Key Metrics

**Success Rate**
```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as pct
FROM automation_runs
WHERE job_name = 'inbox-scan'
  AND started_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

**Processing Time**
```sql
SELECT
  AVG(duration_ms) as avg_ms,
  MIN(duration_ms) as min_ms,
  MAX(duration_ms) as max_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_ms
FROM automation_runs
WHERE job_name = 'inbox-scan'
  AND status = 'success'
  AND started_at > NOW() - INTERVAL '7 days';
```

**Ingestion Funnel**
```sql
SELECT
  status,
  COUNT(*) as count
FROM ingestion_items
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status
ORDER BY CASE status
  WHEN 'filed' THEN 1
  WHEN 'classified' THEN 2
  WHEN 'pending' THEN 3
  WHEN 'error' THEN 4
  WHEN 'rejected' THEN 5
END;
```

## Troubleshooting

### Lock is Stuck
```sql
-- View active locks
SELECT * FROM v_active_locks;

-- Manually release if needed
DELETE FROM job_locks WHERE lock_key = 'inbox-scan';
```

### Ingestion Item Stuck in Pending
```sql
-- Find old pending items
SELECT * FROM v_ingestion_items_pending WHERE age_hours > 48;

-- Manually update status
UPDATE ingestion_items
SET status = 'error',
    error_message = 'Manual intervention - timed out'
WHERE item_id = '<uuid>';
```

### Service Account Auth Failing
```sql
-- Check service account status
SELECT * FROM service_accounts WHERE enabled = true;

-- Update last_used_at manually if needed
UPDATE service_accounts
SET last_used_at = CURRENT_TIMESTAMP
WHERE name = 'OpenClaw Main';
```

## Security Considerations

1. **Service Keys**:
   - Generated with 32 bytes of cryptographic randomness
   - Hashed with bcrypt (10 rounds) before storage
   - Never logged or exposed in responses
   - Rotate keys periodically

2. **Scoped Permissions**:
   - Service accounts cannot approve AI runs
   - Service accounts cannot close matters
   - Minimum required scopes per operation

3. **File Integrity**:
   - SHA-256 checksums verified on read
   - Immutable storage (never overwrite)
   - Version tracking for all artifacts

4. **Audit Trail**:
   - All operations logged in events table
   - Correlation IDs link related actions
   - Service account tracked for every API call

## Future Enhancements

- [ ] RAG integration with knowledge_base folder
- [ ] Advanced document classification (ML models)
- [ ] Automated matter proposal (suggest matter_id based on content)
- [ ] Real-time file watching (vs polling)
- [ ] Multi-instance OpenClaw with leader election
- [ ] Cost budgeting per automation job
- [ ] Webhook notifications for ingestion status changes
- [ ] Integration with SharePoint/Google Drive for artifact sync

## Support

For issues or questions:
1. Check logs in `/srv/data/logs/`
2. Query `v_automation_runs_recent` for run history
3. Verify service account scopes match requirements
4. Ensure file paths are deterministic and accessible

---

**Status**: ✅ Platform OS integration complete | 🚧 OpenClaw runtime in progress

**Last Updated**: 2026-02-14
