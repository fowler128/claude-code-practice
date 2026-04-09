import { Request, Response } from 'express';
import { Pool } from 'pg';
import {
  ContentSkillFile,
  ContentVoiceMemo,
  ContentIdea,
  ContentDraft,
  ContentCalendarEntry,
  ContentPerformance,
  CreateContentSkillFileRequest,
  UpdateContentSkillFileRequest,
  CreateContentVoiceMemoRequest,
  CreateContentIdeaRequest,
  UpdateContentIdeaRequest,
  CreateContentDraftRequest,
  UpdateContentDraftRequest,
  UpdateContentDraftQARequest,
  CreateContentCalendarRequest,
  UpdateContentCalendarRequest,
  CreateContentPerformanceRequest,
  ContentOpsDashboard,
  ContentReviewQueueItem,
} from '../../../shared/types';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bizdeedz_platform_os',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// ============================================================================
// CONTENT SKILL FILES
// ============================================================================

export async function getContentSkillFiles(req: Request, res: Response) {
  try {
    const { brand_lane, is_active } = req.query;

    let query = 'SELECT * FROM content_skill_files WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (brand_lane) {
      query += ` AND brand_lane = $${paramIndex}`;
      params.push(brand_lane);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching content skill files:', error);
    res.status(500).json({ error: 'Failed to fetch content skill files' });
  }
}

export async function getContentSkillFileById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM content_skill_files WHERE skill_file_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content skill file not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching content skill file:', error);
    res.status(500).json({ error: 'Failed to fetch content skill file' });
  }
}

