import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';
import { EventService } from '../services/eventService';

/**
 * Generate a unique work order number
 */
async function generateWorkOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM work_orders WHERE work_order_number LIKE $1`,
    [`WO-${year}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `WO-${year}-${count.toString().padStart(5, '0')}`;
}

/**
 * Create a new work order
 */
export async function createWorkOrder(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const {
      agent_id,
      order_type,
      priority = 'medium',
      matter_id,
      task_id,
      related_entity_type,
      related_entity_id,
      input_data,
      estimated_cost,
    } = req.body;

    if (!agent_id || !order_type || !input_data) {
      return res.status(400).json({ error: 'agent_id, order_type, and input_data are required' });
    }

    await client.query('BEGIN');

    // Check governance rules
    const governanceResult = await client.query(
      `SELECT * FROM governance_rules
       WHERE is_active = true
       AND (applies_to_agent_id = $1 OR applies_to_agent_id IS NULL)
       AND (applies_to_order_type = $2 OR applies_to_order_type IS NULL)
       ORDER BY priority ASC`,
      [agent_id, order_type]
    );

    let initialStatus = 'queued';
    const governanceViolations: any[] = [];

    // Check each governance rule
    for (const rule of governanceResult.rows) {
      if (rule.rule_type === 'approval_gate') {
        initialStatus = 'needs_review';
      }
      // Additional governance checks could be added here
    }

    const work_order_number = await generateWorkOrderNumber();

    const result = await client.query(
      `INSERT INTO work_orders (
        work_order_number, agent_id, order_type, status, priority,
        matter_id, task_id, related_entity_type, related_entity_id,
        input_data, estimated_cost, requested_by, assigned_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        work_order_number,
        agent_id,
        order_type,
        initialStatus,
        priority,
        matter_id || null,
        task_id || null,
        related_entity_type || null,
        related_entity_id || null,
        JSON.stringify(input_data),
        estimated_cost || null,
        req.user?.user_id,
      ]
    );

    const newWorkOrder = result.rows[0];

    // Log event
    if (matter_id) {
      await EventService.logEvent({
        matter_id,
        event_type: 'work_order_created',
        event_category: 'ai_run',
        actor_type: 'user',
        actor_user_id: req.user?.user_id,
        description: `Work order ${work_order_number} created for ${order_type}`,
        metadata_json: { work_order_id: newWorkOrder.work_order_id, agent_id },
        reference_id: newWorkOrder.work_order_id,
        reference_type: 'work_order',
      });
    }

    await client.query('COMMIT');

    res.status(201).json(newWorkOrder);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create work order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

/**
 * Get all work orders with filtering
 */
export async function getWorkOrders(req: AuthRequest, res: Response) {
  try {
    const {
      status,
      agent_id,
      matter_id,
      order_type,
      priority,
      page = 1,
      limit = 50,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT wo.*,
             ad.agent_name,
             u.first_name as requester_first_name,
             u.last_name as requester_last_name
      FROM work_orders wo
      LEFT JOIN agent_directory ad ON wo.agent_id = ad.agent_id
      LEFT JOIN users u ON wo.requested_by = u.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND wo.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (agent_id) {
      query += ` AND wo.agent_id = $${paramIndex}`;
      params.push(agent_id);
      paramIndex++;
    }

    if (matter_id) {
      query += ` AND wo.matter_id = $${paramIndex}`;
      params.push(matter_id);
      paramIndex++;
    }

    if (order_type) {
      query += ` AND wo.order_type = $${paramIndex}`;
      params.push(order_type);
      paramIndex++;
    }

    if (priority) {
      query += ` AND wo.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    query += ` ORDER BY wo.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM work_orders WHERE 1=1';
    const countParams: any[] = [];
    let countIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    if (agent_id) {
      countQuery += ` AND agent_id = $${countIndex}`;
      countParams.push(agent_id);
      countIndex++;
    }

    if (matter_id) {
      countQuery += ` AND matter_id = $${countIndex}`;
      countParams.push(matter_id);
      countIndex++;
    }

    if (order_type) {
      countQuery += ` AND order_type = $${countIndex}`;
      countParams.push(order_type);
      countIndex++;
    }

    if (priority) {
      countQuery += ` AND priority = $${countIndex}`;
      countParams.push(priority);
      countIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      work_orders: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get a single work order by ID
 */
export async function getWorkOrderById(req: AuthRequest, res: Response) {
  try {
    const { work_order_id } = req.params;

    const result = await pool.query(
      `SELECT wo.*,
              ad.agent_name,
              u.first_name as requester_first_name,
              u.last_name as requester_last_name,
              reviewer.first_name as reviewer_first_name,
              reviewer.last_name as reviewer_last_name
       FROM work_orders wo
       LEFT JOIN agent_directory ad ON wo.agent_id = ad.agent_id
       LEFT JOIN users u ON wo.requested_by = u.user_id
       LEFT JOIN users reviewer ON wo.reviewed_by = reviewer.user_id
       WHERE wo.work_order_id = $1`,
      [work_order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    // Get run logs for this work order
    const logsResult = await pool.query(
      `SELECT * FROM agent_run_logs
       WHERE work_order_id = $1
       ORDER BY started_at DESC`,
      [work_order_id]
    );

    res.json({
      ...result.rows[0],
      run_logs: logsResult.rows,
    });
  } catch (error) {
    console.error('Get work order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update work order status
 */
export async function updateWorkOrderStatus(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { work_order_id } = req.params;
    const { status, output_data, error_message, actual_cost, tokens_used, review_notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    await client.query('BEGIN');

    const updates: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [status];
    let paramIndex = 2;

    if (status === 'completed') {
      updates.push(`completed_at = CURRENT_TIMESTAMP`);
    }

    if (status === 'in_progress' && !req.body.started_at) {
      updates.push(`started_at = CURRENT_TIMESTAMP`);
    }

    if (output_data) {
      updates.push(`output_data = $${paramIndex}`);
      values.push(JSON.stringify(output_data));
      paramIndex++;
    }

    if (error_message) {
      updates.push(`error_message = $${paramIndex}`);
      values.push(error_message);
      paramIndex++;
    }

    if (actual_cost !== undefined) {
      updates.push(`actual_cost = $${paramIndex}`);
      values.push(actual_cost);
      paramIndex++;
    }

    if (tokens_used !== undefined) {
      updates.push(`tokens_used = $${paramIndex}`);
      values.push(tokens_used);
      paramIndex++;
    }

    if (status === 'approved' || status === 'rejected') {
      updates.push(`reviewed_by = $${paramIndex}`);
      values.push(req.user?.user_id);
      paramIndex++;

      updates.push(`reviewed_at = CURRENT_TIMESTAMP`);

      if (review_notes) {
        updates.push(`review_notes = $${paramIndex}`);
        values.push(review_notes);
        paramIndex++;
      }
    }

    values.push(work_order_id);

    const query = `
      UPDATE work_orders
      SET ${updates.join(', ')}
      WHERE work_order_id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const workOrder = result.rows[0];

    // Log event if associated with a matter
    if (workOrder.matter_id) {
      await EventService.logEvent({
        matter_id: workOrder.matter_id,
        event_type: 'work_order_status_changed',
        event_category: 'ai_run',
        actor_type: 'user',
        actor_user_id: req.user?.user_id,
        description: `Work order ${workOrder.work_order_number} status changed to ${status}`,
        metadata_json: { work_order_id, old_status: workOrder.status, new_status: status },
        reference_id: work_order_id,
        reference_type: 'work_order',
      });
    }

    await client.query('COMMIT');

    res.json(workOrder);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update work order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

/**
 * Get work order statistics
 */
export async function getWorkOrderStats(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'queued') as queued,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'needs_review') as needs_review,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        AVG(actual_cost) as avg_cost,
        SUM(actual_cost) as total_cost
      FROM work_orders
      WHERE created_at >= CURRENT_DATE
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get work order stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
