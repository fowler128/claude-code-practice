/**
 * Agent Layer API Routes
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

module.exports = (db, agentOrchestrator) => {
  // ============================================================================
  // WORK ORDERS
  // ============================================================================

  /**
   * Get all work orders with filters
   */
  router.get('/work-orders', async (req, res) => {
    try {
      const {
        status,
        agent_id,
        assigned_to_user,
        work_type,
        priority,
        limit = 50,
        offset = 0
      } = req.query;

      let query = `
        SELECT wo.*,
               a.agent_name,
               a.agent_type
        FROM work_orders wo
        LEFT JOIN agent_directory a ON wo.agent_id = a.id
        WHERE 1=1
      `;
      const params = [];
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

      if (assigned_to_user) {
        query += ` AND wo.assigned_to_user = $${paramIndex}`;
        params.push(assigned_to_user);
        paramIndex++;
      }

      if (work_type) {
        query += ` AND wo.work_type = $${paramIndex}`;
        params.push(work_type);
        paramIndex++;
      }

      if (priority) {
        query += ` AND wo.priority = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }

      query += ` ORDER BY
        CASE wo.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        wo.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      res.json({
        work_orders: result.rows,
        total: result.rowCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error fetching work orders:', error);
      res.status(500).json({ error: 'Failed to fetch work orders' });
    }
  });

  /**
   * Get single work order
   */
  router.get('/work-orders/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT wo.*,
                a.agent_name,
                a.agent_type,
                a.capabilities
         FROM work_orders wo
         LEFT JOIN agent_directory a ON wo.agent_id = a.id
         WHERE wo.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Work order not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching work order:', error);
      res.status(500).json({ error: 'Failed to fetch work order' });
    }
  });

  /**
   * Create new work order
   */
  router.post('/work-orders', async (req, res) => {
    try {
      const {
        agent_id,
        assigned_to_user,
        title,
        description,
        work_type,
        priority,
        related_entity_type,
        related_entity_id,
        input_data,
        due_date,
        automation_candidate
      } = req.body;

      if (!title || !work_type) {
        return res.status(400).json({
          error: 'Missing required fields: title, work_type'
        });
      }

      const workOrderId = uuidv4();

      await db.query(
        `INSERT INTO work_orders (
          id, agent_id, assigned_to_user, title, description, work_type, priority,
          related_entity_type, related_entity_id, input_data, due_date, automation_candidate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          workOrderId,
          agent_id || null,
          assigned_to_user || null,
          title,
          description,
          work_type,
          priority || 'medium',
          related_entity_type,
          related_entity_id,
          input_data ? JSON.stringify(input_data) : null,
          due_date,
          automation_candidate || false
        ]
      );

      const result = await db.query(
        `SELECT wo.*,
                a.agent_name,
                a.agent_type
         FROM work_orders wo
         LEFT JOIN agent_directory a ON wo.agent_id = a.id
         WHERE wo.id = $1`,
        [workOrderId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating work order:', error);
      res.status(500).json({ error: 'Failed to create work order' });
    }
  });

  /**
   * Execute work order with agent
   */
  router.post('/work-orders/:id/execute', async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      // Get work order
      const workOrderResult = await db.query(
        'SELECT * FROM work_orders WHERE id = $1',
        [id]
      );

      if (workOrderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Work order not found' });
      }

      const workOrder = workOrderResult.rows[0];

      if (!workOrder.agent_id) {
        return res.status(400).json({ error: 'No agent assigned to work order' });
      }

      // Update status
      await db.query(
        `UPDATE work_orders
         SET status = 'agent_processing', started_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      // Execute agent
      const result = await agentOrchestrator.executeAgent(
        workOrder.agent_id,
        id,
        workOrder.input_data || {},
        user_id || 'system'
      );

      res.json(result);
    } catch (error) {
      console.error('Error executing work order:', error);
      res.status(500).json({ error: 'Failed to execute work order', message: error.message });
    }
  });

  /**
   * Approve work order
   */
  router.post('/work-orders/:id/approve', async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;

      if (!approved_by) {
        return res.status(400).json({ error: 'approved_by is required' });
      }

      const result = await agentOrchestrator.approveAgentRun(id, approved_by);

      res.json(result);
    } catch (error) {
      console.error('Error approving work order:', error);
      res.status(500).json({ error: 'Failed to approve work order' });
    }
  });

  /**
   * Reject work order
   */
  router.post('/work-orders/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const { rejected_by, reason } = req.body;

      if (!rejected_by || !reason) {
        return res.status(400).json({ error: 'rejected_by and reason are required' });
      }

      const result = await agentOrchestrator.rejectAgentRun(id, rejected_by, reason);

      res.json(result);
    } catch (error) {
      console.error('Error rejecting work order:', error);
      res.status(500).json({ error: 'Failed to reject work order' });
    }
  });

  // ============================================================================
  // AGENT DIRECTORY
  // ============================================================================

  /**
   * Get all agents
   */
  router.get('/agents', async (req, res) => {
    try {
      const { agent_type, is_active = 'true' } = req.query;

      let query = 'SELECT * FROM agent_directory WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (agent_type) {
        query += ` AND agent_type = $${paramIndex}`;
        params.push(agent_type);
        paramIndex++;
      }

      if (is_active !== 'all') {
        query += ` AND is_active = $${paramIndex}`;
        params.push(is_active === 'true');
        paramIndex++;
      }

      query += ' ORDER BY agent_name ASC';

      const result = await db.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  /**
   * Get single agent with sub-agents
   */
  router.get('/agents/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const agentResult = await db.query(
        'SELECT * FROM agent_directory WHERE id = $1',
        [id]
      );

      if (agentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const agent = agentResult.rows[0];

      // Get sub-agents
      const subAgentsResult = await db.query(
        'SELECT * FROM sub_agent_directory WHERE parent_agent_id = $1 ORDER BY execution_order',
        [id]
      );

      agent.sub_agents = subAgentsResult.rows;

      res.json(agent);
    } catch (error) {
      console.error('Error fetching agent:', error);
      res.status(500).json({ error: 'Failed to fetch agent' });
    }
  });

  // ============================================================================
  // AGENT RUN LOGS
  // ============================================================================

  /**
   * Get agent run logs
   */
  router.get('/agent-run-logs', async (req, res) => {
    try {
      const {
        work_order_id,
        agent_id,
        execution_status,
        user_id,
        limit = 100,
        offset = 0
      } = req.query;

      let query = `
        SELECT arl.*,
               a.agent_name,
               sa.sub_agent_name,
               wo.work_order_number,
               wo.title as work_order_title
        FROM agent_run_logs arl
        LEFT JOIN agent_directory a ON arl.agent_id = a.id
        LEFT JOIN sub_agent_directory sa ON arl.sub_agent_id = sa.id
        LEFT JOIN work_orders wo ON arl.work_order_id = wo.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (work_order_id) {
        query += ` AND arl.work_order_id = $${paramIndex}`;
        params.push(work_order_id);
        paramIndex++;
      }

      if (agent_id) {
        query += ` AND arl.agent_id = $${paramIndex}`;
        params.push(agent_id);
        paramIndex++;
      }

      if (execution_status) {
        query += ` AND arl.execution_status = $${paramIndex}`;
        params.push(execution_status);
        paramIndex++;
      }

      if (user_id) {
        query += ` AND arl.user_id = $${paramIndex}`;
        params.push(user_id);
        paramIndex++;
      }

      query += ` ORDER BY arl.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      res.json({
        logs: result.rows,
        total: result.rowCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error fetching agent run logs:', error);
      res.status(500).json({ error: 'Failed to fetch agent run logs' });
    }
  });

  // ============================================================================
  // LEADS
  // ============================================================================

  /**
   * Get all leads
   */
  router.get('/leads', async (req, res) => {
    try {
      const { status, assigned_to, limit = 50, offset = 0 } = req.query;

      let query = 'SELECT * FROM leads WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (assigned_to) {
        query += ` AND assigned_to = $${paramIndex}`;
        params.push(assigned_to);
        paramIndex++;
      }

      query += ` ORDER BY lead_score DESC NULLS LAST, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      res.json({
        leads: result.rows,
        total: result.rowCount
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  /**
   * Get single lead
   */
  router.get('/leads/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query('SELECT * FROM leads WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ error: 'Failed to fetch lead' });
    }
  });

  /**
   * Create lead
   */
  router.post('/leads', async (req, res) => {
    try {
      const {
        company_name,
        contact_name,
        contact_email,
        contact_phone,
        source,
        industry,
        company_size,
        budget_range,
        timeline,
        pain_points,
        assigned_to
      } = req.body;

      if (!contact_name) {
        return res.status(400).json({ error: 'contact_name is required' });
      }

      const leadId = uuidv4();

      await db.query(
        `INSERT INTO leads (
          id, company_name, contact_name, contact_email, contact_phone,
          source, industry, company_size, budget_range, timeline,
          pain_points, assigned_to
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          leadId,
          company_name,
          contact_name,
          contact_email,
          contact_phone,
          source,
          industry,
          company_size,
          budget_range,
          timeline,
          pain_points || [],
          assigned_to
        ]
      );

      const result = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ error: 'Failed to create lead' });
    }
  });

  // ============================================================================
  // CONTENT CALENDAR
  // ============================================================================

  /**
   * Get content calendar
   */
  router.get('/content', async (req, res) => {
    try {
      const { publication_status, content_type, limit = 50, offset = 0 } = req.query;

      let query = 'SELECT * FROM content_calendar WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (publication_status) {
        query += ` AND publication_status = $${paramIndex}`;
        params.push(publication_status);
        paramIndex++;
      }

      if (content_type) {
        query += ` AND content_type = $${paramIndex}`;
        params.push(content_type);
        paramIndex++;
      }

      query += ` ORDER BY scheduled_date DESC NULLS LAST, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      res.json({
        content: result.rows,
        total: result.rowCount
      });
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // ============================================================================
  // SOP LIBRARY
  // ============================================================================

  /**
   * Get SOPs
   */
  router.get('/sops', async (req, res) => {
    try {
      const { category, automation_candidate, is_active = 'true' } = req.query;

      let query = 'SELECT * FROM sop_library WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (automation_candidate !== undefined) {
        query += ` AND automation_candidate = $${paramIndex}`;
        params.push(automation_candidate === 'true');
        paramIndex++;
      }

      if (is_active !== 'all') {
        query += ` AND is_active = $${paramIndex}`;
        params.push(is_active === 'true');
        paramIndex++;
      }

      query += ' ORDER BY automation_score DESC NULLS LAST, title ASC';

      const result = await db.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching SOPs:', error);
      res.status(500).json({ error: 'Failed to fetch SOPs' });
    }
  });

  // ============================================================================
  // GOVERNANCE
  // ============================================================================

  /**
   * Get governance rules
   */
  router.get('/governance/rules', async (req, res) => {
    try {
      const { rule_type, is_active = 'true' } = req.query;

      let query = 'SELECT * FROM governance_rules WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (rule_type) {
        query += ` AND rule_type = $${paramIndex}`;
        params.push(rule_type);
        paramIndex++;
      }

      if (is_active !== 'all') {
        query += ` AND is_active = $${paramIndex}`;
        params.push(is_active === 'true');
        paramIndex++;
      }

      query += ' ORDER BY priority DESC, rule_name ASC';

      const result = await db.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching governance rules:', error);
      res.status(500).json({ error: 'Failed to fetch governance rules' });
    }
  });

  return router;
};