export async function createContentSkillFile(req: Request, res: Response) {
  try {
    const data: CreateContentSkillFileRequest = req.body;
    const userId = (req as any).user?.userId;

    const result = await pool.query(
      `INSERT INTO content_skill_files (
        name, brand_lane, markdown_text, version, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [data.name, data.brand_lane, data.markdown_text, data.version || 1, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating content skill file:', error);
    res.status(500).json({ error: 'Failed to create content skill file' });
  }
}

export async function updateContentSkillFile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: UpdateContentSkillFileRequest = req.body;

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.brand_lane !== undefined) {
      setClauses.push(`brand_lane = $${paramIndex}`);
      params.push(data.brand_lane);
      paramIndex++;
    }

    if (data.markdown_text !== undefined) {
      setClauses.push(`markdown_text = $${paramIndex}`);
      params.push(data.markdown_text);
      paramIndex++;
    }

    if (data.version !== undefined) {
      setClauses.push(`version = $${paramIndex}`);
      params.push(data.version);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      setClauses.push(`is_active = $${paramIndex}`);
      params.push(data.is_active);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE content_skill_files SET ${setClauses.join(', ')}
       WHERE skill_file_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content skill file not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating content skill file:', error);
    res.status(500).json({ error: 'Failed to update content skill file' });
  }
}

export async function deleteContentSkillFile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM content_skill_files WHERE skill_file_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content skill file not found' });
    }

    res.json({ message: 'Content skill file deleted successfully' });
  } catch (error) {
    console.error('Error deleting content skill file:', error);
    res.status(500).json({ error: 'Failed to delete content skill file' });
  }
}

// ============================================================================
// CONTENT VOICE MEMOS
// ============================================================================

export async function getContentVoiceMemos(req: Request, res: Response) {
  try {
    const { source, created_by } = req.query;

    let query = 'SELECT * FROM content_voice_memos WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (source) {
      query += ` AND source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    if (created_by) {
      query += ` AND created_by = $${paramIndex}`;
      params.push(created_by);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching content voice memos:', error);
    res.status(500).json({ error: 'Failed to fetch content voice memos' });
  }
}

export async function createContentVoiceMemo(req: Request, res: Response) {
  try {
    const data: CreateContentVoiceMemoRequest = req.body;
    const userId = (req as any).user?.userId;

    const result = await pool.query(
      `INSERT INTO content_voice_memos (
        source, file_url, transcript_text, duration_seconds, tags, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [data.source, data.file_url, data.transcript_text, data.duration_seconds, data.tags || [], userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating content voice memo:', error);
    res.status(500).json({ error: 'Failed to create content voice memo' });
  }
}

// ============================================================================
// CONTENT IDEAS
// ============================================================================

export async function getContentIdeas(req: Request, res: Response) {
  try {
    const { lane, status, sku, created_by } = req.query;

    let query = 'SELECT * FROM content_ideas WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (lane) {
      query += ` AND lane = $${paramIndex}`;
      params.push(lane);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (sku) {
      query += ` AND sku = $${paramIndex}`;
      params.push(sku);
      paramIndex++;
    }

    if (created_by) {
      query += ` AND created_by = $${paramIndex}`;
      params.push(created_by);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching content ideas:', error);
    res.status(500).json({ error: 'Failed to fetch content ideas' });
  }
}

export async function getContentIdeaById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM content_ideas WHERE idea_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content idea not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching content idea:', error);
    res.status(500).json({ error: 'Failed to fetch content idea' });
  }
}

export async function createContentIdea(req: Request, res: Response) {
  try {
    const data: CreateContentIdeaRequest = req.body;
    const userId = (req as any).user?.userId;

    const result = await pool.query(
      `INSERT INTO content_ideas (
        lane, sku, hook_1, hook_2, mechanism, principle, status, tags,
        source_memo_id, created_by, metadata_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.lane,
        data.sku,
        data.hook_1,
        data.hook_2,
        data.mechanism,
        data.principle,
        data.status || 'captured',
        data.tags || [],
        data.source_memo_id,
        userId,
        data.metadata_json || {},
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating content idea:', error);
    res.status(500).json({ error: 'Failed to create content idea' });
  }
}

export async function updateContentIdea(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: UpdateContentIdeaRequest = req.body;

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.lane !== undefined) {
      setClauses.push(`lane = $${paramIndex}`);
      params.push(data.lane);
      paramIndex++;
    }

    if (data.sku !== undefined) {
      setClauses.push(`sku = $${paramIndex}`);
      params.push(data.sku);
      paramIndex++;
    }

    if (data.hook_1 !== undefined) {
      setClauses.push(`hook_1 = $${paramIndex}`);
      params.push(data.hook_1);
      paramIndex++;
    }

    if (data.hook_2 !== undefined) {
      setClauses.push(`hook_2 = $${paramIndex}`);
      params.push(data.hook_2);
      paramIndex++;
    }

    if (data.mechanism !== undefined) {
      setClauses.push(`mechanism = $${paramIndex}`);
      params.push(data.mechanism);
      paramIndex++;
    }

    if (data.principle !== undefined) {
      setClauses.push(`principle = $${paramIndex}`);
      params.push(data.principle);
      paramIndex++;
    }

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.tags !== undefined) {
      setClauses.push(`tags = $${paramIndex}`);
      params.push(data.tags);
      paramIndex++;
    }

    if (data.metadata_json !== undefined) {
      setClauses.push(`metadata_json = $${paramIndex}`);
      params.push(data.metadata_json);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE content_ideas SET ${setClauses.join(', ')}
       WHERE idea_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content idea not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating content idea:', error);
    res.status(500).json({ error: 'Failed to update content idea' });
  }
}

export async function approveContentIdea(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const result = await pool.query(
      `UPDATE content_ideas
       SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
       WHERE idea_id = $2
       RETURNING *`,
      [userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content idea not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving content idea:', error);
    res.status(500).json({ error: 'Failed to approve content idea' });
  }
}

export async function deleteContentIdea(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM content_ideas WHERE idea_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content idea not found' });
    }

    res.json({ message: 'Content idea deleted successfully' });
  } catch (error) {
    console.error('Error deleting content idea:', error);
    res.status(500).json({ error: 'Failed to delete content idea' });
  }
}

// ============================================================================
// CONTENT DRAFTS
// ============================================================================

export async function getContentDrafts(req: Request, res: Response) {
  try {
    const { idea_id, platform, qa_passed, is_active } = req.query;

    let query = 'SELECT * FROM content_drafts WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (idea_id) {
      query += ` AND idea_id = $${paramIndex}`;
      params.push(idea_id);
      paramIndex++;
    }

    if (platform) {
      query += ` AND platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    if (qa_passed !== undefined) {
      query += ` AND qa_passed = $${paramIndex}`;
      params.push(qa_passed === 'true');
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching content drafts:', error);
    res.status(500).json({ error: 'Failed to fetch content drafts' });
  }
}

export async function getContentDraftById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM content_drafts WHERE draft_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content draft not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching content draft:', error);
    res.status(500).json({ error: 'Failed to fetch content draft' });
  }
}

export async function createContentDraft(req: Request, res: Response) {
  try {
    const data: CreateContentDraftRequest = req.body;
    const userId = (req as any).user?.userId;

    const result = await pool.query(
      `INSERT INTO content_drafts (
        idea_id, platform, draft_text, version, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [data.idea_id, data.platform, data.draft_text, data.version || 1, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating content draft:', error);
    res.status(500).json({ error: 'Failed to create content draft' });
  }
}

export async function updateContentDraft(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: UpdateContentDraftRequest = req.body;

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.draft_text !== undefined) {
      setClauses.push(`draft_text = $${paramIndex}`);
      params.push(data.draft_text);
      paramIndex++;
    }

    if (data.platform !== undefined) {
      setClauses.push(`platform = $${paramIndex}`);
      params.push(data.platform);
      paramIndex++;
    }

    if (data.version !== undefined) {
      setClauses.push(`version = $${paramIndex}`);
      params.push(data.version);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      setClauses.push(`is_active = $${paramIndex}`);
      params.push(data.is_active);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE content_drafts SET ${setClauses.join(', ')}
       WHERE draft_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content draft not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating content draft:', error);
    res.status(500).json({ error: 'Failed to update content draft' });
  }
}

export async function updateContentDraftQA(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: UpdateContentDraftQARequest = req.body;
    const userId = (req as any).user?.userId;

    const setClauses: string[] = ['reviewed_by = $1', 'reviewed_at = CURRENT_TIMESTAMP'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (data.qa_principle !== undefined) {
      setClauses.push(`qa_principle = $${paramIndex}`);
      params.push(data.qa_principle);
      paramIndex++;
    }

    if (data.qa_mechanism !== undefined) {
      setClauses.push(`qa_mechanism = $${paramIndex}`);
      params.push(data.qa_mechanism);
      paramIndex++;
    }

    if (data.qa_cta !== undefined) {
      setClauses.push(`qa_cta = $${paramIndex}`);
      params.push(data.qa_cta);
      paramIndex++;
    }

    if (data.qa_audience !== undefined) {
      setClauses.push(`qa_audience = $${paramIndex}`);
      params.push(data.qa_audience);
      paramIndex++;
    }

    if (data.review_notes !== undefined) {
      setClauses.push(`review_notes = $${paramIndex}`);
      params.push(data.review_notes);
      paramIndex++;
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE content_drafts SET ${setClauses.join(', ')}
       WHERE draft_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content draft not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating content draft QA:', error);
    res.status(500).json({ error: 'Failed to update content draft QA' });
  }
}

export async function deleteContentDraft(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM content_drafts WHERE draft_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content draft not found' });
    }

    res.json({ message: 'Content draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting content draft:', error);
    res.status(500).json({ error: 'Failed to delete content draft' });
  }
}

// ============================================================================
// CONTENT CALENDAR
// ============================================================================

export async function getContentCalendar(req: Request, res: Response) {
  try {
    const { publish_status, start_date, end_date } = req.query;

    let query = 'SELECT * FROM v_content_calendar_overview WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (publish_status) {
      query += ` AND publish_status = $${paramIndex}`;
      params.push(publish_status);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND scheduled_for >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND scheduled_for <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' ORDER BY scheduled_for ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching content calendar:', error);
    res.status(500).json({ error: 'Failed to fetch content calendar' });
  }
}

export async function createContentCalendarEntry(req: Request, res: Response) {
  try {
    const data: CreateContentCalendarRequest = req.body;
    const userId = (req as any).user?.userId;

    const result = await pool.query(
      `INSERT INTO content_calendar (
        draft_id, scheduled_for, publish_status, scheduled_by
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [data.draft_id, data.scheduled_for, data.publish_status || 'scheduled', userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating content calendar entry:', error);
    res.status(500).json({ error: 'Failed to create content calendar entry' });
  }
}

export async function updateContentCalendarEntry(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: UpdateContentCalendarRequest = req.body;

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.scheduled_for !== undefined) {
      setClauses.push(`scheduled_for = $${paramIndex}`);
      params.push(data.scheduled_for);
      paramIndex++;
    }

    if (data.publish_status !== undefined) {
      setClauses.push(`publish_status = $${paramIndex}`);
      params.push(data.publish_status);
      paramIndex++;
    }

    if (data.published_at !== undefined) {
      setClauses.push(`published_at = $${paramIndex}`);
      params.push(data.published_at);
      paramIndex++;
    }

    if (data.publish_url !== undefined) {
      setClauses.push(`publish_url = $${paramIndex}`);
      params.push(data.publish_url);
      paramIndex++;
    }

    if (data.publish_error !== undefined) {
      setClauses.push(`publish_error = $${paramIndex}`);
      params.push(data.publish_error);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE content_calendar SET ${setClauses.join(', ')}
       WHERE calendar_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content calendar entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating content calendar entry:', error);
    res.status(500).json({ error: 'Failed to update content calendar entry' });
  }
}

export async function deleteContentCalendarEntry(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM content_calendar WHERE calendar_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content calendar entry not found' });
    }

    res.json({ message: 'Content calendar entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting content calendar entry:', error);
    res.status(500).json({ error: 'Failed to delete content calendar entry' });
  }
}

// ============================================================================
// CONTENT PERFORMANCE
// ============================================================================

export async function getContentPerformance(req: Request, res: Response) {
  try {
    const { draft_id } = req.query;

    let query = 'SELECT * FROM v_content_performance_dashboard WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (draft_id) {
      query += ` AND draft_id = $${paramIndex}`;
      params.push(draft_id);
      paramIndex++;
    }

    query += ' ORDER BY measured_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching content performance:', error);
    res.status(500).json({ error: 'Failed to fetch content performance' });
  }
}

export async function createContentPerformance(req: Request, res: Response) {
  try {
    const data: CreateContentPerformanceRequest = req.body;
    const userId = (req as any).user?.userId;

    const result = await pool.query(
      `INSERT INTO content_performance (
        draft_id, impressions, saves, comments, likes, shares,
        dms, calls, conversions, notes, top_comment, measured_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.draft_id,
        data.impressions || 0,
        data.saves || 0,
        data.comments || 0,
        data.likes || 0,
        data.shares || 0,
        data.dms || 0,
        data.calls || 0,
        data.conversions || 0,
        data.notes,
        data.top_comment,
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating content performance:', error);
    res.status(500).json({ error: 'Failed to create content performance' });
  }
}

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

export async function getContentOpsDashboard(req: Request, res: Response) {
  try {
    // Ideas pipeline
    const ideasPipelineResult = await pool.query(
      'SELECT * FROM v_content_ideas_pipeline ORDER BY lane, status'
    );

    // Review queue count
    const reviewQueueResult = await pool.query(
      'SELECT COUNT(*) as count FROM v_content_review_queue WHERE qa_passed = false'
    );

    // Scheduled content this week
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const scheduledResult = await pool.query(
      `SELECT COUNT(*) as count FROM content_calendar
       WHERE scheduled_for >= $1 AND scheduled_for < $2 AND publish_status = 'scheduled'`,
      [weekStart.toISOString(), weekEnd.toISOString()]
    );

    // Top performing content
    const topPerformingResult = await pool.query(
      'SELECT * FROM v_top_performing_content LIMIT 5'
    );

    // Total published content
    const publishedResult = await pool.query(
      `SELECT COUNT(*) as count FROM content_calendar WHERE publish_status = 'published'`
    );

    const dashboard: ContentOpsDashboard = {
      ideas_pipeline: ideasPipelineResult.rows,
      drafts_pending_review: parseInt(reviewQueueResult.rows[0].count),
      scheduled_this_week: parseInt(scheduledResult.rows[0].count),
      top_performing: topPerformingResult.rows,
      total_published: parseInt(publishedResult.rows[0].count),
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching content ops dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch content ops dashboard' });
  }
}

export async function getContentReviewQueue(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM v_content_review_queue');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching content review queue:', error);
    res.status(500).json({ error: 'Failed to fetch content review queue' });
  }
}

export async function getTopPerformingContent(req: Request, res: Response) {
  try {
    const { limit } = req.query;
    const limitValue = limit ? parseInt(limit as string) : 20;

    const result = await pool.query(
      'SELECT * FROM v_top_performing_content LIMIT $1',
      [limitValue]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching top performing content:', error);
    res.status(500).json({ error: 'Failed to fetch top performing content' });
  }
}
