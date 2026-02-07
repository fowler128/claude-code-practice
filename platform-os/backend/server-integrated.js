/**
 * BizDeedz Platform OS - Integrated Server
 * MVP+ with all features wired together
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Services
const { AutomationEngine, EventLogger } = require('./services/automationEngine');
const { AgentOrchestrator } = require('./services/agentOrchestrator');
const { ReportsService } = require('./services/reportsService');
const { TemplateLoader } = require('./services/templateLoader');
const { MatterLifecycle } = require('./services/matterLifecycle');

// Routes
const agentRoutes = require('./routes/agentRoutes');
const smartQueueRoutes = require('./routes/smartQueueRoutes');
const openClawRoutes = require('./routes/openClawRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bizdeedz_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Initialize services
const eventLogger = new EventLogger(db);
const automationEngine = new AutomationEngine(db, eventLogger);
const agentOrchestrator = new AgentOrchestrator(db, eventLogger);
const reportsService = new ReportsService(db);
const templateLoader = new TemplateLoader(db);
const matterLifecycle = new MatterLifecycle(db, automationEngine, eventLogger, templateLoader);

// Database health check
db.on('error', (err) => {
  console.error('[DB] Unexpected error:', err);
});

// ============================================================================
// HEALTH & STATUS
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// ============================================================================
// REPORTS ENDPOINTS
// ============================================================================

app.get('/api/reports/queue', async (req, res) => {
  try {
    const report = await reportsService.getQueueReport();
    res.json(report);
  } catch (error) {
    console.error('[API] Queue report error:', error);
    res.status(500).json({ error: 'Failed to generate queue report' });
  }
});

app.get('/api/reports/cycle-time', async (req, res) => {
  try {
    const report = await reportsService.getCycleTimeReport();
    res.json(report);
  } catch (error) {
    console.error('[API] Cycle time report error:', error);
    res.status(500).json({ error: 'Failed to generate cycle time report' });
  }
});

app.get('/api/reports/defects', async (req, res) => {
  try {
    const report = await reportsService.getDefectsReport();
    res.json(report);
  } catch (error) {
    console.error('[API] Defects report error:', error);
    res.status(500).json({ error: 'Failed to generate defects report' });
  }
});

app.get('/api/reports/leads', async (req, res) => {
  try {
    const report = await reportsService.getLeadsReport();
    res.json(report);
  } catch (error) {
    console.error('[API] Leads report error:', error);
    res.status(500).json({ error: 'Failed to generate leads report' });
  }
});

app.get('/api/reports/all', async (req, res) => {
  try {
    const report = await reportsService.getAllReports();
    res.json(report);
  } catch (error) {
    console.error('[API] All reports error:', error);
    res.status(500).json({ error: 'Failed to generate all reports' });
  }
});

app.get('/api/reports/performance', async (req, res) => {
  try {
    const performance = await reportsService.checkPerformance();
    res.json(performance);
  } catch (error) {
    console.error('[API] Performance check error:', error);
    res.status(500).json({ error: 'Failed to check performance' });
  }
});

// ============================================================================
// MATTER ENDPOINTS (with lifecycle hooks)
// ============================================================================

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

    if (!practice_area_id || !matter_type_id || !client_name) {
      return res.status(400).json({
        error: 'Missing required fields: practice_area_id, matter_type_id, client_name'
      });
    }

    // Create matter
    const result = await db.query(
      `INSERT INTO matters (
        practice_area_id, matter_type_id, client_name, client_email,
        client_phone, opposing_party, assigned_to, assigned_role,
        current_status, current_lane, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', 'intake', $9)
      RETURNING *`,
      [
        practice_area_id,
        matter_type_id,
        client_name,
        client_email,
        client_phone,
        opposing_party,
        assigned_to,
        assigned_role,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    const matter = result.rows[0];

    // Run lifecycle hooks
    await matterLifecycle.onMatterCreated(matter, req.body.user_id || 'system');

    // Fetch updated matter
    const updatedResult = await db.query(
      `SELECT m.*, pa.name as practice_area_name, mt.name as matter_type_name
       FROM matters m
       LEFT JOIN practice_areas pa ON m.practice_area_id = pa.id
       LEFT JOIN matter_types mt ON m.matter_type_id = mt.id
       WHERE m.id = $1`,
      [matter.id]
    );

    res.status(201).json(updatedResult.rows[0]);
  } catch (error) {
    console.error('[API] Create matter error:', error);
    res.status(500).json({ error: 'Failed to create matter' });
  }
});

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

    const oldStatus = matterResult.rows[0].current_status;

    // Run lifecycle hooks
    await matterLifecycle.onStatusChanged(
      id,
      oldStatus,
      new_status,
      user_id || 'system',
      { defect_reason_id, defect_notes }
    );

    // Fetch updated matter
    const updatedResult = await db.query(
      `SELECT m.*, pa.name as practice_area_name, mt.name as matter_type_name
       FROM matters m
       LEFT JOIN practice_areas pa ON m.practice_area_id = pa.id
       LEFT JOIN matter_types mt ON m.matter_type_id = mt.id
       WHERE m.id = $1`,
      [id]
    );

    res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('[API] Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

app.post('/api/templates/load', async (req, res) => {
  try {
    const result = await templateLoader.loadAllTemplates();
    res.json(result);
  } catch (error) {
    console.error('[API] Template load error:', error);
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

app.get('/api/templates/:templateId', async (req, res) => {
  try {
    const template = await templateLoader.getTemplate(req.params.templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('[API] Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// ============================================================================
// SLA SWEEPER ENDPOINT
// ============================================================================

app.post('/api/sla/sweep', async (req, res) => {
  try {
    const result = await matterLifecycle.checkAllSLAs();
    res.json(result);
  } catch (error) {
    console.error('[API] SLA sweep error:', error);
    res.status(500).json({ error: 'Failed to run SLA sweep' });
  }
});

// ============================================================================
// MOUNT MODULAR ROUTES
// ============================================================================

app.use('/api', agentRoutes(db, agentOrchestrator));
app.use('/api/smart-queue', smartQueueRoutes(db));
app.use('/api/openclaw', openClawRoutes(db, agentOrchestrator));

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// STARTUP
// ============================================================================

async function startup() {
  try {
    // Test database connection
    await db.query('SELECT 1');
    console.log('[Server] Database connected');

    // Load templates on startup
    console.log('[Server] Loading playbook templates...');
    const templateResult = await templateLoader.loadAllTemplates();
    console.log(`[Server] ${templateResult.summary}`);

    // Start server
    app.listen(PORT, () => {
      console.log(`[Server] BizDeedz Platform OS listening on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/health`);
      console.log(`[Server] Reports: http://localhost:${PORT}/api/reports/all`);
    });
  } catch (error) {
    console.error('[Server] Startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  await db.end();
  process.exit(0);
});

startup();

module.exports = { app, db, services: { matterLifecycle, reportsService, templateLoader } };
