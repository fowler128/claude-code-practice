import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as matterController from '../controllers/matterController';
import * as taskController from '../controllers/taskController';
import * as playbookController from '../controllers/playbookController';
import * as agentController from '../controllers/agentController';
import * as workOrderController from '../controllers/workOrderController';
import * as agentRunLogController from '../controllers/agentRunLogController';
import * as costEstimatorController from '../controllers/costEstimatorController';
import * as missionControlController from '../controllers/missionControlController';
import * as integrationController from '../controllers/integrationController';
import * as contentOpsController from '../controllers/contentOpsController';
import { serviceAuthMiddleware, requireScope } from '../middleware/serviceAuth';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/me', authMiddleware, authController.getCurrentUser);

// Matter routes (protected)
router.post('/matters', authMiddleware, matterController.createMatter);
router.get('/matters', authMiddleware, matterController.getMatters);
router.get('/matters/:matter_id', authMiddleware, matterController.getMatterById);
router.put('/matters/:matter_id', authMiddleware, matterController.updateMatter);
router.delete('/matters/:matter_id', authMiddleware, requireRole('admin', 'attorney'), matterController.deleteMatter);

// Task routes (protected)
router.post('/tasks', authMiddleware, taskController.createTask);
router.get('/tasks/my', authMiddleware, taskController.getMyTasks);
router.get('/matters/:matter_id/tasks', authMiddleware, taskController.getTasksByMatter);
router.put('/tasks/:task_id', authMiddleware, taskController.updateTask);
router.delete('/tasks/:task_id', authMiddleware, taskController.deleteTask);

