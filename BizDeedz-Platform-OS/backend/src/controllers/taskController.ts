import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';
import { EventService } from '../services/eventService';
import { CreateTaskRequest } from '../../../shared/types';

/**
 * Create a new task
 */
export async function createTask(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const data: CreateTaskRequest = req.body;

    if (!data.matter_id || !data.task_type || !data.title) {
      return res.status(400).json({ error: 'matter_id, task_type, and title are required' });
    }

    await client.query('BEGIN');

    // Insert task
    const result = await client.query(
      `INSERT INTO tasks (
        matter_id, task_type, title, description, assigned_to, assigned_role,
        due_date, sla_minutes, status, created_by_type, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'todo', 'human', $9)
      RETURNING *`,
      [
        data.matter_id,
        data.task_type,
        data.title,
        data.description || null,
        data.assigned_to || null,
        data.assigned_role || null,
        data.due_date || null,
        data.sla_minutes || null,
        req.user?.user_id || null,
      ]
    );

    const newTask = result.rows[0];

    // Log event
    await EventService.logEvent({
      matter_id: data.matter_id,
      event_type: 'task_created',
      event_category: 'task',
      actor_type: 'user',
      actor_user_id: req.user?.user_id,
      description: `Task created: ${data.title}`,
      metadata_json: { task_id: newTask.task_id, task_type: data.task_type },
      reference_id: newTask.task_id,
      reference_type: 'task',
    });

    await client.query('COMMIT');

    res.status(201).json(newTask);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

/**
 * Get tasks for a matter
 */
export async function getTasksByMatter(req: AuthRequest, res: Response) {
  try {
    const { matter_id } = req.params;
    const { status } = req.query;

    let query = `
      SELECT t.*,
             u.first_name as assigned_first_name,
             u.last_name as assigned_last_name,
             creator.first_name as creator_first_name,
             creator.last_name as creator_last_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.user_id
      LEFT JOIN users creator ON t.created_by_id = creator.user_id
      WHERE t.matter_id = $1
    `;

    const params: any[] = [matter_id];

    if (status) {
      query += ` AND t.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get tasks assigned to user
 */
export async function getMyTasks(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.user_id;
    const { status } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let query = `
      SELECT t.*,
             m.matter_number,
             m.client_name,
             m.status as matter_status,
             m.priority as matter_priority,
             creator.first_name as creator_first_name,
             creator.last_name as creator_last_name
      FROM tasks t
      LEFT JOIN matters m ON t.matter_id = m.matter_id
      LEFT JOIN users creator ON t.created_by_id = creator.user_id
      WHERE t.assigned_to = $1
    `;

    const params: any[] = [userId];

    if (status) {
      query += ` AND t.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update a task
 */
export async function updateTask(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { task_id } = req.params;
    const updates = req.body;

    // Get current task
    const currentResult = await client.query(
      'SELECT * FROM tasks WHERE task_id = $1',
      [task_id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const currentTask = currentResult.rows[0];

    await client.query('BEGIN');

    // Build update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'title', 'description', 'assigned_to', 'assigned_role',
      'due_date', 'sla_minutes', 'status', 'completion_notes'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    // If status is done, set completed_at
    if (updates.status === 'done' && currentTask.status !== 'done') {
      fields.push(`completed_at = CURRENT_TIMESTAMP`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(task_id);

    const updateQuery = `
      UPDATE tasks
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE task_id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    const updatedTask = result.rows[0];

    // Log event
    let description = `Task updated: ${currentTask.title}`;
    if (updates.status && updates.status !== currentTask.status) {
      description = `Task status changed from ${currentTask.status} to ${updates.status}: ${currentTask.title}`;
    }

    await EventService.logEvent({
      matter_id: currentTask.matter_id,
      event_type: 'task_updated',
      event_category: 'task',
      actor_type: 'user',
      actor_user_id: req.user?.user_id,
      description,
      metadata_json: {
        task_id,
        old_status: currentTask.status,
        new_status: updates.status,
        updated_fields: Object.keys(updates),
      },
      reference_id: task_id,
      reference_type: 'task',
    });

    await client.query('COMMIT');

    res.json(updatedTask);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

/**
 * Delete a task
 */
export async function deleteTask(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { task_id } = req.params;

    await client.query('BEGIN');

    // Get task info before deletion
    const taskResult = await client.query('SELECT * FROM tasks WHERE task_id = $1', [task_id]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Delete task
    await client.query('DELETE FROM tasks WHERE task_id = $1', [task_id]);

    // Log event
    await EventService.logEvent({
      matter_id: task.matter_id,
      event_type: 'task_deleted',
      event_category: 'task',
      actor_type: 'user',
      actor_user_id: req.user?.user_id,
      description: `Task deleted: ${task.title}`,
      metadata_json: { task_id, task_type: task.task_type },
      reference_id: task_id,
      reference_type: 'task',
    });

    await client.query('COMMIT');

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}
