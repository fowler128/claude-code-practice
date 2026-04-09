/**
 * Automation Engine
 * Handles trigger-action rules from playbook templates
 */

const { v4: uuidv4 } = require('uuid');

class AutomationEngine {
  constructor(db, eventLogger) {
    this.db = db;
    this.eventLogger = eventLogger;
  }

  /**
   * Execute automations for matter creation
   */
  async onMatterCreated(matter, playbook) {
    console.log(`[Automation] Matter created: ${matter.id}`);

    const rules = this.getRulesByTrigger(playbook, 'matter_created');

    for (const rule of rules) {
      await this.executeRule(rule, { matter, playbook });
    }

    // Set initial status from playbook
    const initialStatus = playbook.statuses.find(s => s.is_initial);
    if (initialStatus) {
      await this.db.query(
        `UPDATE matters SET current_status = $1, current_lane = $2 WHERE id = $3`,
        [initialStatus.id, initialStatus.lane, matter.id]
      );
    }
  }

  /**
   * Execute automations for status changes
   */
  async onStatusChanged(matter, oldStatus, newStatus, playbook, userId) {
    console.log(`[Automation] Status changed: ${oldStatus} -> ${newStatus}`);

    // Log event
    await this.eventLogger.logEvent({
      matter_id: matter.id,
      event_type: 'status_change',
      event_category: 'workflow',
      title: `Status changed to ${newStatus}`,
      old_value: { status: oldStatus },
      new_value: { status: newStatus },
      actor_id: userId
    });

    // Find rules for this status change
    const rules = this.getRulesByTrigger(playbook, 'status_changed_to', newStatus);

    for (const rule of rules) {
      await this.executeRule(rule, { matter, playbook, oldStatus, newStatus, userId });
    }

    // Update status_changed_at timestamp
    await this.db.query(
      `UPDATE matters SET status_changed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [matter.id]
    );

    // Check if status requires defect reason
    const statusDef = playbook.statuses.find(s => s.id === newStatus);
    if (statusDef?.requires_defect_reason) {
      // This should be validated before status change, but log warning if missing
      console.warn(`[Automation] Status ${newStatus} requires defect reason`);
    }
  }

  /**
   * Execute automations for SLA breaches
   */
  async onSLABreach(matter, playbook, userId) {
    console.log(`[Automation] SLA breach detected: ${matter.id}`);

    // Log event
    await this.eventLogger.logEvent({
      matter_id: matter.id,
      event_type: 'sla_breach',
      event_category: 'workflow',
      title: 'SLA breach detected',
      description: `Matter has exceeded SLA threshold for status ${matter.current_status}`,
      actor_id: 'system'
    });

    // Check for missing artifacts condition
    const artifacts = await this.db.query(
      `SELECT a.*, at.code as artifact_type_code
       FROM artifacts a
       JOIN artifact_types at ON a.artifact_type_id = at.id
       WHERE a.matter_id = $1`,
      [matter.id]
    );

    const requiredArtifacts = playbook.required_artifacts.filter(ra =>
      ra.required_at_status.includes(matter.current_status)
    );

    const missingArtifacts = requiredArtifacts.filter(required => {
      const hasArtifact = artifacts.rows.find(a =>
        a.artifact_type_code === required.artifact_type &&
        ['received', 'validated'].includes(a.status)
      );
      return !hasArtifact;
    });

    const hasMissingArtifacts = missingArtifacts.length > 0;

    // Find SLA breach rules
    const rules = this.getRulesByTrigger(playbook, 'sla_breach');

    for (const rule of rules) {
      // Check conditions
      if (rule.conditions?.missing_artifacts && !hasMissingArtifacts) {
        continue; // Skip if condition not met
      }

      await this.executeRule(rule, { matter, playbook, userId });
    }

    // Update sla_breach_at timestamp
    await this.db.query(
      `UPDATE matters SET sla_breach_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [matter.id]
    );
  }

  /**
   * Execute automations for AI run creation
   */
  async onAIRunCreated(aiRun, matter, playbook, userId) {
    console.log(`[Automation] AI run created: ${aiRun.id}, risk: ${aiRun.risk_level}`);

    // Find AI approval rules
    const rules = this.getRulesByTrigger(playbook, 'ai_run_created');

    for (const rule of rules) {
      // Check risk level conditions
      if (rule.conditions?.risk_level) {
        if (!rule.conditions.risk_level.includes(aiRun.risk_level)) {
          continue; // Skip if risk level doesn't match
        }
      }

      await this.executeRule(rule, { aiRun, matter, playbook, userId });
    }
  }

