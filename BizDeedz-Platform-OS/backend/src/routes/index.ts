import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as matterController from '../controllers/matterController';
import * as taskController from '../controllers/taskController';

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

export default router;
