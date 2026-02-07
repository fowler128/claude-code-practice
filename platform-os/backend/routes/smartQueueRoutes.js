/**
 * Smart Queue Routes
 * Role-based task checklist with priority sorting
 * Roles: junior_paralegal, paralegal, ops_manager (and others)
 */

const express = require('express');
const router = express.Router();

module.exports = (db) => {
  /**
   * GET /api/smart-queue
   * Get role-based task queue with intelligent prioritization
   */
  router.get('/', async (req, res) => {
    try {
      const {
        role,
        assigned_to,
        priority,
        include_overdue = 'true',
        limit = 100,
        offset = 0
      } = req.query;

      // Build query with role-based filtering
      let query = `
        SELECT
          t.id,
          t.matter_id,
          t.title,
          t.description,
          t.task_type,
          t.priority,
          t.assigned_to,
          t.assigned_role,
          t.assigned_lane,
          t.status,
          t.due_date,
          t.is_automated,
          t.created_at,
          m.matter_number,
          m.client_name,
          m.current_status as matter_status,
          m.health_score,
          m.health_risk_tier,
          m.sla_breach_at,
          pa.name as practice_area,
          CASE
            WHEN t.due_date < NOW() THEN 1
            WHEN t.due_date::date = CURRENT_DATE THEN 2
            WHEN t.due_date BETWEEN NOW() AND NOW() + INTERVAL '3 days' THEN 3
            WHEN t.due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' THEN 4
            ELSE 5
          END as urgency_score
        FROM tasks t
        JOIN matters m ON t.matter_id = m.id
        JOIN practice_areas pa ON m.practice_area_id = pa.id
        WHERE t.status IN ('pending', 'in_progress')
          AND m.is_archived = false
      `;

      const params = [];
      let paramIndex = 1;

      // Role-based filtering
      if (role) {
        query += ` AND t.assigned_role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      // Specific user filtering
      if (assigned_to) {
        query += ` AND t.assigned_to = $${paramIndex}`;
        params.push(assigned_to);
        paramIndex++;
      }

      // Priority filtering
      if (priority) {
        query += ` AND t.priority = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }

      // Optionally exclude non-overdue tasks
      if (include_overdue === 'false') {
        query += ` AND t.due_date >= NOW()`;
      }

      // Smart prioritization:
      // 1. Urgent priority tasks
      // 2. Overdue tasks
      // 3. High-risk matters
      // 4. SLA breach matters
      // 5. Due date proximity
      query += `
        ORDER BY
          CASE t.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          urgency_score,
          CASE m.health_risk_tier
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          CASE WHEN m.sla_breach_at IS NOT NULL THEN 0 ELSE 1 END,
          t.due_date ASC NULLS LAST,
          t.created_at ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Group tasks by role for better organization
      const tasksByRole = {};
      result.rows.forEach(task => {
        const role = task.assigned_role || 'unassigned';
        if (!tasksByRole[role]) {
          tasksByRole[role] = [];
        }
        tasksByRole[role].push(task);
      });

      // Calculate summary stats
      const summary = {
        total: result.rows.length,
        overdue: result.rows.filter(t => new Date(t.due_date) < new Date()).length,
        dueToday: result.rows.filter(t => {
          const dueDate = new Date(t.due_date);
          const today = new Date();
          return dueDate.toDateString() === today.toDateString();
        }).length,
        urgent: result.rows.filter(t => t.priority === 'urgent').length,
        highRiskMatters: result.rows.filter(t => t.health_risk_tier === 'high').length,
        slaBreaches: result.rows.filter(t => t.sla_breach_at).length
      };

      res.json({
        tasks: result.rows,
        tasksByRole,
        summary,
        filters: { role, assigned_to, priority },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('[SmartQueue] Error:', error);
      res.status(500).json({ error: 'Failed to fetch smart queue' });
    }
  });

  /**
   * GET /api/smart-queue/checklist/:role
   * Get role-specific daily checklist
   */
  router.get('/checklist/:role', async (req, res) => {
    try {
      const { role } = req.params;
      const { assigned_to } = req.query;

      // Get tasks for this role
      const tasksResult = await db.query(
        `SELECT
          t.*,
          m.matter_number,
          m.client_name,
          m.health_risk_tier,
          m.sla_breach_at,
          CASE
            WHEN t.due_date < NOW() THEN 'overdue'
            WHEN t.due_date::date = CURRENT_DATE THEN 'today'
            WHEN t.due_date BETWEEN NOW() AND NOW() + INTERVAL '3 days' THEN 'this_week'
            ELSE 'future'
          END as time_bucket
        FROM tasks t
        JOIN matters m ON t.matter_id = m.id
        WHERE t.status IN ('pending', 'in_progress')
          AND t.assigned_role = $1
          ${assigned_to ? 'AND t.assigned_to = $2' : ''}
          AND m.is_archived = false
        ORDER BY
          CASE t.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          t.due_date ASC NULLS LAST`,
        assigned_to ? [role, assigned_to] : [role]
      );

      // Group by time bucket
      const checklist = {
        overdue: [],
        today: [],
        this_week: [],
        future: []
      };

      tasksResult.rows.forEach(task => {
        checklist[task.time_bucket].push(task);
      });

      // Calculate completion stats
      const completedTodayResult = await db.query(
        `SELECT COUNT(*) as completed
         FROM tasks
         WHERE assigned_role = $1
           ${assigned_to ? 'AND assigned_to = $2' : ''}
           AND status = 'completed'
           AND completed_at::date = CURRENT_DATE`,
        assigned_to ? [role, assigned_to] : [role]
      );

      const summary = {
        role,
        overdue: checklist.overdue.length,
        dueToday: checklist.today.length,
        dueThisWeek: checklist.this_week.length,
        completedToday: parseInt(completedTodayResult.rows[0].completed),
        total: tasksResult.rows.length
      };

      res.json({
        checklist,
        summary,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('[SmartQueue] Checklist error:', error);
      res.status(500).json({ error: 'Failed to fetch checklist' });
    }
  });

  /**
   * GET /api/smart-queue/my-tasks
   * Get tasks for current user (requires auth in production)
   */
  router.get('/my-tasks', async (req, res) => {
    try {
      const { user_email, role } = req.query;

      if (!user_email) {
        return res.status(400).json({ error: 'user_email is required' });
      }

      const result = await db.query(
        `SELECT
          t.*,
          m.matter_number,
          m.client_name,
          m.current_status as matter_status,
          m.health_score,
          m.health_risk_tier
        FROM tasks t
        JOIN matters m ON t.matter_id = m.id
        WHERE t.status IN ('pending', 'in_progress')
          AND (t.assigned_to = $1 ${role ? 'OR t.assigned_role = $2' : ''})
          AND m.is_archived = false
        ORDER BY
          CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
          CASE t.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          t.due_date ASC NULLS LAST`,
        role ? [user_email, role] : [user_email]
      );

      res.json({
        tasks: result.rows,
        count: result.rows.length,
        user: user_email
      });
    } catch (error) {
      console.error('[SmartQueue] My tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch my tasks' });
    }
  });

  return router;
};
