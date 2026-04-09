/**
 * BizDeedz Platform OS - API Server
 * Express REST API for legal practice management
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const { calculateMatterHealthScore } = require('./services/matterHealthScore');
const { AutomationEngine, EventLogger } = require('./services/automationEngine');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bizdeedz_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Initialize services
const eventLogger = new EventLogger(db);
const automationEngine = new AutomationEngine(db, eventLogger);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load playbook template from database or file
 */
async function loadPlaybook(playbookId) {
  // Try database first
  const result = await db.query(
    'SELECT template_data FROM playbook_templates WHERE id = $1 AND is_active = true',
    [playbookId]
  );

  if (result.rows.length > 0) {
    return result.rows[0].template_data;
  }

  // Fallback to file (for development)
  const templateFiles = {
    'bk-consumer-v1': '../templates/bankruptcy-consumer.json',
    'fl-divorce-v1': '../templates/family-law-divorce.json',
    'im-petition-v1': '../templates/immigration-petition.json',
    'pe-estate-v1': '../templates/probate-estate-planning.json'
  };

  const templatePath = templateFiles[playbookId];
  if (templatePath) {
    const fullPath = path.join(__dirname, templatePath);
    const templateData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return templateData;
  }

  throw new Error(`Playbook not found: ${playbookId}`);
}

/**
 * Recalculate and update matter health score
 */
