import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';
import { EventService } from '../services/eventService';
import { CreateMatterRequest, Matter } from '../../../shared/types';

/**
 * Generate a unique matter number
 */
async function generateMatterNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM matters WHERE matter_number LIKE $1`,
    [`${year}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `${year}-${count.toString().padStart(4, '0')}`;
}

/**
 * Create a new matter
 */
export async function createMatter(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const data: CreateMatterRequest = req.body;

    if (!data.client_name || !data.practice_area_id || !data.matter_type_id) {
      return res.status(400).json({ error: 'client_name, practice_area_id, and matter_type_id are required' });
    }

    await client.query('BEGIN');

    // Generate matter number
    const matter_number = await generateMatterNumber();

    // Fetch playbook if provided
    let initialStatus = 'new_lead';
    let initialLane = 'intake';
    let playbook_version = null;

    if (data.playbook_id) {
      const playbookResult = await client.query(
        `SELECT version, template_json FROM playbook_templates
         WHERE playbook_id = $1 AND is_active = true
         ORDER BY created_at DESC LIMIT 1`,
        [data.playbook_id]
      );

      if (playbookResult.rows.length > 0) {
        playbook_version = playbookResult.rows[0].version;
        const template = playbookResult.rows[0].template_json;

        // Get first status from playbook
        if (template.statuses && template.statuses.length > 0) {
          const firstStatus = template.statuses.sort((a: any, b: any) => a.order - b.order)[0];
          initialStatus = firstStatus.status_code;
          initialLane = firstStatus.lane_id;
        }
      }
    }

    // Insert matter
    const matterResult = await client.query(
      `INSERT INTO matters (
        matter_number, client_name, client_entity, practice_area_id, matter_type_id,
        status, lane, priority, owner_user_id, billing_type, metadata_json,
        playbook_id, playbook_version, defect_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0)
      RETURNING *`,
      [
        matter_number,
        data.client_name,
        data.client_entity || null,
        data.practice_area_id,
        data.matter_type_id,
        initialStatus,
        initialLane,
        data.priority || 'medium',
        data.owner_user_id || req.user?.user_id || null,
        data.billing_type || null,
        data.metadata_json ? JSON.stringify(data.metadata_json) : null,
        data.playbook_id || null,
        playbook_version,
      ]
    );

    const newMatter = matterResult.rows[0];

    // Log event
    await EventService.logEvent({
      matter_id: newMatter.matter_id,
      event_type: 'matter_created',
      event_category: 'matter',
      actor_type: 'user',
      actor_user_id: req.user?.user_id,
      description: `Matter ${matter_number} created for ${data.client_name}`,
      metadata_json: { matter_id: newMatter.matter_id },
      reference_id: newMatter.matter_id,
      reference_type: 'matter',
    });

    // TODO: Sprint 2 - Generate starter tasks based on playbook

    await client.query('COMMIT');

    res.status(201).json(newMatter);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create matter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

/**
 * Get all matters with filtering and pagination
 */
export async function getMatters(req: AuthRequest, res: Response) {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      lane,
      practice_area_id,
      owner_user_id,
      priority,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT m.*,
             pa.name as practice_area_name,
             mt.name as matter_type_name,
             u.first_name as owner_first_name,
             u.last_name as owner_last_name
      FROM matters m
      LEFT JOIN practice_areas pa ON m.practice_area_id = pa.practice_area_id
      LEFT JOIN matter_types mt ON m.matter_type_id = mt.matter_type_id
      LEFT JOIN users u ON m.owner_user_id = u.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND m.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (lane) {
      query += ` AND m.lane = $${paramIndex}`;
      params.push(lane);
      paramIndex++;
    }

    if (practice_area_id) {
      query += ` AND m.practice_area_id = $${paramIndex}`;
      params.push(practice_area_id);
      paramIndex++;
    }

    if (owner_user_id) {
      query += ` AND m.owner_user_id = $${paramIndex}`;
      params.push(owner_user_id);
      paramIndex++;
    }

    if (priority) {
      query += ` AND m.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM matters WHERE 1=1';
    const countParams: any[] = [];
    let countIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    if (lane) {
      countQuery += ` AND lane = $${countIndex}`;
      countParams.push(lane);
      countIndex++;
    }

    if (practice_area_id) {
      countQuery += ` AND practice_area_id = $${countIndex}`;
      countParams.push(practice_area_id);
      countIndex++;
    }

    if (owner_user_id) {
      countQuery += ` AND owner_user_id = $${countIndex}`;
      countParams.push(owner_user_id);
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
      matters: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get matters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get a single matter by ID
 */
export async function getMatterById(req: AuthRequest, res: Response) {
  try {
    const { matter_id } = req.params;

    const result = await pool.query(
      `SELECT m.*,
              pa.name as practice_area_name,
              mt.name as matter_type_name,
              u.first_name as owner_first_name,
              u.last_name as owner_last_name
       FROM matters m
       LEFT JOIN practice_areas pa ON m.practice_area_id = pa.practice_area_id
       LEFT JOIN matter_types mt ON m.matter_type_id = mt.matter_type_id
       LEFT JOIN users u ON m.owner_user_id = u.user_id
       WHERE m.matter_id = $1`,
      [matter_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matter not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get matter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update a matter
 */
export async function updateMatter(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { matter_id } = req.params;
    const updates = req.body;

    // Get current matter
    const currentResult = await client.query(
      'SELECT * FROM matters WHERE matter_id = $1',
      [matter_id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Matter not found' });
    }

    const currentMatter = currentResult.rows[0];

    await client.query('BEGIN');

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'client_name', 'client_entity', 'status', 'lane', 'priority',
      'owner_user_id', 'assigned_roles', 'target_dates', 'closed_at',
      'matter_health_score', 'risk_tier', 'last_defect_reason',
      'defect_count', 'billing_type', 'metadata_json'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(['metadata_json', 'target_dates', 'assigned_roles'].includes(key)
          ? JSON.stringify(value)
          : value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(matter_id);

    const updateQuery = `
      UPDATE matters
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE matter_id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    const updatedMatter = result.rows[0];

    // Log status change if status changed
    if (updates.status && updates.status !== currentMatter.status) {
      await EventService.logEvent({
        matter_id,
        event_type: 'status_changed',
        event_category: 'status_change',
        actor_type: 'user',
        actor_user_id: req.user?.user_id,
        description: `Status changed from ${currentMatter.status} to ${updates.status}`,
        metadata_json: {
          old_status: currentMatter.status,
          new_status: updates.status,
          old_lane: currentMatter.lane,
          new_lane: updates.lane || currentMatter.lane,
        },
        reference_id: matter_id,
        reference_type: 'matter',
      });
    }

    // Log general update event
    await EventService.logEvent({
      matter_id,
      event_type: 'matter_updated',
      event_category: 'matter',
      actor_type: 'user',
      actor_user_id: req.user?.user_id,
      description: `Matter updated: ${Object.keys(updates).join(', ')}`,
      metadata_json: { updated_fields: Object.keys(updates) },
      reference_id: matter_id,
      reference_type: 'matter',
    });

    await client.query('COMMIT');

    res.json(updatedMatter);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update matter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

/**
 * Delete a matter (soft delete by closing)
 */
export async function deleteMatter(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { matter_id } = req.params;

    await client.query('BEGIN');

    // Update matter to closed status
    const result = await client.query(
      `UPDATE matters
       SET closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE matter_id = $1
       RETURNING *`,
      [matter_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matter not found' });
    }

    // Log event
    await EventService.logEvent({
      matter_id,
      event_type: 'matter_closed',
      event_category: 'matter',
      actor_type: 'user',
      actor_user_id: req.user?.user_id,
      description: `Matter closed`,
      reference_id: matter_id,
      reference_type: 'matter',
    });

    await client.query('COMMIT');

    res.json({ message: 'Matter closed successfully', matter: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete matter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}
