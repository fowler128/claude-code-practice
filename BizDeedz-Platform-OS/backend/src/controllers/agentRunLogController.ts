import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';

/**
 * Create an agent run log entry
 */
export async function createRunLog(req: AuthRequest, res: Response) {
  try {
    const {
      work_order_id,
      agent_id,
      sub_agent_id,
      run_type = 'on_demand',
      trigger_event,
      input_snapshot,
      requires_human_review = false,
    } = req.body;

    if (!agent_id) {
      return res.status(400).json({ error: 'agent_id is required' });
    }

    const result = await pool.query(
      `INSERT INTO agent_run_logs (
        work_order_id, agent_id, sub_agent_id, run_type, trigger_event,
        status, input_snapshot, requires_human_review, started_at
      ) VALUES ($1, $2, $3, $4, $5, 'started', $6, $7, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        work_order_id || null,
        agent_id,
        sub_agent_id || null,
        run_type,
        trigger_event || null,
        input_snapshot ? JSON.stringify(input_snapshot) : null,
        requires_human_review,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create run log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Complete an agent run log
 */
export async function completeRunLog(req: AuthRequest, res: Response) {
  try {
    const { run_log_id } = req.params;
    const {
      status = 'completed',
      output_snapshot,
      error_details,
      tokens_prompt,
      tokens_completion,
      cost_usd,
      model_used,
    } = req.body;

    const duration_ms = req.body.duration_ms;
    const tokens_total = (tokens_prompt || 0) + (tokens_completion || 0);

    const result = await pool.query(
      `UPDATE agent_run_logs
       SET status = $1,
           completed_at = CURRENT_TIMESTAMP,
           duration_ms = $2,
           output_snapshot = $3,
           error_details = $4,
           tokens_prompt = $5,
           tokens_completion = $6,
           tokens_total = $7,
           cost_usd = $8,
           model_used = $9
       WHERE run_log_id = $10
       RETURNING *`,
      [
        status,
        duration_ms,
        output_snapshot ? JSON.stringify(output_snapshot) : null,
        error_details ? JSON.stringify(error_details) : null,
        tokens_prompt,
        tokens_completion,
        tokens_total,
        cost_usd,
        model_used,
        run_log_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Run log not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Complete run log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get agent run logs with filtering
 */
export async function getRunLogs(req: AuthRequest, res: Response) {
  try {
    const {
      agent_id,
      work_order_id,
      status,
      requires_human_review,
      review_status,
      page = 1,
      limit = 50,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT rl.*,
             ad.agent_name,
             sad.sub_agent_name,
             u.first_name as reviewer_first_name,
             u.last_name as reviewer_last_name
      FROM agent_run_logs rl
      LEFT JOIN agent_directory ad ON rl.agent_id = ad.agent_id
      LEFT JOIN sub_agent_directory sad ON rl.sub_agent_id = sad.sub_agent_id
      LEFT JOIN users u ON rl.reviewed_by = u.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (agent_id) {
      query += ` AND rl.agent_id = $${paramIndex}`;
      params.push(agent_id);
      paramIndex++;
    }

    if (work_order_id) {
      query += ` AND rl.work_order_id = $${paramIndex}`;
      params.push(work_order_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND rl.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (requires_human_review !== undefined) {
      query += ` AND rl.requires_human_review = $${paramIndex}`;
      params.push(requires_human_review === 'true');
      paramIndex++;
    }

    if (review_status) {
      query += ` AND rl.review_status = $${paramIndex}`;
      params.push(review_status);
      paramIndex++;
    }

    query += ` ORDER BY rl.started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM agent_run_logs WHERE 1=1';
    const countParams: any[] = [];
    let countIndex = 1;

    if (agent_id) {
      countQuery += ` AND agent_id = $${countIndex}`;
      countParams.push(agent_id);
      countIndex++;
    }

    if (work_order_id) {
      countQuery += ` AND work_order_id = $${countIndex}`;
      countParams.push(work_order_id);
      countIndex++;
    }

    if (status) {
      countQuery += ` AND status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    if (requires_human_review !== undefined) {
      countQuery += ` AND requires_human_review = $${countIndex}`;
      countParams.push(requires_human_review === 'true');
      countIndex++;
    }

    if (review_status) {
      countQuery += ` AND review_status = $${countIndex}`;
      countParams.push(review_status);
      countIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      run_logs: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get run logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Review an agent run
 */
export async function reviewRunLog(req: AuthRequest, res: Response) {
  try {
    const { run_log_id } = req.params;
    const { review_status, review_notes } = req.body;

    if (!review_status || !['approved', 'rejected', 'modified'].includes(review_status)) {
      return res.status(400).json({ error: 'Valid review_status is required (approved, rejected, modified)' });
    }

    const result = await pool.query(
      `UPDATE agent_run_logs
       SET reviewed_by = $1,
           review_status = $2,
           review_timestamp = CURRENT_TIMESTAMP,
           review_notes = $3
       WHERE run_log_id = $4
       RETURNING *`,
      [req.user?.user_id, review_status, review_notes || null, run_log_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Run log not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Review run log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get agent run statistics
 */
export async function getRunStats(req: AuthRequest, res: Response) {
  try {
    const { agent_id, timeframe = 'day' } = req.query;

    let timeCondition = "started_at >= CURRENT_DATE";
    if (timeframe === 'week') {
      timeCondition = "started_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (timeframe === 'month') {
      timeCondition = "started_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    let whereClause = `WHERE ${timeCondition}`;
    const params: any[] = [];

    if (agent_id) {
      whereClause += ' AND agent_id = $1';
      params.push(agent_id);
    }

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_runs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE requires_human_review = true) as requires_review,
        COUNT(*) FILTER (WHERE review_status = 'approved') as approved,
        COUNT(*) FILTER (WHERE review_status = 'rejected') as rejected,
        AVG(duration_ms) as avg_duration_ms,
        SUM(tokens_total) as total_tokens,
        SUM(cost_usd) as total_cost_usd
      FROM agent_run_logs
      ${whereClause}`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get run stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get cost analytics
 */
export async function getCostAnalytics(req: AuthRequest, res: Response) {
  try {
    const { timeframe = 'day' } = req.query;

    let timeCondition = "started_at >= CURRENT_DATE";
    if (timeframe === 'week') {
      timeCondition = "started_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (timeframe === 'month') {
      timeCondition = "started_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    // Cost by agent
    const byAgentResult = await pool.query(
      `SELECT
        rl.agent_id,
        ad.agent_name,
        COUNT(*) as run_count,
        SUM(rl.cost_usd) as total_cost,
        AVG(rl.cost_usd) as avg_cost,
        SUM(rl.tokens_total) as total_tokens
      FROM agent_run_logs rl
      LEFT JOIN agent_directory ad ON rl.agent_id = ad.agent_id
      WHERE ${timeCondition}
      GROUP BY rl.agent_id, ad.agent_name
      ORDER BY total_cost DESC`
    );

    // Cost by day (last 7 days)
    const byDayResult = await pool.query(
      `SELECT
        DATE(started_at) as date,
        COUNT(*) as run_count,
        SUM(cost_usd) as total_cost,
        SUM(tokens_total) as total_tokens
      FROM agent_run_logs
      WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(started_at)
      ORDER BY date DESC`
    );

    res.json({
      by_agent: byAgentResult.rows,
      by_day: byDayResult.rows,
    });
  } catch (error) {
    console.error('Get cost analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
