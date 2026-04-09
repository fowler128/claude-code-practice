import { Response } from 'express';
import pool from '../db/pool';
import { ServiceAuthRequest } from '../middleware/serviceAuth';
import {
  CreateIngestionItemRequest,
  UpdateIngestionItemRequest,
  CreateArtifactExtendedRequest,
  CreateEventExtendedRequest,
  StartAutomationRunRequest,
  FinishAutomationRunRequest,
  AcquireLockRequest,
  ReleaseLockRequest,
  IntegrationApiResponse,
} from '../../../shared/types';

/**
 * Standard response wrapper for integration endpoints
 */
function successResponse<T>(
  data: T,
  correlationId?: string
): IntegrationApiResponse<T> {
  return {
    success: true,
    data,
    correlation_id: correlationId,
    timestamp: new Date().toISOString(),
  };
}

function errorResponse(
  error: string,
  correlationId?: string
): IntegrationApiResponse {
  return {
    success: false,
    error,
    correlation_id: correlationId,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// INGESTION ITEMS
// ============================================================================

export async function createIngestionItem(
  req: ServiceAuthRequest,
  res: Response
) {
  const client = await pool.connect();
  try {
    const data: CreateIngestionItemRequest = req.body;
    const correlationId = req.correlationId;

    const result = await client.query(
      `INSERT INTO ingestion_items (
        source, raw_uri, original_filename, checksum_sha256, mime_type,
        file_size_bytes, detected_type, confidence, proposed_matter_id,
        proposed_artifact_type, automation_run_id, correlation_id, metadata_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.source,
        data.raw_uri,
        data.original_filename,
        data.checksum_sha256,
        data.mime_type,
        data.file_size_bytes,
        data.detected_type,
        data.confidence,
        data.proposed_matter_id,
        data.proposed_artifact_type,
        data.automation_run_id,
        correlationId,
        data.metadata_json,
      ]
    );

    const item = result.rows[0];

    // Create event
    await client.query(
      `INSERT INTO events (
        event_type, event_category, actor_type, description,
        entity_type, entity_id, correlation_id, service_account_id,
        automation_run_id, payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'ingestion_item.created',
        'system',
        'automation',
        `Ingestion item created: ${data.original_filename || data.raw_uri}`,
        'ingestion_item',
        item.item_id,
        correlationId,
        req.serviceAccount?.service_id,
        data.automation_run_id,
        JSON.stringify({ source: data.source, detected_type: data.detected_type }),
      ]
    );

    res.status(201).json(successResponse(item, correlationId));
  } catch (error: any) {
    console.error('Error creating ingestion item:', error);
    res.status(500).json(errorResponse(error.message, req.correlationId));
  } finally {
    client.release();
  }
}

export async function updateIngestionItem(
  req: ServiceAuthRequest,
  res: Response
) {
  try {
    const { item_id } = req.params;
    const data: UpdateIngestionItemRequest = req.body;
    const correlationId = req.correlationId;

    const setClauses: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (data.status) {
      setClauses.push(`status = $${valueIndex++}`);
      values.push(data.status);
    }
    if (data.proposed_matter_id !== undefined) {
      setClauses.push(`proposed_matter_id = $${valueIndex++}`);
      values.push(data.proposed_matter_id);
    }
    if (data.proposed_artifact_type !== undefined) {
      setClauses.push(`proposed_artifact_type = $${valueIndex++}`);
      values.push(data.proposed_artifact_type);
    }
    if (data.filed_artifact_id !== undefined) {
      setClauses.push(`filed_artifact_id = $${valueIndex++}`);
      values.push(data.filed_artifact_id);
    }
    if (data.handled_by !== undefined) {
      setClauses.push(`handled_by = $${valueIndex++}`);
      values.push(data.handled_by);
    }
    if (data.error_message !== undefined) {
      setClauses.push(`error_message = $${valueIndex++}`);
      values.push(data.error_message);
    }
    if (data.metadata_json !== undefined) {
      setClauses.push(`metadata_json = $${valueIndex++}`);
      values.push(data.metadata_json);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(item_id);

    const result = await pool.query(
      `UPDATE ingestion_items
       SET ${setClauses.join(', ')}
       WHERE item_id = $${valueIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Ingestion item not found', correlationId));
    }

    res.json(successResponse(result.rows[0], correlationId));
  } catch (error: any) {
    console.error('Error updating ingestion item:', error);
    res.status(500).json(errorResponse(error.message, req.correlationId));
  }
}

// ============================================================================
// ARTIFACTS
// ============================================================================

export async function createArtifactExtended(
  req: ServiceAuthRequest,
  res: Response
) {
  const client = await pool.connect();
  try {
    const data: CreateArtifactExtendedRequest = req.body;
    const correlationId = req.correlationId;

    const result = await client.query(
      `INSERT INTO artifacts (
        matter_id, artifact_type_id, name, description, required,
        source, file_uri, storage_provider, checksum_sha256, mime_type,
        status, created_by_type, ingestion_item_id, correlation_id,
        storage_pointer, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        data.matter_id,
        data.artifact_type_id,
        data.name,
        data.description,
        data.required || false,
        data.source || 'internal',
        data.file_uri,
        data.storage_provider || 'local',
        data.checksum_sha256,
        data.mime_type,
        data.status || 'draft',
        data.created_by_type || 'automation',
        data.ingestion_item_id,
        correlationId,
        data.storage_pointer,
        null, // uploaded_by is null for service accounts
      ]
    );

    const artifact = result.rows[0];

    // Create event
    await client.query(
      `INSERT INTO events (
        matter_id, event_type, event_category, actor_type, description,
        entity_type, entity_id, correlation_id, service_account_id, payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.matter_id,
        'artifact.created',
        'artifact',
        'automation',
        `Artifact created via automation: ${data.name}`,
        'artifact',
        artifact.artifact_id,
        correlationId,
        req.serviceAccount?.service_id,
        JSON.stringify({ artifact_type_id: data.artifact_type_id }),
      ]
    );

    res.status(201).json(successResponse(artifact, correlationId));
  } catch (error: any) {
    console.error('Error creating artifact:', error);
    res.status(500).json(errorResponse(error.message, req.correlationId));
  } finally {
    client.release();
  }
}

// ============================================================================
// EVENTS
// ============================================================================

export async function createEventExtended(
  req: ServiceAuthRequest,
  res: Response
) {
  try {
    const data: CreateEventExtendedRequest = req.body;
    const correlationId = req.correlationId;

    const result = await pool.query(
      `INSERT INTO events (
        matter_id, event_type, event_category, actor_type, description,
        entity_type, entity_id, correlation_id, service_account_id,
        automation_run_id, payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.matter_id,
        data.event_type,
        data.event_category,
        data.actor_type,
        data.description,
        data.entity_type,
        data.entity_id,
        correlationId,
        req.serviceAccount?.service_id,
        data.automation_run_id,
        data.payload,
      ]
    );

    res.status(201).json(successResponse(result.rows[0], correlationId));
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json(errorResponse(error.message, req.correlationId));
  }
}

// ============================================================================
// AUTOMATION RUNS
// ============================================================================

export async function startAutomationRun(
  req: ServiceAuthRequest,
  res: Response
) {
  try {
    const data: StartAutomationRunRequest = req.body;
    const correlationId = data.correlation_id || req.correlationId;

    const result = await pool.query(
      `INSERT INTO automation_runs (
        job_id, job_name, correlation_id, status, inputs_ref,
        service_account_id, metadata_json
      ) VALUES ($1, $2, $3, 'running', $4, $5, $6)
      RETURNING *`,
      [
        data.job_id,
        data.job_name,
        correlationId,
        data.inputs_ref,
        req.serviceAccount?.service_id,
        data.metadata_json,
      ]
    );

    const run = result.rows[0];

    res.status(201).json(successResponse(run, correlationId));
  } catch (error: any) {
    console.error('Error starting automation run:', error);
    res.status(500).json(errorResponse(error.message, req.correlationId));
  }
}

export async function finishAutomationRun(
  req: ServiceAuthRequest,
  res: Response
) {
  try {
    const { run_id } = req.params;
    const data: FinishAutomationRunRequest = req.body;
    const correlationId = req.correlationId;

    const result = await pool.query(
      `UPDATE automation_runs
       SET status = $1,
           ended_at = CURRENT_TIMESTAMP,
           duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) * 1000,
           error_message = $2,
           outputs_ref = $3,
           items_processed = COALESCE($4, items_processed),
           items_created = COALESCE($5, items_created),
           items_updated = COALESCE($6, items_updated),
           items_failed = COALESCE($7, items_failed),
           cost_actual = COALESCE($8, cost_actual)
       WHERE run_id = $9
       RETURNING *`,
      [
        data.status,
        data.error_message,
        data.outputs_ref,
        data.items_processed,
        data.items_created,
        data.items_updated,
        data.items_failed,
        data.cost_actual,
        run_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Automation run not found', correlationId));
    }

    const run = result.rows[0];

    // Update job's last_run_at
    if (run.job_id) {
      await pool.query(
        `UPDATE automation_jobs
         SET last_run_at = CURRENT_TIMESTAMP
         WHERE job_id = $1`,
        [run.job_id]
      );
    }

    res.json(successResponse(run, correlationId));
  } catch (error: any) {
    console.error('Error finishing automation run:', error);
    res.status(500).json(errorResponse(error.message, req.correlationId));
  }
}

// ============================================================================
// JOB LOCKS
// ============================================================================

export async function acquireLock(req: ServiceAuthRequest, res: Response) {
  try {
    const data: AcquireLockRequest = req.body;
    const correlationId = req.correlationId;

    const result = await pool.query(
      `SELECT acquire_job_lock($1, $2, $3, $4) as acquired`,
      [
        data.lock_key,
        data.locked_by,
        data.expiry_seconds || 300,
        data.run_id,
      ]
    );

    const acquired = result.rows[0].acquired;

    if (acquired) {
      const lock = await pool.query(
        `SELECT * FROM job_locks WHERE lock_key = $1`,
        [data.lock_key]
      );

      res.json(successResponse({ acquired: true, lock: lock.rows[0] }, correlationId));
    } else {
      res.status(409).json(
        successResponse({ acquired: false, lock: null }, correlationId)
      );
    }
  } catch (error: any) {
    console.error('Error acquiring lock:', error);
    res.status(500).json(errorResponse(error.message, req.correlationId));
  }
}

export async function releaseLock(req: ServiceAuthRequest, res: Response) {
  try {
    const data: ReleaseLockRequest = req.body;
    const correlationId = req.correlationId;

    const result = await pool.query(
      `SELECT release_job_lock($1, $2) as released`,
      [data.lock_key, data.locked_by]
    );

    const released = result.rows[0].released;

    res.json(successResponse({ released }, correlationId));
  } catch (error: any) {
    console.error('Error releasing lock:', error);
    res.status(500).json(errorResponse(error.message, req.correlationId));
  }
}
