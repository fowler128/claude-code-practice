/**
 * Matter Lifecycle Service
 * Wires automation engine and health scoring into matter lifecycle
 */

const { calculateMatterHealthScore } = require('./matterHealthScore');

class MatterLifecycle {
  constructor(db, automationEngine, eventLogger, templateLoader) {
    this.db = db;
    this.automationEngine = automationEngine;
    this.eventLogger = eventLogger;
    this.templateLoader = templateLoader;
  }

  /**
   * Handle matter creation lifecycle
   */
  async onMatterCreated(matter, userId = 'system') {
    console.log(`[Lifecycle] Matter created: ${matter.matter_number}`);

    try {
      // Load playbook template
      const playbook = await this.templateLoader.getTemplateByType(
        matter.practice_area_id,
        matter.matter_type_id
      );

      if (!playbook) {
        console.warn(`[Lifecycle] No playbook found for matter ${matter.id}`);
        return;
      }

      // Set initial status from playbook
      const initialStatus = playbook.statuses.find(s => s.is_initial);
      if (initialStatus) {
        await this.db.query(
          `UPDATE matters
           SET current_status = $1,
               current_lane = $2,
               playbook_template_id = (
                 SELECT id FROM playbook_templates
                 WHERE template_id = $3 AND is_active = true LIMIT 1
               )
           WHERE id = $4`,
          [initialStatus.id, initialStatus.lane, playbook.template_id, matter.id]
        );

        // Log initial status event
        await this.eventLogger.logEvent({
          matter_id: matter.id,
          event_type: 'matter_created',
          event_category: 'workflow',
          title: 'Matter created',
          description: `Created with initial status: ${initialStatus.name}`,
          new_value: { status: initialStatus.id, lane: initialStatus.lane },
          actor_id: userId
        });
      }

      // Run automation engine for matter creation
      await this.automationEngine.onMatterCreated(matter, playbook);

      // Calculate initial health score
      await this.updateHealthScore(matter.id);

      console.log(`[Lifecycle] Matter ${matter.matter_number} initialized successfully`);
    } catch (error) {
      console.error(`[Lifecycle] Error in onMatterCreated:`, error);
      throw error;
    }
  }

  /**
   * Handle status change lifecycle
   */
  async onStatusChanged(matterId, oldStatus, newStatus, userId = 'system', additionalData = {}) {
    console.log(`[Lifecycle] Status change: ${matterId} from ${oldStatus} to ${newStatus}`);

    try {
      // Get matter with playbook
      const matterResult = await this.db.query(
        `SELECT m.*, pt.template_data as playbook
         FROM matters m
         LEFT JOIN playbook_templates pt ON m.playbook_template_id = pt.id
         WHERE m.id = $1`,
        [matterId]
      );

      if (matterResult.rows.length === 0) {
        throw new Error('Matter not found');
      }

      const matter = matterResult.rows[0];
      const playbook = matter.playbook;

      if (!playbook) {
        console.warn(`[Lifecycle] No playbook for matter ${matterId}`);
        return;
      }

      // Update matter status and timestamps
      const newStatusDef = playbook.statuses.find(s => s.id === newStatus);
      await this.db.query(
        `UPDATE matters
         SET current_status = $1,
             current_lane = $2,
             status_changed_at = CURRENT_TIMESTAMP,
             sla_breach_at = NULL
         WHERE id = $3`,
        [newStatus, newStatusDef.lane, matterId]
      );

      // Handle defect reason if status requires it
      if (newStatusDef.requires_defect_reason && additionalData.defect_reason_id) {
        await this.db.query(
          `UPDATE matters SET defect_count = defect_count + 1, return_count = return_count + 1 WHERE id = $1`,
          [matterId]
        );
      }

      // Run automation engine
      await this.automationEngine.onStatusChanged(
        { ...matter, current_status: newStatus, current_lane: newStatusDef.lane },
        oldStatus,
        newStatus,
        playbook,
        userId
      );

      // Update health score
      await this.updateHealthScore(matterId);

      // Check and flag SLA if needed
      await this.checkAndFlagSLA(matterId, playbook);

      console.log(`[Lifecycle] Status change processed for ${matter.matter_number}`);
    } catch (error) {
      console.error(`[Lifecycle] Error in onStatusChanged:`, error);
      throw error;
    }
  }

  /**
   * Handle artifact upload lifecycle
   */
  async onArtifactUploaded(artifact, userId = 'system') {
    console.log(`[Lifecycle] Artifact uploaded: ${artifact.id} for matter ${artifact.matter_id}`);

    try {
      // Get matter with playbook
      const matterResult = await this.db.query(
        `SELECT m.*, pt.template_data as playbook
         FROM matters m
         LEFT JOIN playbook_templates pt ON m.playbook_template_id = pt.id
         WHERE m.id = $1`,
        [artifact.matter_id]
      );

      if (matterResult.rows.length === 0) {
        return;
      }

      const matter = matterResult.rows[0];
      const playbook = matter.playbook;

      if (playbook) {
        // Run automation for artifact update
        await this.automationEngine.onArtifactUpdated(artifact, matter, playbook, userId);
      }

      // Update health score (missing artifacts affects score)
      await this.updateHealthScore(artifact.matter_id);
    } catch (error) {
      console.error(`[Lifecycle] Error in onArtifactUploaded:`, error);
      throw error;
    }
  }

