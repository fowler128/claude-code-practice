// Agents repository - Database layer for agent operations
import { Pool } from 'pg';
import {
  AgentRow,
  AgentVersionRow,
  AgentRunRow,
  AgentEscalationRow,
  AgentListItem,
} from './agents.types';

export class AgentsRepository {
  constructor(private pool: Pool) {}

  // ─────────────────────────────────────────────────────────────────────
  // Agents
  // ─────────────────────────────────────────────────────────────────────

  async getAgentByName(name: string): Promise<AgentRow | null> {
    const result = await this.pool.query<AgentRow>(
      'SELECT * FROM agents WHERE name = $1 LIMIT 1',
      [name]
    );
    return result.rows[0] || null;
  }

  async getAgentById(id: string): Promise<AgentRow | null> {
    const result = await this.pool.query<AgentRow>(
      'SELECT * FROM agents WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0] || null;
  }

  async listAgents(): Promise<AgentListItem[]> {
    const result = await this.pool.query<AgentListItem>(`
      SELECT
        a.id,
        a.name,
        a.purpose,
        a.risk_level,
        a.is_active,
        MAX(av.version) AS latest_version,
        (SELECT status FROM agent_runs WHERE agent_id = a.id ORDER BY started_at DESC LIMIT 1) AS last_run_status,
        (SELECT started_at FROM agent_runs WHERE agent_id = a.id ORDER BY started_at DESC LIMIT 1) AS last_run_started_at
      FROM agents a
      LEFT JOIN agent_versions av ON av.agent_id = a.id
      GROUP BY a.id
      ORDER BY a.name
    `);
    return result.rows;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Agent Versions
  // ─────────────────────────────────────────────────────────────────────

  async getLatestVersion(agentId: string): Promise<AgentVersionRow | null> {
    const result = await this.pool.query<AgentVersionRow>(
      `SELECT * FROM agent_versions
       WHERE agent_id = $1
       ORDER BY version DESC
       LIMIT 1`,
      [agentId]
    );
    return result.rows[0] || null;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Agent Runs
  // ─────────────────────────────────────────────────────────────────────

  async createRun(
    agentId: string,
    tenantId: string | null,
    status: string
  ): Promise<AgentRunRow> {
    const result = await this.pool.query<AgentRunRow>(
      `INSERT INTO agent_runs (agent_id, tenant_id, status, started_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [agentId, tenantId, status]
    );
    return result.rows[0];
  }

  async updateRun(
    runId: string,
    updates: {
      status?: string;
      ended_at?: Date;
      cost?: string;
      latency_ms?: number;
      error?: string;
    }
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.ended_at !== undefined) {
      fields.push(`ended_at = $${paramCount++}`);
      values.push(updates.ended_at);
    }
    if (updates.cost !== undefined) {
      fields.push(`cost = $${paramCount++}`);
      values.push(updates.cost);
    }
    if (updates.latency_ms !== undefined) {
      fields.push(`latency_ms = $${paramCount++}`);
      values.push(updates.latency_ms);
    }
    if (updates.error !== undefined) {
      fields.push(`error = $${paramCount++}`);
      values.push(updates.error);
    }

    if (fields.length === 0) return;

    values.push(runId);
    await this.pool.query(
      `UPDATE agent_runs SET ${fields.join(', ')} WHERE id = $${paramCount}`,
      values
    );
  }

  async getRunById(runId: string): Promise<AgentRunRow | null> {
    const result = await this.pool.query<AgentRunRow>(
      'SELECT * FROM agent_runs WHERE id = $1 LIMIT 1',
      [runId]
    );
    return result.rows[0] || null;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Agent Run Input/Output
  // ─────────────────────────────────────────────────────────────────────

  async saveRunInput(runId: string, input: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `INSERT INTO agent_run_inputs (run_id, input_json)
       VALUES ($1, $2)`,
      [runId, JSON.stringify(input)]
    );
  }

  async saveRunOutput(runId: string, output: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `INSERT INTO agent_run_outputs (run_id, output_json)
       VALUES ($1, $2)`,
      [runId, JSON.stringify(output)]
    );
  }

  async getRunOutput(runId: string): Promise<Record<string, unknown> | null> {
    const result = await this.pool.query<{ output_json: any }>(
      'SELECT output_json FROM agent_run_outputs WHERE run_id = $1 LIMIT 1',
      [runId]
    );
    return result.rows[0]?.output_json || null;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Escalations
  // ─────────────────────────────────────────────────────────────────────

  async createEscalation(
    runId: string,
    severity: string,
    reason: string,
    assignedTo: string | null,
    dueAt: Date | null
  ): Promise<AgentEscalationRow> {
    const result = await this.pool.query<AgentEscalationRow>(
      `INSERT INTO agent_escalations (run_id, severity, reason, assigned_to, due_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [runId, severity, reason, assignedTo, dueAt]
    );
    return result.rows[0];
  }

  async listEscalationsByRunId(runId: string): Promise<AgentEscalationRow[]> {
    const result = await this.pool.query<AgentEscalationRow>(
      'SELECT * FROM agent_escalations WHERE run_id = $1 ORDER BY created_at DESC',
      [runId]
    );
    return result.rows;
  }

  async listPendingEscalations(): Promise<AgentEscalationRow[]> {
    const result = await this.pool.query<AgentEscalationRow>(
      'SELECT * FROM agent_escalations WHERE resolved_at IS NULL ORDER BY due_at ASC NULLS LAST'
    );
    return result.rows;
  }
}
