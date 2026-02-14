import pool from '../db/connection';
import { EventCategory, ActorType } from '../../../shared/types';

export interface CreateEventParams {
  matter_id?: string;
  event_type: string;
  event_category: EventCategory;
  actor_type: ActorType;
  actor_user_id?: string;
  description: string;
  metadata_json?: any;
  reference_id?: string;
  reference_type?: string;
}

export class EventService {
  /**
   * Log an event to the audit log
   */
  static async logEvent(params: CreateEventParams): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO events (
          matter_id, event_type, event_category, actor_type, actor_user_id,
          description, metadata_json, reference_id, reference_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          params.matter_id || null,
          params.event_type,
          params.event_category,
          params.actor_type,
          params.actor_user_id || null,
          params.description,
          params.metadata_json ? JSON.stringify(params.metadata_json) : null,
          params.reference_id || null,
          params.reference_type || null,
        ]
      );
    } catch (error) {
      console.error('Error logging event:', error);
      // Don't throw - we don't want event logging to break the main operation
    }
  }

  /**
   * Get events for a specific matter
   */
  static async getEventsForMatter(matter_id: string, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT e.*, u.first_name, u.last_name, u.email
       FROM events e
       LEFT JOIN users u ON e.actor_user_id = u.user_id
       WHERE e.matter_id = $1
       ORDER BY e.created_at DESC
       LIMIT $2`,
      [matter_id, limit]
    );

    return result.rows;
  }

  /**
   * Get recent events across all matters
   */
  static async getRecentEvents(limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT e.*, u.first_name, u.last_name, u.email,
              m.matter_number, m.client_name
       FROM events e
       LEFT JOIN users u ON e.actor_user_id = u.user_id
       LEFT JOIN matters m ON e.matter_id = m.matter_id
       ORDER BY e.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get events by type
   */
  static async getEventsByType(event_type: string, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT e.*, u.first_name, u.last_name, u.email,
              m.matter_number, m.client_name
       FROM events e
       LEFT JOIN users u ON e.actor_user_id = u.user_id
       LEFT JOIN matters m ON e.matter_id = m.matter_id
       WHERE e.event_type = $1
       ORDER BY e.created_at DESC
       LIMIT $2`,
      [event_type, limit]
    );

    return result.rows;
  }

  /**
   * Get events by category
   */
  static async getEventsByCategory(event_category: EventCategory, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT e.*, u.first_name, u.last_name, u.email,
              m.matter_number, m.client_name
       FROM events e
       LEFT JOIN users u ON e.actor_user_id = u.user_id
       LEFT JOIN matters m ON e.matter_id = m.matter_id
       WHERE e.event_category = $1
       ORDER BY e.created_at DESC
       LIMIT $2`,
      [event_category, limit]
    );

    return result.rows;
  }
}