  /**
   * Execute automations for artifact updates
   */
  async onArtifactUpdated(artifact, matter, playbook, userId) {
    console.log(`[Automation] Artifact updated: ${artifact.id}`);

    // Log event
    await this.eventLogger.logEvent({
      matter_id: matter.id,
      event_type: 'artifact_uploaded',
      event_category: 'document',
      title: `Artifact uploaded: ${artifact.name}`,
      related_artifact_id: artifact.id,
      actor_id: userId
    });

    // Check if all required artifacts are now complete
    const artifacts = await this.db.query(
      `SELECT a.*, at.code as artifact_type_code
       FROM artifacts a
       JOIN artifact_types at ON a.artifact_type_id = at.id
       WHERE a.matter_id = $1`,
      [matter.id]
    );

    const requiredArtifacts = playbook.required_artifacts.filter(ra =>
      ra.required_at_status.includes(matter.current_status)
    );

    const allComplete = requiredArtifacts.every(required => {
      return artifacts.rows.find(a =>
        a.artifact_type_code === required.artifact_type &&
        ['received', 'validated'].includes(a.status)
      );
    });

    if (allComplete) {
      await this.eventLogger.logEvent({
        matter_id: matter.id,
        event_type: 'artifacts_complete',
        event_category: 'workflow',
        title: 'All required artifacts received',
        actor_id: 'system'
      });
    }
  }

  /**
   * Get automation rules by trigger type
   */
  getRulesByTrigger(playbook, triggerType, triggerStatus = null) {
    if (!playbook.automation_rules) {
      return [];
    }

    return playbook.automation_rules.filter(rule => {
      if (rule.trigger !== triggerType) {
        return false;
      }

      if (triggerStatus && rule.trigger_status) {
        return rule.trigger_status === triggerStatus;
      }

      return true;
    });
  }

  /**
   * Execute a single automation rule
   */
  async executeRule(rule, context) {
    console.log(`[Automation] Executing rule: ${rule.rule_id}`);

    for (const action of rule.actions) {
      try {
        await this.executeAction(action, context);
      } catch (error) {
        console.error(`[Automation] Error executing action ${action.type}:`, error);
        // Continue with other actions even if one fails
      }
    }
  }

  /**
   * Execute a single action
   */
  async executeAction(action, context) {
    const { matter, playbook, userId } = context;

    switch (action.type) {
      case 'create_task':
        await this.createTask(action.config, matter, userId);
        break;

      case 'schedule_reminders':
        await this.scheduleReminders(action.config, matter);
        break;

      case 'escalate':
        await this.escalateMatter(action.config, matter, userId);
        break;

      case 'add_health_driver':
        // Health drivers are calculated dynamically, but we can log this
        await this.eventLogger.logEvent({
          matter_id: matter.id,
          event_type: 'health_driver_added',
          event_category: 'system',
          title: 'Health score driver added',
          description: action.config.driver,
          actor_id: 'system'
        });
        break;

      case 'require_defect_reason':
        // This is enforced at the API level, just log
        console.log('[Automation] Defect reason required for this transition');
        break;

      case 'increment_defect_count':
        await this.incrementDefectCount(matter);
        break;

      case 'require_approval':
        await this.requireApproval(action.config, context);
        break;

      case 'block_external_send':
        await this.blockExternalSend(context);
        break;

      case 'notify':
        await this.sendNotification(action.config, matter);
        break;

      default:
        console.warn(`[Automation] Unknown action type: ${action.type}`);
    }
  }

