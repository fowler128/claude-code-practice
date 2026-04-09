/**
 * OpenClaw Import Routes
 * Accepts lead data from OpenClaw and creates leads + work orders
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

module.exports = (db, agentOrchestrator) => {
  /**
   * POST /api/openclaw/import
   * Import lead from OpenClaw
   *
   * Expected payload:
   * {
   *   company_name: string,
   *   contact_name: string,
   *   contact_email: string,
   *   contact_phone?: string,
   *   source: string,
   *   industry?: string,
   *   company_size?: string,
   *   budget_range?: string,
   *   timeline?: string,
   *   pain_points?: string[],
   *   requirements?: object,
   *   custom_fields?: object,
   *   auto_score?: boolean (default true),
   *   create_work_order?: boolean (default true)
   * }
   */
  router.post('/import', async (req, res) => {
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
        requirements,
        custom_fields,
        auto_score = true,
        create_work_order = true,
        assigned_to
      } = req.body;

      // Validate required fields
      if (!contact_name || !contact_email) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['contact_name', 'contact_email']
        });
      }

      // Check for duplicate lead
      const duplicateCheck = await db.query(
        `SELECT id, lead_number, status FROM leads
         WHERE contact_email = $1
         ORDER BY created_at DESC LIMIT 1`,
        [contact_email]
      );

      if (duplicateCheck.rows.length > 0) {
        const existing = duplicateCheck.rows[0];
        return res.status(409).json({
          error: 'Duplicate lead',
          message: 'Lead with this email already exists',
          existingLead: {
            id: existing.id,
            lead_number: existing.lead_number,
            status: existing.status
          }
        });
      }

      // Create lead
      const leadId = uuidv4();
      await db.query(
        `INSERT INTO leads (
          id, company_name, contact_name, contact_email, contact_phone,
          source, industry, company_size, budget_range, timeline,
          pain_points, requirements, custom_fields, assigned_to, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          leadId,
          company_name,
          contact_name,
          contact_email,
          contact_phone,
          source || 'openclaw',
          industry,
          company_size,
          budget_range,
          timeline,
          pain_points || [],
          requirements ? JSON.stringify(requirements) : null,
          custom_fields ? JSON.stringify(custom_fields) : null,
          assigned_to,
          'new'
        ]
      );

      // Fetch created lead
      const leadResult = await db.query(
        'SELECT * FROM leads WHERE id = $1',
        [leadId]
      );

      const lead = leadResult.rows[0];

      // Auto-score lead if enabled
      let workOrderId = null;
      let scoringResult = null;

      if (auto_score) {
        try {
          // Find Lead Scoring Agent
          const agentResult = await db.query(
            `SELECT id FROM agent_directory
             WHERE agent_name = 'Lead Scoring Agent'
               AND is_active = true
             LIMIT 1`
          );

          if (agentResult.rows.length > 0) {
            const agentId = agentResult.rows[0].id;

            // Create work order for lead scoring
            workOrderId = uuidv4();
            await db.query(
              `INSERT INTO work_orders (
                id, agent_id, title, description, work_type, priority,
                related_entity_type, related_entity_id, input_data, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                workOrderId,
                agentId,
                `Score lead: ${contact_name}`,
                `Auto-score lead from OpenClaw import`,
                'lead_scoring',
                'high',
                'lead',
                leadId,
                JSON.stringify({
                  company_name,
                  contact_name,
                  industry: industry || 'unknown',
                  company_size: company_size || 'unknown',
                  budget_range: budget_range || 'unknown',
                  timeline: timeline || 'unknown',
                  source,
                  pain_points: pain_points || [],
                  requirements: requirements || {}
                }),
                'pending'
              ]
            );

            // Execute scoring agent (non-blocking)
            if (create_work_order) {
              try {
                scoringResult = await agentOrchestrator.executeAgent(
                  agentId,
                  workOrderId,
                  {
                    company_name,
                    contact_name,
                    industry: industry || 'unknown',
                    company_size: company_size || 'unknown',
                    budget_range: budget_range || 'unknown',
                    timeline: timeline || 'unknown',
                    source,
                    pain_points: pain_points || []
                  },
                  'openclaw_import'
                );

                // Update lead with score if completed
                if (scoringResult.status === 'completed' && scoringResult.output) {
                  const score = scoringResult.output.overall_lead_score || null;
                  const scoreFactors = scoringResult.output.score_breakdown || null;
                  const nextAction = scoringResult.output.next_best_action || null;

                  await db.query(
                    `UPDATE leads
                     SET lead_score = $1,
                         lead_score_factors = $2,
                         next_best_action = $3
                     WHERE id = $4`,
                    [
                      score,
                      scoreFactors ? JSON.stringify(scoreFactors) : null,
                      nextAction,
                      leadId
                    ]
                  );
                }
              } catch (agentError) {
                console.error('[OpenClaw] Agent execution error:', agentError);
                // Don't fail import if scoring fails
              }
            }
          }
        } catch (scoringError) {
          console.error('[OpenClaw] Lead scoring error:', scoringError);
          // Don't fail import if scoring fails
        }
      }

      // Fetch updated lead
      const updatedLeadResult = await db.query(
        'SELECT * FROM leads WHERE id = $1',
        [leadId]
      );

      res.status(201).json({
        success: true,
        lead: updatedLeadResult.rows[0],
        workOrder: workOrderId ? {
          id: workOrderId,
          status: scoringResult?.status || 'pending',
          requires_approval: scoringResult?.requires_approval || false
        } : null,
        message: 'Lead imported successfully from OpenClaw'
      });
    } catch (error) {
      console.error('[OpenClaw] Import error:', error);
      res.status(500).json({
        error: 'Failed to import lead',
        message: error.message
      });
    }
  });

  /**
   * POST /api/openclaw/bulk-import
   * Bulk import multiple leads
   */
  router.post('/bulk-import', async (req, res) => {
    try {
      const { leads } = req.body;

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'leads must be a non-empty array'
        });
      }

      const results = {
        success: [],
        failed: [],
        duplicates: []
      };

      for (const leadData of leads) {
        try {
          // Use the import endpoint logic
          const importResult = await importSingleLead(db, agentOrchestrator, leadData);

          if (importResult.duplicate) {
            results.duplicates.push({
              contact_email: leadData.contact_email,
              existing_lead: importResult.existingLead
            });
          } else {
            results.success.push(importResult.lead);
          }
        } catch (error) {
          results.failed.push({
            contact_email: leadData.contact_email,
            error: error.message
          });
        }
      }

      res.json({
        summary: {
          total: leads.length,
          success: results.success.length,
          failed: results.failed.length,
          duplicates: results.duplicates.length
        },
        results
      });
    } catch (error) {
      console.error('[OpenClaw] Bulk import error:', error);
      res.status(500).json({
        error: 'Failed to bulk import leads',
        message: error.message
      });
    }
  });

  /**
   * GET /api/openclaw/status
   * Check OpenClaw integration status
   */
  router.get('/status', async (req, res) => {
    try {
      // Check if Lead Scoring Agent is available
      const agentResult = await db.query(
        `SELECT id, agent_name, is_active FROM agent_directory
         WHERE agent_name = 'Lead Scoring Agent'
         LIMIT 1`
      );

      // Count recent imports
      const importCountResult = await db.query(
        `SELECT
          COUNT(*) FILTER (WHERE source = 'openclaw') as openclaw_imports,
          COUNT(*) FILTER (WHERE source = 'openclaw' AND created_at > NOW() - INTERVAL '24 hours') as imports_24h
         FROM leads`
      );

      res.json({
        status: 'operational',
        leadScoringAgent: {
          available: agentResult.rows.length > 0,
          agent: agentResult.rows[0] || null
        },
        stats: importCountResult.rows[0],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[OpenClaw] Status check error:', error);
      res.status(500).json({
        status: 'error',
        error: error.message
      });
    }
  });

  return router;
};

/**
 * Helper function to import a single lead
 */
async function importSingleLead(db, agentOrchestrator, leadData) {
  const { contact_email, ...otherData } = leadData;

  // Check duplicate
  const duplicateCheck = await db.query(
    'SELECT id, lead_number FROM leads WHERE contact_email = $1 LIMIT 1',
    [contact_email]
  );

  if (duplicateCheck.rows.length > 0) {
    return {
      duplicate: true,
      existingLead: duplicateCheck.rows[0]
    };
  }

  // Create lead
  const leadId = uuidv4();
  await db.query(
    `INSERT INTO leads (
      id, contact_email, contact_name, company_name, source, industry,
      company_size, budget_range, timeline, pain_points, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      leadId,
      contact_email,
      otherData.contact_name || 'Unknown',
      otherData.company_name,
      otherData.source || 'openclaw',
      otherData.industry,
      otherData.company_size,
      otherData.budget_range,
      otherData.timeline,
      otherData.pain_points || [],
      'new'
    ]
  );

  const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);

  return {
    duplicate: false,
    lead: leadResult.rows[0]
  };
}