async function updateMatterHealthScore(matterId) {
  // Get matter
  const matterResult = await db.query(
    'SELECT * FROM matters WHERE id = $1',
    [matterId]
  );
  const matter = matterResult.rows[0];

  if (!matter) {
    throw new Error('Matter not found');
  }

  // Get tasks
  const tasksResult = await db.query(
    'SELECT * FROM tasks WHERE matter_id = $1',
    [matterId]
  );

  // Get artifacts with type codes
  const artifactsResult = await db.query(
    `SELECT a.*, at.code as artifact_type_code
     FROM artifacts a
     JOIN artifact_types at ON a.artifact_type_id = at.id
     WHERE a.matter_id = $1`,
    [matterId]
  );

  // Load playbook
  const playbook = matter.playbook_template_id
    ? await loadPlaybook(matter.playbook_template_id)
    : null;

  // Calculate score
  const healthData = calculateMatterHealthScore(
    matter,
    tasksResult.rows,
    artifactsResult.rows,
    playbook
  );

  // Update matter
  await db.query(
    `UPDATE matters
     SET health_score = $1,
         health_risk_tier = $2,
         health_drivers = $3
     WHERE id = $4`,
    [
      healthData.score,
      healthData.riskTier,
      JSON.stringify(healthData.drivers),
      matterId
    ]
  );

  return healthData;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// MATTERS ENDPOINTS
// ============================================================================

/**
 * Get all matters with filters
 */
app.get('/api/matters', async (req, res) => {
  try {
    const {
      status,
      lane,
      assigned_to,
      risk_tier,
      practice_area_id,
      matter_type_id,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT m.*,
             pa.name as practice_area_name,
             mt.name as matter_type_name
      FROM matters m
      LEFT JOIN practice_areas pa ON m.practice_area_id = pa.id
      LEFT JOIN matter_types mt ON m.matter_type_id = mt.id
      WHERE m.is_archived = false
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND m.current_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (lane) {
      query += ` AND m.current_lane = $${paramIndex}`;
      params.push(lane);
      paramIndex++;
    }

    if (assigned_to) {
      query += ` AND m.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    if (risk_tier) {
      query += ` AND m.health_risk_tier = $${paramIndex}`;
      params.push(risk_tier);
      paramIndex++;
    }

    if (practice_area_id) {
      query += ` AND m.practice_area_id = $${paramIndex}`;
      params.push(practice_area_id);
      paramIndex++;
    }

    if (matter_type_id) {
      query += ` AND m.matter_type_id = $${paramIndex}`;
      params.push(matter_type_id);
      paramIndex++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      matters: result.rows,
      total: result.rowCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching matters:', error);
    res.status(500).json({ error: 'Failed to fetch matters' });
  }
});

/**
 * Get single matter by ID
 */
app.get('/api/matters/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT m.*,
              pa.name as practice_area_name,
              mt.name as matter_type_name
       FROM matters m
       LEFT JOIN practice_areas pa ON m.practice_area_id = pa.id
       LEFT JOIN matter_types mt ON m.matter_type_id = mt.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matter not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching matter:', error);
    res.status(500).json({ error: 'Failed to fetch matter' });
  }
});

/**
 * Create new matter
 */
app.post('/api/matters', async (req, res) => {
  try {
    const {
      practice_area_id,
      matter_type_id,
      client_name,
      client_email,
      client_phone,
      opposing_party,
      assigned_to,
      assigned_role,
      metadata
    } = req.body;

    // Validate required fields
    if (!practice_area_id || !matter_type_id || !client_name) {
      return res.status(400).json({
        error: 'Missing required fields: practice_area_id, matter_type_id, client_name'
      });
    }

    // Get playbook template
    const templateResult = await db.query(
      `SELECT id, template_data
       FROM playbook_templates
       WHERE practice_area_id = $1
         AND matter_type_id = $2
         AND is_active = true
         AND is_published = true
       ORDER BY version DESC
       LIMIT 1`,
      [practice_area_id, matter_type_id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(400).json({
        error: 'No active playbook template found for this practice area and matter type'
      });
    }

    const playbook = templateResult.rows[0].template_data;
    const playbookId = templateResult.rows[0].id;
    const initialStatus = playbook.statuses.find(s => s.is_initial);

    // Create matter
    const matterId = uuidv4();
    await db.query(
      `INSERT INTO matters (
        id, practice_area_id, matter_type_id, playbook_template_id,
        client_name, client_email, client_phone, opposing_party,
        current_status, current_lane, assigned_to, assigned_role, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        matterId,
        practice_area_id,
        matter_type_id,
        playbookId,
        client_name,
        client_email,
        client_phone,
        opposing_party,
        initialStatus.id,
        initialStatus.lane,
        assigned_to,
        assigned_role,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    // Get created matter
    const matterResult = await db.query(
      'SELECT * FROM matters WHERE id = $1',
      [matterId]
    );
    const matter = matterResult.rows[0];

    // Run automations
    await automationEngine.onMatterCreated(matter, playbook);

    // Calculate initial health score
    await updateMatterHealthScore(matterId);

    // Get updated matter
    const updatedMatterResult = await db.query(
      `SELECT m.*,
              pa.name as practice_area_name,
              mt.name as matter_type_name
       FROM matters m
       LEFT JOIN practice_areas pa ON m.practice_area_id = pa.id
       LEFT JOIN matter_types mt ON m.matter_type_id = mt.id
       WHERE m.id = $1`,
      [matterId]
    );

    res.status(201).json(updatedMatterResult.rows[0]);
  } catch (error) {
    console.error('Error creating matter:', error);
    res.status(500).json({ error: 'Failed to create matter' });
  }
});

/**
 * Update matter status
 */
app.patch('/api/matters/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_status, defect_reason_id, defect_notes, user_id } = req.body;

    if (!new_status) {
      return res.status(400).json({ error: 'new_status is required' });
    }

    // Get current matter
    const matterResult = await db.query(
      'SELECT * FROM matters WHERE id = $1',
      [id]
    );

    if (matterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Matter not found' });
    }

    const matter = matterResult.rows[0];
    const oldStatus = matter.current_status;

    // Load playbook
    const playbook = await loadPlaybook(matter.playbook_template_id);

    // Validate status transition
    const currentStatusDef = playbook.statuses.find(s => s.id === oldStatus);
    const newStatusDef = playbook.statuses.find(s => s.id === new_status);

    if (!newStatusDef) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (!currentStatusDef.allowed_transitions.includes(new_status)) {
      return res.status(400).json({
        error: `Status transition not allowed: ${oldStatus} -> ${new_status}`
      });
    }

    // Check if defect reason required
    if (newStatusDef.requires_defect_reason && !defect_reason_id) {
      return res.status(400).json({
        error: 'This status requires a defect_reason_id'
      });
    }

    // Update matter status
    await db.query(
      `UPDATE matters
       SET current_status = $1,
           current_lane = $2,
           status_changed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [new_status, newStatusDef.lane, id]
    );

    // If defect reason provided, log it
    if (defect_reason_id) {
      await eventLogger.logEvent({
        matter_id: id,
        event_type: 'defect_logged',
        event_category: 'workflow',
        title: 'Defect reason logged',
        description: defect_notes,
        metadata: { defect_reason_id },
        actor_id: user_id || 'system'
      });
    }

    // Run automations
    await automationEngine.onStatusChanged(
      { ...matter, current_status: new_status, current_lane: newStatusDef.lane },
      oldStatus,
      new_status,
      playbook,
      user_id || 'system'
    );

    // Update health score
    await updateMatterHealthScore(id);

    // Get updated matter
    const updatedResult = await db.query(
      `SELECT m.*,
              pa.name as practice_area_name,
              mt.name as matter_type_name
       FROM matters m
       LEFT JOIN practice_areas pa ON m.practice_area_id = pa.id
       LEFT JOIN matter_types mt ON m.matter_type_id = mt.id
       WHERE m.id = $1`,
      [id]
    );

    res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Error updating matter status:', error);
    res.status(500).json({ error: 'Failed to update matter status' });
  }
});

/**
 * Get matter timeline (events)
 */
app.get('/api/matters/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM events
       WHERE matter_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// ============================================================================
// TASKS ENDPOINTS
// ============================================================================

/**
 * Get tasks for a matter
 */
app.get('/api/matters/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    let query = 'SELECT * FROM tasks WHERE matter_id = $1';
    const params = [id];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY priority DESC, due_date ASC';

    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * Create task
 */
app.post('/api/matters/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      assigned_to,
      assigned_role,
      due_date
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const taskId = uuidv4();
    const result = await db.query(
      `INSERT INTO tasks (
        id, matter_id, title, description, priority,
        assigned_to, assigned_role, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        taskId,
        id,
        title,
        description,
        priority || 'medium',
        assigned_to,
        assigned_role,
        due_date
      ]
    );

    await eventLogger.logEvent({
      matter_id: id,
      event_type: 'task_created',
      event_category: 'workflow',
      title: `Task created: ${title}`,
      related_task_id: taskId,
      actor_id: req.body.user_id || 'system'
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * Update task status
 */
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, user_id } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const completedAt = status === 'completed' ? new Date() : null;

    await db.query(
      `UPDATE tasks
       SET status = $1, completed_at = $2
       WHERE id = $3`,
      [status, completedAt, id]
    );

    const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (result.rows.length > 0) {
      await eventLogger.logEvent({
        matter_id: result.rows[0].matter_id,
        event_type: 'task_updated',
        event_category: 'workflow',
        title: `Task ${status}: ${result.rows[0].title}`,
        related_task_id: id,
        actor_id: user_id || 'system'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Continue with more endpoints...
// (Artifacts, AI Runs, Analytics endpoints will be in next file)

// ============================================================================
// Start server
// ============================================================================

app.listen(PORT, () => {
  console.log(`BizDeedz Platform OS API listening on port ${PORT}`);
});

module.exports = app;