  /**
   * Create a task
   */
  async createTask(config, matter, userId) {
    const dueDate = config.due_offset_hours
      ? new Date(Date.now() + config.due_offset_hours * 60 * 60 * 1000)
      : null;

    const assignedTo = config.assign_to_previous_lane_owner
      ? matter.assigned_to
      : null;

    await this.db.query(
      `INSERT INTO tasks (
        id, matter_id, title, description, priority,
        due_date, assigned_to, status, is_automated, automation_rule_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        uuidv4(),
        matter.id,
        config.title,
        config.description || null,
        config.priority || 'medium',
        dueDate,
        assignedTo,
        'pending',
        true,
        config.rule_id || null
      ]
    );

    await this.eventLogger.logEvent({
      matter_id: matter.id,
      event_type: 'task_created',
      event_category: 'workflow',
      title: `Task created: ${config.title}`,
      actor_id: 'system'
    });
  }

  /**
   * Schedule reminders
   */
  async scheduleReminders(config, matter) {
    // In a real implementation, this would schedule background jobs
    // For now, just create reminder tasks
    for (const day of config.reminder_days) {
      const dueDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000);

      await this.db.query(
        `INSERT INTO tasks (
          id, matter_id, title, task_type, priority, due_date, status, is_automated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(),
          matter.id,
          `Follow up: ${config.reminder_type}`,
          'reminder',
          'medium',
          dueDate,
          'pending',
          true
        ]
      );
    }
  }

  /**
   * Escalate matter
   */
  async escalateMatter(config, matter, userId) {
    await this.db.query(
      `UPDATE matters
       SET escalation_count = escalation_count + 1,
           assigned_role = $1
       WHERE id = $2`,
      [config.escalate_to_role, matter.id]
    );

    await this.eventLogger.logEvent({
      matter_id: matter.id,
      event_type: 'escalation',
      event_category: 'workflow',
      title: 'Matter escalated',
      description: config.reason,
      new_value: { assigned_role: config.escalate_to_role },
      actor_id: 'system'
    });

    // Create escalation task
    await this.createTask(
      {
        title: `ESCALATED: ${config.reason}`,
        priority: 'urgent',
        due_offset_hours: 24
      },
      matter,
      userId
    );
  }

  /**
   * Increment defect count
   */
  async incrementDefectCount(matter) {
    await this.db.query(
      `UPDATE matters SET defect_count = defect_count + 1 WHERE id = $1`,
      [matter.id]
    );
  }

  /**
   * Require approval for AI run
   */
  async requireApproval(config, context) {
    const { aiRun } = context;

    await this.db.query(
      `UPDATE ai_runs
       SET requires_approval = true,
           approval_status = 'pending'
       WHERE id = $1`,
      [aiRun.id]
    );

    // Create approval task
    await this.createTask(
      {
        title: `Review AI action: ${aiRun.action_type}`,
        description: `Approval required for ${aiRun.risk_level} risk AI action`,
        priority: 'high',
        due_offset_hours: 24
      },
      context.matter,
      context.userId
    );
  }

  /**
   * Block external send for AI run
   */
  async blockExternalSend(context) {
    const { aiRun } = context;

    await this.db.query(
      `UPDATE ai_runs SET can_send_externally = false WHERE id = $1`,
      [aiRun.id]
    );

    console.log(`[Automation] External send blocked for AI run: ${aiRun.id}`);
  }

  /**
   * Send notification (stub)
   */
  async sendNotification(config, matter) {
    // In a real implementation, this would send emails/Slack messages
    console.log(`[Automation] Notification: ${config.message} to ${config.notify_roles}`);

    await this.eventLogger.logEvent({
      matter_id: matter.id,
      event_type: 'notification_sent',
      event_category: 'communication',
      title: 'Notification sent',
      description: config.message,
      metadata: { notify_roles: config.notify_roles },
      actor_id: 'system'
    });
  }
}

/**
 * Event Logger utility
 */
class EventLogger {
  constructor(db) {
    this.db = db;
  }

  async logEvent(eventData) {
    const {
      matter_id,
      event_type,
      event_category,
      title,
      description,
      related_task_id,
      related_artifact_id,
      related_ai_run_id,
      old_value,
      new_value,
      actor_id,
      actor_name,
      actor_role,
      metadata
    } = eventData;

    await this.db.query(
      `INSERT INTO events (
        id, matter_id, event_type, event_category, title, description,
        related_task_id, related_artifact_id, related_ai_run_id,
        old_value, new_value, actor_id, actor_name, actor_role, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        uuidv4(),
        matter_id,
        event_type,
        event_category || null,
        title,
        description || null,
        related_task_id || null,
        related_artifact_id || null,
        related_ai_run_id || null,
        old_value ? JSON.stringify(old_value) : null,
        new_value ? JSON.stringify(new_value) : null,
        actor_id,
        actor_name || null,
        actor_role || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
  }
}

module.exports = {
  AutomationEngine,
  EventLogger
};
