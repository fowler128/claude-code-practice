import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';

/**
 * Get all available playbooks
 */
export async function getPlaybooks(req: AuthRequest, res: Response) {
  try {
    const { practice_area_id, matter_type_id, is_active = 'true' } = req.query;

    let query = `
      SELECT p.*, pa.name as practice_area_name, mt.name as matter_type_name
      FROM playbook_templates p
      LEFT JOIN practice_areas pa ON p.practice_area_id = pa.practice_area_id
      LEFT JOIN matter_types mt ON p.matter_type_id = mt.matter_type_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (is_active === 'true') {
      query += ` AND p.is_active = true`;
    }

    if (practice_area_id) {
      query += ` AND p.practice_area_id = $${paramIndex}`;
      params.push(practice_area_id);
      paramIndex++;
    }

    if (matter_type_id) {
      query += ` AND p.matter_type_id = $${paramIndex}`;
      params.push(matter_type_id);
      paramIndex++;
    }

    query += ` ORDER BY p.practice_area_id, p.matter_type_id`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get playbooks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get a specific playbook by ID
 */
export async function getPlaybookById(req: AuthRequest, res: Response) {
  try {
    const { playbook_id } = req.params;

    const result = await pool.query(
      `SELECT p.*, pa.name as practice_area_name, mt.name as matter_type_name
       FROM playbook_templates p
       LEFT JOIN practice_areas pa ON p.practice_area_id = pa.practice_area_id
       LEFT JOIN matter_types mt ON p.matter_type_id = mt.matter_type_id
       WHERE p.playbook_id = $1`,
      [playbook_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    const playbook = result.rows[0];

    // Get SLA rules for this playbook
    const slaResult = await pool.query(
      'SELECT * FROM sla_rules WHERE playbook_id = $1 AND is_active = true ORDER BY status_code',
      [playbook_id]
    );

    // Get automation rules for this playbook
    const automationResult = await pool.query(
      'SELECT * FROM automation_rules WHERE playbook_id = $1 AND is_active = true ORDER BY rule_name',
      [playbook_id]
    );

    res.json({
      ...playbook,
      sla_rules: slaResult.rows,
      automation_rules: automationResult.rows,
    });
  } catch (error) {
    console.error('Get playbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get playbook for a specific matter type
 */
export async function getPlaybookForMatterType(req: AuthRequest, res: Response) {
  try {
    const { matter_type_id } = req.params;

    const result = await pool.query(
      `SELECT p.*, pa.name as practice_area_name, mt.name as matter_type_name
       FROM playbook_templates p
       LEFT JOIN practice_areas pa ON p.practice_area_id = pa.practice_area_id
       LEFT JOIN matter_types mt ON p.matter_type_id = mt.matter_type_id
       WHERE p.matter_type_id = $1 AND p.is_active = true
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [matter_type_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No playbook found for this matter type' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get playbook for matter type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get lanes from a playbook
 */
export async function getPlaybookLanes(req: AuthRequest, res: Response) {
  try {
    const { playbook_id } = req.params;

    const result = await pool.query(
      'SELECT template_json FROM playbook_templates WHERE playbook_id = $1',
      [playbook_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    const template = result.rows[0].template_json;
    res.json(template.lanes || []);
  } catch (error) {
    console.error('Get playbook lanes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get statuses from a playbook
 */
export async function getPlaybookStatuses(req: AuthRequest, res: Response) {
  try {
    const { playbook_id } = req.params;

    const result = await pool.query(
      'SELECT template_json FROM playbook_templates WHERE playbook_id = $1',
      [playbook_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    const template = result.rows[0].template_json;
    res.json(template.statuses || []);
  } catch (error) {
    console.error('Get playbook statuses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
