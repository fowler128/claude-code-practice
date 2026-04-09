/**
 * Agent Orchestrator Service
 * Manages agent execution, sub-agent coordination, and governance
 */

const { v4: uuidv4 } = require('uuid');

class AgentOrchestrator {
  constructor(db, eventLogger) {
    this.db = db;
    this.eventLogger = eventLogger;
  }

  /**
   * Execute an agent with full orchestration
   */
  async executeAgent(agentId, workOrderId, inputData, userId = 'system') {
    const startTime = Date.now();

    // Get agent definition
    const agentResult = await this.db.query(
      'SELECT * FROM agent_directory WHERE id = $1 AND is_active = true',
      [agentId]
    );

    if (agentResult.rows.length === 0) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const agent = agentResult.rows[0];

    // Check governance rules
    const governanceCheck = await this.checkGovernance(agent, inputData, 'full_agent');

    // Log agent run start
    const runLogId = await this.logAgentRun({
      work_order_id: workOrderId,
      agent_id: agentId,
      run_type: 'full_agent',
      execution_status: 'started',
      input_data: inputData,
      model_name: agent.default_model,
      user_id: userId,
      governance_check_passed: governanceCheck.passed,
      governance_violations: governanceCheck.violations
    });

    try {
      // Check if requires approval
      if (agent.requires_human_approval || !governanceCheck.passed) {
        await this.db.query(
          `UPDATE work_orders
           SET status = 'awaiting_approval', requires_approval = true
           WHERE id = $1`,
          [workOrderId]
        );

        await this.logAgentRun({
          id: runLogId,
          execution_status: 'completed',
          human_approval_required: true,
          completed_at: new Date()
        }, true);

        return {
          status: 'awaiting_approval',
          requires_approval: true,
          governance_violations: governanceCheck.violations,
          run_log_id: runLogId
        };
      }

      // Get sub-agents
      const subAgentsResult = await this.db.query(
        `SELECT * FROM sub_agent_directory
         WHERE parent_agent_id = $1 AND is_active = true
         ORDER BY execution_order ASC`,
        [agentId]
      );

      const subAgents = subAgentsResult.rows;
      let aggregatedOutput = {};

      // Execute sub-agents
      if (subAgents.length > 0 && agent.can_trigger_sub_agents) {
        aggregatedOutput = await this.executeSubAgents(
          subAgents,
          inputData,
          workOrderId,
          userId
        );
      } else {
        // Execute main agent directly (simulate for now)
        aggregatedOutput = await this.executeAgentDirect(agent, inputData);
      }

      const executionTime = Date.now() - startTime;

      // Update agent performance stats
      await this.updateAgentStats(agentId, true, executionTime);

      // Complete run log
      await this.logAgentRun({
        id: runLogId,
        execution_status: 'completed',
        output_data: aggregatedOutput,
        execution_time_ms: executionTime,
        completed_at: new Date()
      }, true);

      // Update work order
      await this.db.query(
        `UPDATE work_orders
         SET status = 'completed',
             output_data = $1,
             completed_at = CURRENT_TIMESTAMP,
             execution_time_ms = $2
         WHERE id = $3`,
        [JSON.stringify(aggregatedOutput), executionTime, workOrderId]
      );

      return {
        status: 'completed',
        output: aggregatedOutput,
        execution_time_ms: executionTime,
        run_log_id: runLogId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Update agent performance stats
      await this.updateAgentStats(agentId, false, executionTime);

      // Log failure
      await this.logAgentRun({
        id: runLogId,
        execution_status: 'failed',
        error_message: error.message,
        execution_time_ms: executionTime,
        completed_at: new Date()
      }, true);

      // Update work order
      await this.db.query(
        `UPDATE work_orders
         SET status = 'failed', error_message = $1
         WHERE id = $2`,
        [error.message, workOrderId]
      );

      throw error;
    }
  }

  /**
   * Execute sub-agents (sequential or parallel)
   */
  async executeSubAgents(subAgents, inputData, workOrderId, userId) {
    const results = {};
    const parallelBatch = [];
    const sequentialBatch = [];

    // Separate parallel and sequential sub-agents
    for (const subAgent of subAgents) {
      if (subAgent.is_parallel) {
        parallelBatch.push(subAgent);
      } else {
        sequentialBatch.push(subAgent);
      }
    }

    // Execute parallel sub-agents first
    if (parallelBatch.length > 0) {
      const parallelResults = await Promise.all(
        parallelBatch.map(subAgent =>
          this.executeSubAgent(subAgent, inputData, workOrderId, userId, results)
        )
      );

      parallelResults.forEach((result, idx) => {
        results[parallelBatch[idx].sub_agent_name] = result;
      });
    }

    // Execute sequential sub-agents
    for (const subAgent of sequentialBatch) {
      const result = await this.executeSubAgent(
        subAgent,
        inputData,
        workOrderId,
        userId,
        results
      );
      results[subAgent.sub_agent_name] = result;
    }

    return results;
  }

  /**
   * Execute single sub-agent
   */
  async executeSubAgent(subAgent, inputData, workOrderId, userId, previousResults) {
    const startTime = Date.now();

    // Check dependencies
    if (subAgent.depends_on_sub_agents && subAgent.depends_on_sub_agents.length > 0) {
      for (const depId of subAgent.depends_on_sub_agents) {
        const depSubAgent = await this.db.query(
          'SELECT sub_agent_name FROM sub_agent_directory WHERE id = $1',
          [depId]
        );
        if (depSubAgent.rows.length > 0) {
          const depName = depSubAgent.rows[0].sub_agent_name;
          if (!previousResults[depName]) {
            throw new Error(`Dependency not met: ${depName}`);
          }
        }
      }
    }

    // Log sub-agent run start
    const runLogId = await this.logAgentRun({
      work_order_id: workOrderId,
      sub_agent_id: subAgent.id,
      run_type: 'sub_agent',
      execution_status: 'started',
      input_data: { ...inputData, previous_results: previousResults },
      model_name: subAgent.model,
      user_id: userId
    });

    try {
      // Execute sub-agent (simulate for now)
      const output = await this.executeSubAgentDirect(
        subAgent,
        inputData,
        previousResults
      );

      const executionTime = Date.now() - startTime;

      // Update sub-agent stats
      await this.db.query(
        `UPDATE sub_agent_directory
         SET total_runs = total_runs + 1,
             successful_runs = successful_runs + 1,
             avg_execution_time_ms = (
               COALESCE(avg_execution_time_ms, 0) * total_runs + $1
             ) / (total_runs + 1)
         WHERE id = $2`,
        [executionTime, subAgent.id]
      );

      // Complete run log
      await this.logAgentRun({
        id: runLogId,
        execution_status: 'completed',
        output_data: output,
        execution_time_ms: executionTime,
        completed_at: new Date()
      }, true);

      return output;

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Log failure
      await this.logAgentRun({
        id: runLogId,
        execution_status: 'failed',
        error_message: error.message,
        execution_time_ms: executionTime,
        completed_at: new Date()
      }, true);

      // Retry if enabled
      if (subAgent.retry_on_failure && subAgent.max_retries > 0) {
        console.log(`Retrying sub-agent: ${subAgent.sub_agent_name}`);
        // Implement retry logic here
      }

      throw error;
    }
  }

  /**
   * Check governance rules
   */
  async checkGovernance(agent, inputData, runType) {
    const rulesResult = await this.db.query(
      `SELECT * FROM governance_rules
       WHERE is_active = true
       ORDER BY priority DESC`
    );

    const violations = [];
    let passed = true;

    for (const rule of rulesResult.rows) {
      // Check if rule applies to this agent
      const appliesToAgent =
        rule.applies_to_agent_types.includes('*') ||
        rule.applies_to_agent_types.includes(agent.agent_type);

      if (!appliesToAgent) continue;

      // Apply rule logic (simplified for now)
      const ruleConfig = rule.rule_config;

      switch (rule.rule_type) {
        case 'approval_gate':
          if (agent.risk_tier === 'high' || agent.requires_human_approval) {
            violations.push({
              rule_id: rule.id,
              rule_name: rule.rule_name,
              severity: rule.severity,
              action: rule.on_violation,
              message: `High risk agent requires approval: ${rule.description}`
            });
            if (rule.on_violation === 'block' || rule.on_violation === 'require_approval') {
              passed = false;
            }
          }
          break;

        case 'content_filter':
          // Check for PII, profanity, etc. (simplified)
          if (this.containsBlockedContent(inputData, ruleConfig)) {
            violations.push({
              rule_id: rule.id,
              rule_name: rule.rule_name,
              severity: rule.severity,
              action: rule.on_violation,
              message: `Content filter triggered: ${rule.description}`
            });
            if (rule.on_violation === 'block') {
              passed = false;
            }
          }
          break;

        case 'rate_limit':
          // Check rate limits (simplified)
          const rateLimitExceeded = await this.checkRateLimit(agent.id, ruleConfig);
          if (rateLimitExceeded) {
            violations.push({
              rule_id: rule.id,
              rule_name: rule.rule_name,
              severity: rule.severity,
              action: rule.on_violation,
              message: `Rate limit exceeded: ${rule.description}`
            });
            if (rule.on_violation === 'block') {
              passed = false;
            }
          }
          break;
      }
    }

    return { passed, violations };
  }

  /**
   * Check for blocked content (simplified)
   */
  containsBlockedContent(data, ruleConfig) {
    const dataStr = JSON.stringify(data).toLowerCase();
    const patterns = ruleConfig.patterns || [];

    for (const pattern of patterns) {
      if (dataStr.includes(pattern.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check rate limit (simplified)
   */
  async checkRateLimit(agentId, ruleConfig) {
    const maxPerHour = ruleConfig.max_per_hour || 100;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await this.db.query(
      `SELECT COUNT(*) as count
       FROM agent_run_logs
       WHERE agent_id = $1 AND started_at > $2`,
      [agentId, oneHourAgo]
    );

    return parseInt(result.rows[0].count) >= maxPerHour;
  }

  /**
   * Execute agent directly (mock implementation)
   */
  async executeAgentDirect(agent, inputData) {
    // In production, this would call LLM API
    // For now, return mock output based on agent type

    console.log(`[Agent] Executing: ${agent.agent_name}`);

    await this.simulateProcessing();

    return {
      agent_name: agent.agent_name,
      status: 'success',
      message: `Executed ${agent.agent_name} with capabilities: ${JSON.stringify(agent.capabilities)}`,
      timestamp: new Date().toISOString(),
      mock: true
    };
  }

  /**
   * Execute sub-agent directly (mock implementation)
   */
  async executeSubAgentDirect(subAgent, inputData, previousResults) {
    console.log(`[Sub-Agent] Executing: ${subAgent.sub_agent_name}`);

    await this.simulateProcessing();

    // Return mock output based on task type
    const outputs = {
      analysis: { score: 85, confidence: 0.9, factors: ['factor1', 'factor2'] },
      generation: { content: 'Generated content here...', word_count: 250 },
      validation: { passed: true, issues: [], checks_performed: 5 },
      qa: { passed: true, defects_found: 0, quality_score: 95 }
    };

    return outputs[subAgent.task_type] || { status: 'completed' };
  }

  /**
   * Simulate processing delay
   */
  async simulateProcessing() {
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Log agent run
   */
  async logAgentRun(logData, isUpdate = false) {
    if (isUpdate && logData.id) {
      // Update existing log
      const fields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(logData).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(logData[key] instanceof Object ? JSON.stringify(logData[key]) : logData[key]);
          paramIndex++;
        }
      });

      values.push(logData.id);

      await this.db.query(
        `UPDATE agent_run_logs SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      return logData.id;
    } else {
      // Insert new log
      const runLogId = logData.id || uuidv4();

      await this.db.query(
        `INSERT INTO agent_run_logs (
          id, work_order_id, agent_id, sub_agent_id, run_type, execution_status,
          input_data, output_data, prompt_used, model_name, user_id,
          governance_check_passed, governance_violations, human_approval_required, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          runLogId,
          logData.work_order_id,
          logData.agent_id || null,
          logData.sub_agent_id || null,
          logData.run_type,
          logData.execution_status,
          logData.input_data ? JSON.stringify(logData.input_data) : null,
          logData.output_data ? JSON.stringify(logData.output_data) : null,
          logData.prompt_used || null,
          logData.model_name || null,
          logData.user_id || 'system',
          logData.governance_check_passed || null,
          logData.governance_violations ? JSON.stringify(logData.governance_violations) : null,
          logData.human_approval_required || false,
          logData.metadata ? JSON.stringify(logData.metadata) : null
        ]
      );

      return runLogId;
    }
  }

  /**
   * Update agent performance stats
   */
  async updateAgentStats(agentId, success, executionTimeMs) {
    await this.db.query(
      `UPDATE agent_directory
       SET total_runs = total_runs + 1,
           successful_runs = successful_runs + ${success ? 1 : 0},
           failed_runs = failed_runs + ${success ? 0 : 1},
           avg_execution_time_ms = (
             COALESCE(avg_execution_time_ms, 0) * total_runs + $1
           ) / (total_runs + 1)
       WHERE id = $2`,
      [executionTimeMs, agentId]
    );
  }

  /**
   * Approve agent run
   */
  async approveAgentRun(workOrderId, approvedBy) {
    // Get work order
    const workOrderResult = await this.db.query(
      'SELECT * FROM work_orders WHERE id = $1',
      [workOrderId]
    );

    if (workOrderResult.rows.length === 0) {
      throw new Error('Work order not found');
    }

    const workOrder = workOrderResult.rows[0];

    // Update work order
    await this.db.query(
      `UPDATE work_orders
       SET status = 'approved',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [approvedBy, workOrderId]
    );

    // Update run log
    await this.db.query(
      `UPDATE agent_run_logs
       SET human_approval_required = false
       WHERE work_order_id = $1 AND execution_status = 'completed'`,
      [workOrderId]
    );

    // If agent can send externally, mark as allowed
    if (workOrder.agent_id) {
      const agentResult = await this.db.query(
        'SELECT can_send_external FROM agent_directory WHERE id = $1',
        [workOrder.agent_id]
      );

      if (agentResult.rows[0]?.can_send_external) {
        // Mark as ready for external send
        console.log(`[Agent] Approved for external send: WO-${workOrder.work_order_number}`);
      }
    }

    return { status: 'approved' };
  }

  /**
   * Reject agent run
   */
  async rejectAgentRun(workOrderId, rejectedBy, reason) {
    await this.db.query(
      `UPDATE work_orders
       SET status = 'rejected',
           approved_by = $1,
           rejection_reason = $2,
           approved_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [rejectedBy, reason, workOrderId]
    );

    return { status: 'rejected', reason };
  }
}

module.exports = { AgentOrchestrator };
