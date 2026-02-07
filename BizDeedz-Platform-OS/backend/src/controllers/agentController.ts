import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';

/**
 * Get all agents from the agent directory
 */
export async function getAgents(req: AuthRequest, res: Response) {
  try {
    const { agent_type, risk_level, is_active = 'true' } = req.query;

    let query = 'SELECT * FROM agent_directory WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (is_active === 'true') {
      query += ' AND is_active = true';
    }

    if (agent_type) {
      query += ` AND agent_type = $${paramIndex}`;
      params.push(agent_type);
      paramIndex++;
    }

    if (risk_level) {
      query += ` AND risk_level = $${paramIndex}`;
      params.push(risk_level);
      paramIndex++;
    }

    query += ' ORDER BY agent_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get a specific agent by ID
 */
export async function getAgentById(req: AuthRequest, res: Response) {
  try {
    const { agent_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM agent_directory WHERE agent_id = $1',
      [agent_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get sub-agents for this agent
    const subAgentsResult = await pool.query(
      'SELECT * FROM sub_agent_directory WHERE parent_agent_id = $1 AND is_active = true ORDER BY sub_agent_name',
      [agent_id]
    );

    res.json({
      ...result.rows[0],
      sub_agents: subAgentsResult.rows,
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all sub-agents
 */
export async function getSubAgents(req: AuthRequest, res: Response) {
  try {
    const { parent_agent_id, specialization } = req.query;

    let query = 'SELECT * FROM sub_agent_directory WHERE is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (parent_agent_id) {
      query += ` AND parent_agent_id = $${paramIndex}`;
      params.push(parent_agent_id);
      paramIndex++;
    }

    if (specialization) {
      query += ` AND specialization = $${paramIndex}`;
      params.push(specialization);
      paramIndex++;
    }

    query += ' ORDER BY parent_agent_id, sub_agent_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get sub-agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get prompt packs
 */
export async function getPromptPacks(req: AuthRequest, res: Response) {
  try {
    const { category, is_active = 'true' } = req.query;

    let query = 'SELECT * FROM prompt_packs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (is_active === 'true') {
      query += ' AND is_active = true';
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ' ORDER BY category, pack_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get prompt packs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get a specific prompt pack
 */
export async function getPromptPackById(req: AuthRequest, res: Response) {
  try {
    const { prompt_pack_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM prompt_packs WHERE prompt_pack_id = $1',
      [prompt_pack_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt pack not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get prompt pack error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get governance rules
 */
export async function getGovernanceRules(req: AuthRequest, res: Response) {
  try {
    const { rule_type, applies_to_agent_id, is_active = 'true' } = req.query;

    let query = 'SELECT * FROM governance_rules WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (is_active === 'true') {
      query += ' AND is_active = true';
    }

    if (rule_type) {
      query += ` AND rule_type = $${paramIndex}`;
      params.push(rule_type);
      paramIndex++;
    }

    if (applies_to_agent_id) {
      query += ` AND (applies_to_agent_id = $${paramIndex} OR applies_to_agent_id IS NULL)`;
      params.push(applies_to_agent_id);
      paramIndex++;
    }

    query += ' ORDER BY priority ASC, rule_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get governance rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