// Practice areas and matter types (for dropdowns)
router.get('/practice-areas', authMiddleware, async (req, res) => {
  try {
    const { pool } = await import('../db/connection');
    const result = await pool.query(
      'SELECT * FROM practice_areas WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get practice areas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/matter-types', authMiddleware, async (req, res) => {
  try {
    const { pool } = await import('../db/connection');
    const { practice_area_id } = req.query;

    let query = 'SELECT * FROM matter_types WHERE is_active = true';
    const params: any[] = [];

    if (practice_area_id) {
      query += ' AND practice_area_id = $1';
      params.push(practice_area_id);
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get matter types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Artifact types
router.get('/artifact-types', authMiddleware, async (req, res) => {
  try {
    const { pool } = await import('../db/connection');
    const result = await pool.query(
      'SELECT * FROM artifact_types WHERE is_active = true ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get artifact types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Defect reasons
router.get('/defect-reasons', authMiddleware, async (req, res) => {
  try {
    const { pool } = await import('../db/connection');
    const result = await pool.query(
      'SELECT * FROM defect_reasons WHERE is_active = true ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get defect reasons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Events
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const { EventService } = await import('../services/eventService');
    const { matter_id, limit = 50 } = req.query;

    let events;
    if (matter_id) {
      events = await EventService.getEventsForMatter(matter_id as string, Number(limit));
    } else {
      events = await EventService.getRecentEvents(Number(limit));
    }

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Playbook routes (protected)
router.get('/playbooks', authMiddleware, playbookController.getPlaybooks);
router.get('/playbooks/:playbook_id', authMiddleware, playbookController.getPlaybookById);
router.get('/playbooks/:playbook_id/lanes', authMiddleware, playbookController.getPlaybookLanes);
router.get('/playbooks/:playbook_id/statuses', authMiddleware, playbookController.getPlaybookStatuses);
router.get('/matter-types/:matter_type_id/playbook', authMiddleware, playbookController.getPlaybookForMatterType);

// Agent Layer routes (protected)
// Agent Directory
router.get('/agents', authMiddleware, agentController.getAgents);
router.get('/agents/:agent_id', authMiddleware, agentController.getAgentById);
router.get('/sub-agents', authMiddleware, agentController.getSubAgents);

// Prompt Packs
router.get('/prompt-packs', authMiddleware, agentController.getPromptPacks);
router.get('/prompt-packs/:prompt_pack_id', authMiddleware, agentController.getPromptPackById);

// Governance Rules
router.get('/governance-rules', authMiddleware, agentController.getGovernanceRules);

// Work Orders
router.post('/work-orders', authMiddleware, workOrderController.createWorkOrder);
router.get('/work-orders', authMiddleware, workOrderController.getWorkOrders);
router.get('/work-orders/stats', authMiddleware, workOrderController.getWorkOrderStats);
router.get('/work-orders/:work_order_id', authMiddleware, workOrderController.getWorkOrderById);
router.put('/work-orders/:work_order_id/status', authMiddleware, workOrderController.updateWorkOrderStatus);

// Cost Estimator & Budget Gates
router.post('/work-orders/:work_order_id/estimate', authMiddleware, costEstimatorController.createEstimate);
router.post('/work-orders/:work_order_id/execute', authMiddleware, costEstimatorController.executeWorkOrder);
router.get('/work-orders/:work_order_id/estimates', authMiddleware, costEstimatorController.getEstimates);
router.get('/work-orders/:work_order_id/executions', authMiddleware, costEstimatorController.getExecutions);
router.get('/daily-budget', authMiddleware, costEstimatorController.getDailyBudgetStatus);

// Agent Run Logs
router.post('/agent-run-logs', authMiddleware, agentRunLogController.createRunLog);
router.get('/agent-run-logs', authMiddleware, agentRunLogController.getRunLogs);
router.get('/agent-run-logs/stats', authMiddleware, agentRunLogController.getRunStats);
router.get('/agent-run-logs/cost-analytics', authMiddleware, agentRunLogController.getCostAnalytics);
router.put('/agent-run-logs/:run_log_id/complete', authMiddleware, agentRunLogController.completeRunLog);
router.put('/agent-run-logs/:run_log_id/review', authMiddleware, requireRole('attorney', 'admin', 'ops_lead'), agentRunLogController.reviewRunLog);

// Mission Control endpoints
router.post('/work-orders/:work_order_id/preflight', authMiddleware, missionControlController.runPreflight);
router.post('/work-orders/:work_order_id/execute', authMiddleware, missionControlController.executeWorkOrder);
router.post('/work-orders/:work_order_id/approve', authMiddleware, requireRole('attorney', 'admin'), missionControlController.approveWorkOrder);
router.get('/mission-control/dashboard', authMiddleware, missionControlController.getDashboard);
router.get('/mission-control/analytics', authMiddleware, missionControlController.getAnalytics);
router.get('/mission-control/cron-jobs', authMiddleware, missionControlController.getCronJobs);

// ============================================================================
// Content Ops Autopilot endpoints
// RBAC: ops_lead and admin can manage everything, others read-only
// ============================================================================

// Content Skill Files
router.get('/content/skill-files', authMiddleware, contentOpsController.getContentSkillFiles);
router.get('/content/skill-files/:id', authMiddleware, contentOpsController.getContentSkillFileById);
router.post('/content/skill-files', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.createContentSkillFile);
router.put('/content/skill-files/:id', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.updateContentSkillFile);
router.delete('/content/skill-files/:id', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.deleteContentSkillFile);

// Content Voice Memos
router.get('/content/voice-memos', authMiddleware, contentOpsController.getContentVoiceMemos);
router.post('/content/voice-memos', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.createContentVoiceMemo);

// Content Ideas
router.get('/content/ideas', authMiddleware, contentOpsController.getContentIdeas);
router.get('/content/ideas/:id', authMiddleware, contentOpsController.getContentIdeaById);
router.post('/content/ideas', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.createContentIdea);
router.put('/content/ideas/:id', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.updateContentIdea);
router.post('/content/ideas/:id/approve', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.approveContentIdea);
router.delete('/content/ideas/:id', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.deleteContentIdea);

// Content Drafts
router.get('/content/drafts', authMiddleware, contentOpsController.getContentDrafts);
router.get('/content/drafts/:id', authMiddleware, contentOpsController.getContentDraftById);
router.post('/content/drafts', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.createContentDraft);
router.put('/content/drafts/:id', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.updateContentDraft);
router.put('/content/drafts/:id/qa', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.updateContentDraftQA);
router.delete('/content/drafts/:id', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.deleteContentDraft);

// Content Calendar
router.get('/content/calendar', authMiddleware, contentOpsController.getContentCalendar);
router.post('/content/calendar', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.createContentCalendarEntry);
router.put('/content/calendar/:id', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.updateContentCalendarEntry);
router.delete('/content/calendar/:id', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.deleteContentCalendarEntry);

// Content Performance
router.get('/content/performance', authMiddleware, contentOpsController.getContentPerformance);
router.post('/content/performance', authMiddleware, requireRole('admin', 'ops_lead'), contentOpsController.createContentPerformance);

// Content Ops Dashboard & Analytics
router.get('/content/dashboard', authMiddleware, contentOpsController.getContentOpsDashboard);
router.get('/content/review-queue', authMiddleware, contentOpsController.getContentReviewQueue);
router.get('/content/top-performing', authMiddleware, contentOpsController.getTopPerformingContent);

// ============================================================================
// Integration endpoints (OpenClaw ↔ BizDeedz Platform OS)
// Protected by service account authentication
// ============================================================================

// Ingestion Items
router.post(
  '/integration/ingestion-items',
  serviceAuthMiddleware,
  requireScope('ingestion:write'),
  integrationController.createIngestionItem
);
router.patch(
  '/integration/ingestion-items/:item_id',
  serviceAuthMiddleware,
  requireScope('ingestion:write'),
  integrationController.updateIngestionItem
);

// Artifacts
router.post(
  '/integration/artifacts',
  serviceAuthMiddleware,
  requireScope('artifacts:write'),
  integrationController.createArtifactExtended
);

// Events
router.post(
  '/integration/events',
  serviceAuthMiddleware,
  requireScope('events:write'),
  integrationController.createEventExtended
);

// Automation Runs
router.post(
  '/integration/automation-runs/start',
  serviceAuthMiddleware,
  integrationController.startAutomationRun
);
router.post(
  '/integration/automation-runs/:run_id/finish',
  serviceAuthMiddleware,
  integrationController.finishAutomationRun
);

// Job Locks
router.post(
  '/integration/locks/acquire',
  serviceAuthMiddleware,
  integrationController.acquireLock
);
router.post(
  '/integration/locks/release',
  serviceAuthMiddleware,
  integrationController.releaseLock
);

export default router;
