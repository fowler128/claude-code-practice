import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';
import {
  getWorkTypeConfig,
  getModelForWorkType,
  calculateCostFromTokens,
  estimateTokensFromText,
  applySafetyMargin,
} from '../config/missionControl';
import {
  checkBudgetConstraints,
  checkBudgetWarning,
  getTodaySpend,
  getTopAgentsBySpend,
  getSpendByWorkType,
  getDailySpendHistory,
} from '../services/budgetEnforcement';

/**
 * POST /api/work-orders/:work_order_id/preflight
 * Run preflight estimate and save to database
 */
export async function runPreflight(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { work_order_id } = req.params;

    await client.query('BEGIN');

    // Get work order
    const woResult = await client.query(
      `SELECT wo.*, ad.agent_name
       FROM work_orders wo
       LEFT JOIN agent_directory ad ON wo.agent_id = ad.agent_id
       WHERE wo.work_order_id = $1`,
      [work_order_id]
    );

    if (woResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const workOrder = woResult.rows[0];

    // Get work type configuration
    const workTypeConfig = getWorkTypeConfig(workOrder.order_type);
    const model = getModelForWorkType(workOrder.order_type);

    // Get prompt pack for this work type
    const promptPackResult = await client.query(
      `SELECT system_prompt, user_prompt_template
       FROM prompt_packs
       WHERE category = $1 AND is_active = true
       ORDER BY created_at DESC LIMIT 1`,
      [workOrder.order_type]
    );

    let systemPrompt = '';
    let userPrompt = '';

    if (promptPackResult.rows.length > 0) {
      const promptPack = promptPackResult.rows[0];
      systemPrompt = promptPack.system_prompt || '';
      userPrompt = promptPack.user_prompt_template || '';

      // Simple variable substitution
      const inputData = workOrder.input_data || {};
      Object.keys(inputData).forEach((key) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        userPrompt = userPrompt.replace(placeholder, String(inputData[key]));
      });
    } else {
      // Fallback: use input data as JSON
      const inputData = workOrder.input_data || {};
      userPrompt = `Task: ${workOrder.order_type}\n\nInput:\n${JSON.stringify(inputData, null, 2)}`;
    }

    // Assemble full prompt
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Estimate tokens
    const baseInputTokens = estimateTokensFromText(fullPrompt);
    const estimatedInputTokens = applySafetyMargin(baseInputTokens);
    const estimatedOutputTokens = workTypeConfig.max_output_tokens;
    const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

    // Calculate cost
    const estimatedCost = calculateCostFromTokens(
      estimatedInputTokens,
      estimatedOutputTokens,
      model
    );

    // Get cost cap
    const costCap = workTypeConfig.cost_cap_usd;

    // Check budget constraints
    const budgetCheck = await checkBudgetConstraints(
      workOrder.agent_id,
      estimatedCost,
      costCap,
      false // Not approved yet
    );

    // Determine if approval is required
    const requiresApproval =
      workTypeConfig.requires_approval ||
      !budgetCheck.canProceed;

    const preflightNotes = {
      work_type_config: workTypeConfig,
      model_selected: model,
      prompt_length: fullPrompt.length,
      budget_check: budgetCheck,
    };

    // Update work order with preflight data
    await client.query(
      `UPDATE work_orders SET
        est_tokens_input = $1,
        est_tokens_output = $2,
        est_tokens_total = $3,
        est_cost_usd = $4,
        cost_cap_usd = $5,
        model_provider = $6,
        model_name = $7,
        preflight_ran_at = CURRENT_TIMESTAMP,
        preflight_notes = $8,
        status = CASE
          WHEN $9 = true THEN 'awaiting_approval'
          ELSE status
        END,
        approval_required_reason = CASE
          WHEN $9 = true THEN $10
          ELSE approval_required_reason
        END
       WHERE work_order_id = $11`,
      [
        estimatedInputTokens,
        estimatedOutputTokens,
        estimatedTotalTokens,
        estimatedCost,
        costCap,
        'openrouter',
        model,
        JSON.stringify(preflightNotes),
        requiresApproval,
        budgetCheck.blockingReasons.join('; '),
        work_order_id,
      ]
    );

    await client.query('COMMIT');

    res.json({
      work_order_id,
      preflight_status: requiresApproval ? 'awaiting_approval' : 'ready',
      estimate: {
        input_tokens: estimatedInputTokens,
        output_tokens: estimatedOutputTokens,
        total_tokens: estimatedTotalTokens,
        estimated_cost_usd: estimatedCost,
        cost_cap_usd: costCap,
      },
      model: {
        provider: 'openrouter',
        name: model,
        tier: workTypeConfig.tier,
      },
      budget_check: budgetCheck,
      requires_approval: requiresApproval,
      can_proceed: budgetCheck.canProceed && !workTypeConfig.requires_approval,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Preflight error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
}

/**
 * POST /api/work-orders/:work_order_id/execute
 * Execute work order with inline preflight if missing
 */
export async function executeWorkOrder(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { work_order_id } = req.params;
    const { force = false } = req.body;

    await client.query('BEGIN');

    // Get work order
    const woResult = await client.query(
      `SELECT wo.*, ad.agent_name
       FROM work_orders wo
       LEFT JOIN agent_directory ad ON wo.agent_id = ad.agent_id
       WHERE wo.work_order_id = $1`,
      [work_order_id]
    );

    if (woResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const workOrder = woResult.rows[0];

    // Check if preflight ran (within last 24 hours)
    const hasRecentPreflight =
      workOrder.preflight_ran_at &&
      new Date(workOrder.preflight_ran_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (!hasRecentPreflight) {
      // Run inline preflight
      await client.query('ROLLBACK');
      await client.query('BEGIN');

      // Call preflight logic inline (same as runPreflight but without response)
      const workTypeConfig = getWorkTypeConfig(workOrder.order_type);
      const model = getModelForWorkType(workOrder.order_type);

      // Get prompt
      const promptPackResult = await client.query(
        `SELECT system_prompt, user_prompt_template
         FROM prompt_packs
         WHERE category = $1 AND is_active = true
         ORDER BY created_at DESC LIMIT 1`,
        [workOrder.order_type]
      );

      let systemPrompt = '';
      let userPrompt = '';

      if (promptPackResult.rows.length > 0) {
        const promptPack = promptPackResult.rows[0];
        systemPrompt = promptPack.system_prompt || '';
        userPrompt = promptPack.user_prompt_template || '';

        const inputData = workOrder.input_data || {};
        Object.keys(inputData).forEach((key) => {
          const placeholder = new RegExp(`{{${key}}}`, 'g');
          userPrompt = userPrompt.replace(placeholder, String(inputData[key]));
        });
      } else {
        const inputData = workOrder.input_data || {};
        userPrompt = `Task: ${workOrder.order_type}\n\nInput:\n${JSON.stringify(inputData, null, 2)}`;
      }

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const baseInputTokens = estimateTokensFromText(fullPrompt);
      const estimatedInputTokens = applySafetyMargin(baseInputTokens);
      const estimatedOutputTokens = workTypeConfig.max_output_tokens;
      const estimatedCost = calculateCostFromTokens(
        estimatedInputTokens,
        estimatedOutputTokens,
        model
      );

      const costCap = workTypeConfig.cost_cap_usd;
      const budgetCheck = await checkBudgetConstraints(
        workOrder.agent_id,
        estimatedCost,
        costCap,
        workOrder.approved_by !== null
      );

      // Update work order with preflight
      await client.query(
        `UPDATE work_orders SET
          est_tokens_input = $1,
          est_tokens_output = $2,
          est_tokens_total = $3,
          est_cost_usd = $4,
          cost_cap_usd = $5,
          model_provider = $6,
          model_name = $7,
          preflight_ran_at = CURRENT_TIMESTAMP,
          preflight_notes = $8
         WHERE work_order_id = $9`,
        [
          estimatedInputTokens,
          estimatedOutputTokens,
          estimatedInputTokens + estimatedOutputTokens,
          estimatedCost,
          costCap,
          'openrouter',
          model,
          JSON.stringify({ model_selected: model, budget_check: budgetCheck }),
          work_order_id,
        ]
      );

      // Re-fetch updated work order
      const updatedResult = await client.query(
        'SELECT * FROM work_orders WHERE work_order_id = $1',
        [work_order_id]
      );
      Object.assign(workOrder, updatedResult.rows[0]);
    }

    // Check if work order is awaiting approval
    if (workOrder.status === 'awaiting_approval' && !force && !workOrder.approved_by) {
      return res.status(409).json({
        error: 'Approval required',
        message: 'This work order requires approval before execution',
        reason: workOrder.approval_required_reason,
        estimated_cost: workOrder.est_cost_usd,
        cost_cap: workOrder.cost_cap_usd,
        can_approve: req.user?.role === 'admin' || req.user?.role === 'attorney',
      });
    }

    // Final budget check
    const finalBudgetCheck = await checkBudgetConstraints(
      workOrder.agent_id,
      workOrder.est_cost_usd,
      workOrder.cost_cap_usd,
      workOrder.approved_by !== null
    );

    if (!finalBudgetCheck.canProceed && !workOrder.approved_by) {
      await client.query(
        `UPDATE work_orders SET
          status = 'awaiting_approval',
          approval_required_reason = $1
         WHERE work_order_id = $2`,
        [finalBudgetCheck.blockingReasons.join('; '), work_order_id]
      );

      await client.query('COMMIT');

      return res.status(409).json({
        error: 'Budget limit exceeded',
        blocking_reasons: finalBudgetCheck.blockingReasons,
        budget_status: finalBudgetCheck.budgetStatus,
        message: 'Work order set to awaiting_approval. No LLM call was made.',
      });
    }

    // ========== EXECUTE LLM CALL ==========
    // TODO: Integrate with OpenRouter API
    // For now, simulate execution

    const simulatedInputTokens = Math.floor(workOrder.est_tokens_input * 0.95);
    const simulatedOutputTokens = Math.floor(workOrder.est_tokens_output * 0.80);
    const actualTotalTokens = simulatedInputTokens + simulatedOutputTokens;
    const actualCost = calculateCostFromTokens(
      simulatedInputTokens,
      simulatedOutputTokens,
      workOrder.model_name
    );

    const simulatedOutput = {
      content: `[Simulated response for ${workOrder.order_type}]`,
      metadata: {
        model: workOrder.model_name,
        provider: workOrder.model_provider,
      },
    };

    // Update work order with actuals
    await client.query(
      `UPDATE work_orders SET
        status = 'completed',
        actual_tokens_input = $1,
        actual_tokens_output = $2,
        actual_tokens_total = $3,
        actual_cost_usd = $4,
        output_data = $5,
        completed_at = CURRENT_TIMESTAMP
       WHERE work_order_id = $6`,
      [
        simulatedInputTokens,
        simulatedOutputTokens,
        actualTotalTokens,
        actualCost,
        JSON.stringify(simulatedOutput),
        work_order_id,
      ]
    );

    // Create agent run log
    await client.query(
      `INSERT INTO agent_run_logs (
        work_order_id, agent_id, run_type, status,
        started_at, completed_at,
        input_snapshot, output_snapshot,
        tokens_prompt, tokens_completion, tokens_total,
        cost_usd, model_used
      ) VALUES ($1, $2, 'on_demand', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7, $8, $9)`,
      [
        work_order_id,
        workOrder.agent_id,
        workOrder.input_data,
        simulatedOutput,
        simulatedInputTokens,
        simulatedOutputTokens,
        actualTotalTokens,
        actualCost,
        workOrder.model_name,
      ]
    );

    await client.query('COMMIT');

    const variance = {
      tokens_pct: (((actualTotalTokens - workOrder.est_tokens_total) / workOrder.est_tokens_total) * 100).toFixed(2),
      cost_pct: (((actualCost - workOrder.est_cost_usd) / workOrder.est_cost_usd) * 100).toFixed(2),
    };

    res.json({
      work_order_id,
      status: 'completed',
      estimate: {
        input_tokens: workOrder.est_tokens_input,
        output_tokens: workOrder.est_tokens_output,
        total_tokens: workOrder.est_tokens_total,
        estimated_cost_usd: workOrder.est_cost_usd,
      },
      actual: {
        input_tokens: simulatedInputTokens,
        output_tokens: simulatedOutputTokens,
        total_tokens: actualTotalTokens,
        actual_cost_usd: actualCost,
      },
      variance,
      output: simulatedOutput,
      model: {
        provider: workOrder.model_provider,
        name: workOrder.model_name,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Execute work order error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
}

/**
 * POST /api/work-orders/:work_order_id/approve
 * Approve a work order that's awaiting approval
 */
export async function approveWorkOrder(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { work_order_id } = req.params;
    const { approval_notes } = req.body;

    // Only admin and attorney can approve
    if (req.user?.role !== 'admin' && req.user?.role !== 'attorney') {
      return res.status(403).json({ error: 'Only admin or attorney can approve work orders' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE work_orders SET
        status = 'queued',
        approved_by = $1,
        approved_at = CURRENT_TIMESTAMP,
        metadata_json = jsonb_set(
          COALESCE(metadata_json, '{}'::jsonb),
          '{approval_notes}',
          $2::jsonb
        )
       WHERE work_order_id = $3
       AND status = 'awaiting_approval'
       RETURNING *`,
      [req.user?.user_id, JSON.stringify(approval_notes || ''), work_order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found or not awaiting approval' });
    }

    await client.query('COMMIT');

    res.json({
      work_order_id,
      status: 'approved',
      approved_by: req.user?.email,
      message: 'Work order approved and ready for execution',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve work order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/mission-control/dashboard
 * Get Mission Control dashboard data
 */
export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    // Get today's spend
    const todaySpend = await getTodaySpend();
    const dailyCap = 5.00;

    // Get budget warning
    const budgetWarning = await checkBudgetWarning();

    // Get top agents by spend
    const topAgents = await getTopAgentsBySpend(3);

    // Get work orders by status
    const woStatusResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM work_orders
       WHERE DATE(created_at) = CURRENT_DATE
       GROUP BY status`,
      []
    );

    // Get active work orders
    const activeWoResult = await pool.query(
      `SELECT work_order_id, work_order_number, order_type, status, est_cost_usd, created_at
       FROM work_orders
       WHERE status IN ('queued', 'in_progress', 'awaiting_approval')
       ORDER BY created_at DESC
       LIMIT 10`,
      []
    );

    // Get last heartbeat (most recent agent run)
    const heartbeatResult = await pool.query(
      'SELECT MAX(started_at) as last_heartbeat FROM agent_run_logs',
      []
    );

    res.json({
      spend: {
        today: Number(todaySpend.toFixed(4)),
        daily_cap: dailyCap,
        remaining: Number((dailyCap - todaySpend).toFixed(4)),
        utilization_pct: Number(((todaySpend / dailyCap) * 100).toFixed(2)),
        warning: budgetWarning,
      },
      top_agents: topAgents,
      work_orders: {
        by_status: woStatusResult.rows,
        active: activeWoResult.rows,
      },
      system: {
        last_heartbeat: heartbeatResult.rows[0]?.last_heartbeat || null,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mission-control/analytics
 * Get cost analytics
 */
export async function getAnalytics(req: AuthRequest, res: Response) {
  try {
    const { days = 7 } = req.query;

    const spendHistory = await getDailySpendHistory(Number(days));
    const spendByWorkType = await getSpendByWorkType();
    const topAgents = await getTopAgentsBySpend(10);

    res.json({
      spend_history: spendHistory,
      spend_by_work_type: spendByWorkType,
      top_agents: topAgents,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mission-control/cron-jobs
 * Get cron jobs status
 */
export async function getCronJobs(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      `SELECT cj.*, ad.agent_name
       FROM cron_jobs cj
       LEFT JOIN agent_directory ad ON cj.agent_id = ad.agent_id
       ORDER BY is_active DESC, next_run_at ASC`,
      []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get cron jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