  /**
   * Update matter health score
   */
  async updateHealthScore(matterId) {
    try {
      // Get matter
      const matterResult = await this.db.query(
        `SELECT m.*, pt.template_data as playbook
         FROM matters m
         LEFT JOIN playbook_templates pt ON m.playbook_template_id = pt.id
         WHERE m.id = $1`,
        [matterId]
      );

      if (matterResult.rows.length === 0) {
        return;
      }

      const matter = matterResult.rows[0];
      const playbook = matter.playbook;

      if (!playbook) {
        return;
      }

      // Get tasks
      const tasksResult = await this.db.query(
        'SELECT * FROM tasks WHERE matter_id = $1',
        [matterId]
      );

      // Get artifacts with type codes
      const artifactsResult = await this.db.query(
        `SELECT a.*, at.code as artifact_type_code
         FROM artifacts a
         JOIN artifact_types at ON a.artifact_type_id = at.id
         WHERE a.matter_id = $1`,
        [matterId]
      );

      // Calculate health score
      const healthData = calculateMatterHealthScore(
        matter,
        tasksResult.rows,
        artifactsResult.rows,
        playbook
      );

      // Update matter
      await this.db.query(
        `UPDATE matters
         SET health_score = $1,
             health_risk_tier = $2,
             health_drivers = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          healthData.score,
          healthData.riskTier,
          JSON.stringify(healthData.drivers),
          matterId
        ]
      );

      console.log(`[Lifecycle] Health score updated for matter ${matter.matter_number}: ${healthData.score} (${healthData.riskTier})`);
    } catch (error) {
      console.error(`[Lifecycle] Error updating health score:`, error);
    }
  }

  /**
   * Check and flag SLA breaches
   */
  async checkAndFlagSLA(matterId, playbook) {
    try {
      const matterResult = await this.db.query(
        'SELECT * FROM matters WHERE id = $1',
        [matterId]
      );

      if (matterResult.rows.length === 0) {
        return;
      }

      const matter = matterResult.rows[0];

      // Get current status definition
      const currentStatusDef = playbook.statuses.find(s => s.id === matter.current_status);

      if (!currentStatusDef || !currentStatusDef.sla_hours) {
        return;
      }

      // Check if SLA exceeded
      const statusChangedAt = new Date(matter.status_changed_at);
      const now = new Date();
      const hoursInStatus = (now - statusChangedAt) / (1000 * 60 * 60);

      if (hoursInStatus > currentStatusDef.sla_hours && !matter.sla_breach_at) {
        // Flag SLA breach
        await this.db.query(
          `UPDATE matters SET sla_breach_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [matterId]
        );

        // Run SLA breach automation
        await this.automationEngine.onSLABreach(matter, playbook, 'system');

        console.log(`[Lifecycle] SLA breach flagged for matter ${matter.matter_number}`);
      }
    } catch (error) {
      console.error(`[Lifecycle] Error checking SLA:`, error);
    }
  }

  /**
   * Periodic SLA check for all open matters (called by sweeper)
   */
  async checkAllSLAs() {
    console.log('[Lifecycle] Running SLA sweep...');

    try {
      // Get all open matters with playbooks
      const mattersResult = await this.db.query(
        `SELECT m.id, m.matter_number, m.current_status, m.status_changed_at,
                m.sla_breach_at, pt.template_data as playbook
         FROM matters m
         LEFT JOIN playbook_templates pt ON m.playbook_template_id = pt.id
         WHERE m.closed_at IS NULL
           AND m.is_archived = false
           AND pt.template_data IS NOT NULL`
      );

      let breachCount = 0;

      for (const matter of mattersResult.rows) {
        const playbook = matter.playbook;
        const currentStatusDef = playbook.statuses.find(s => s.id === matter.current_status);

        if (!currentStatusDef || !currentStatusDef.sla_hours) {
          continue;
        }

        const statusChangedAt = new Date(matter.status_changed_at);
        const now = new Date();
        const hoursInStatus = (now - statusChangedAt) / (1000 * 60 * 60);

        if (hoursInStatus > currentStatusDef.sla_hours && !matter.sla_breach_at) {
          await this.db.query(
            `UPDATE matters SET sla_breach_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [matter.id]
          );

          await this.automationEngine.onSLABreach(matter, playbook, 'system');

          breachCount++;
        }
      }

      console.log(`[Lifecycle] SLA sweep complete: ${breachCount} new breaches flagged`);

      return {
        checked: mattersResult.rows.length,
        breached: breachCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Lifecycle] Error in SLA sweep:', error);
      throw error;
    }
  }
}

module.exports = { MatterLifecycle };
