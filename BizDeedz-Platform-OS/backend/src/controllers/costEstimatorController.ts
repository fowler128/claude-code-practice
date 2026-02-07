import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';
import * as TokenEstimator from '../services/tokenEstimatorService';

/**
 * POST /api/work-orders/:work_order_id/estimate
 * Generate a preflight cost and token estimate
 */
export async function createEstimate(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { work_order_id } = req.params;
    const {
      max_output_tokens = 1000,
      expected_turns = 1,
      max_turns = 1,
      safety_margin = 1.2,
    } = req.body;

    await client.query('BEGIN');

    // Get work order details
    const woResult = await client.query(
      `SELECT wo.*, ad.agent_name, sa.prompt_template, sa.model_preference
       FROM work_orders wo
       LEFT JOIN agent_directory ad ON wo.agent_id = ad.agent_id
       LEFT JOIN sub_agent_directory sa ON wo.agent_id = sa.parent_agent_id
       WHERE wo.work_order_id = $1`,
      [work_order_id]
    );

    if (woResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const workOrder = woResult.rows[0];

    // Get prompt pack for this work order type
    const promptPackResult = await client.query(
      `SELECT * FROM prompt_packs
       WHERE category = $1 AND is_active = true
       ORDER BY created_at DESC LIMIT 1`,
      [workOrder.order_type]
    );

    let systemPrompt = '';
    let userPromptTemplate = '';
    let model = workOrder.model_preference || 'gpt-4-turbo';

    if (promptPackResult.rows.length > 0) {
      const promptPack = promptPackResult.rows[0];
      systemPrompt = promptPack.system_prompt || '';
      userPromptTemplate = promptPack.user_prompt_template || '';
      model = promptPack.recommended_model || model;
    }

    // Assemble user prompt with input data
    const inputData = workOrder.input_data || {};
    let userPrompt = userPromptTemplate;

    // Simple variable substitution (in production, use a proper template engine)
    Object.keys(inputData).forEach((key) => {
      const placeholder = `{{${key}}}`;
      userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), String(inputData[key]));
    });

    // If no template, use input data as JSON
    if (!userPrompt || userPrompt === userPromptTemplate) {
      userPrompt = `Task: ${workOrder.order_type}\n\nInput:\n${JSON.stringify(inputData, null, 2)}`;
    }

    // Get context snippet if this is related to a matter
    let contextSnippet = '';
    if (workOrder.matter_id) {
      const matterResult = await client.query(
        'SELECT client_name, practice_area_id, matter_type_id, status FROM matters WHERE matter_id = $1',
        [workOrder.matter_id]
      );

      if (matterResult.rows.length > 0) {
        const matter = matterResult.rows[0];
        contextSnippet = `Matter: ${matter.client_name}\nPractice Area: ${matter.practice_area_id}\nType: ${matter.matter_type_id}\nStatus: ${matter.status}`;
      }
    }

    // Create comprehensive estimate
    const estimate = await TokenEstimator.createComprehensiveEstimate(
      systemPrompt,
      userPrompt,
      model,
      {
        contextSnippet,
        maxOutputTokens: max_output_tokens,
        expectedTurns: expected_turns,
        maxTurns: max_turns,
        safetyMargin: safety_margin,
      }
    );

    // Save estimate to database
    const estimateResult = await client.query(
      `INSERT INTO work_order_estimates (
        work_order_id, assembled_prompt_length, model,
        estimated_input_tokens, estimated_output_tokens, safety_margin,
        expected_total_tokens, worst_case_tokens,
        input_token_price, output_token_price,
        estimated_cost_usd, worst_case_cost_usd,
        max_output_tokens, expected_turns, max_turns,
        within_per_run_limit, within_daily_budget,
        daily_budget_remaining, blocking_reason,
        estimate_method, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        work_order_id,
        estimate.metadata.assembledPromptLength,
        estimate.metadata.model,
        estimate.tokenEstimate.inputTokens,
        estimate.tokenEstimate.outputTokens,
        estimate.metadata.safetyMargin,
        estimate.tokenEstimate.totalTokens,
        estimate.metadata.worstCaseTokens,
        (await TokenEstimator.getModelPricing(model))?.input_price_per_1k || 0,
        (await TokenEstimator.getModelPricing(model))?.output_price_per_1k || 0,
        estimate.costEstimate.totalCost,
        estimate.costEstimate.worstCaseCost,
        estimate.metadata.maxOutputTokens,
        expected_turns,
        max_turns,
        estimate.budgetCheck.withinPerRunLimit,
        estimate.budgetCheck.withinDailyBudget,
        estimate.budgetCheck.dailyBudgetRemaining,
        estimate.budgetCheck.blockingReason,
        estimate.tokenEstimate.method,
        req.user?.user_id,
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      estimate_id: estimateResult.rows[0].estimate_id,
      work_order_id,
      tokens: {
        input: estimate.tokenEstimate.inputTokens,
        output: estimate.tokenEstimate.outputTokens,
        total: estimate.tokenEstimate.totalTokens,
        worst_case: estimate.metadata.worstCaseTokens,
      },
      cost: {
        estimated: estimate.costEstimate.totalCost,
        worst_case: estimate.costEstimate.worstCaseCost,
        currency: 'USD',
      },
      budget_status: {
        within_per_run_limit: estimate.budgetCheck.withinPerRunLimit,
        within_daily_budget: estimate.budgetCheck.withinDailyBudget,
        daily_budget_remaining: estimate.budgetCheck.dailyBudgetRemaining,
        blocking_reason: estimate.budgetCheck.blockingReason,
        can_proceed: estimate.budgetCheck.withinPerRunLimit && estimate.budgetCheck.withinDailyBudget,
      },
      metadata: {
        model: estimate.metadata.model,
        safety_margin: estimate.metadata.safetyMargin,
        estimate_method: estimate.tokenEstimate.method,
        prompt_length: estimate.metadata.assembledPromptLength,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create estimate error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
}

/**
 * POST /api/work-orders/:work_order_id/execute
 * Execute work order with budget gate enforcement
 */
export async function executeWorkOrder(req: AuthRequest, res: Response) {
  const client = await pool.connect();

  try {
    const { work_order_id } = req.params;
    const { override_approval = false, override_reason = '' } = req.body;

    await client.query('BEGIN');

    // Get most recent estimate (within last 24 hours)
    const estimateResult = await client.query(
      `SELECT * FROM work_order_estimates
       WHERE work_order_id = $1
       AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 1`,
      [work_order_id]
    );

    if (estimateResult.rows.length === 0) {
      return res.status(400).json({
        error: 'No recent estimate found',
        message: 'Please create an estimate first using POST /api/work-orders/:id/estimate',
      });
    }

    const estimate = estimateResult.rows[0];

    // Check budget gates
    if (!estimate.within_per_run_limit || !estimate.within_daily_budget) {
      // Check if user has override permission
      const canOverride = req.user?.role === 'admin' || req.user?.role === 'attorney';

      if (!override_approval || !canOverride) {
        return res.status(409).json({
          error: 'Budget limit exceeded',
          blocking_reason: estimate.blocking_reason,
          estimate: {
            estimated_cost: estimate.estimated_cost_usd,
            worst_case_cost: estimate.worst_case_cost_usd,
            daily_budget_remaining: estimate.daily_budget_remaining,
          },
          can_override: canOverride,
          message: canOverride
            ? 'Set override_approval=true and provide override_reason to proceed'
            : 'Contact an administrator for budget override approval',
        });
      }

      // Log override
      console.log(`Budget override approved by ${req.user?.email}: ${override_reason}`);
    }

    // Get work order
    const woResult = await client.query(
      'SELECT * FROM work_orders WHERE work_order_id = $1',
      [work_order_id]
    );

    if (woResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const workOrder = woResult.rows[0];

    // Create execution record
    const executionResult = await client.query(
      `INSERT INTO work_order_executions (
        work_order_id, estimate_id, status,
        override_approved_by, override_reason
      ) VALUES ($1, $2, 'started', $3, $4)
      RETURNING *`,
      [
        work_order_id,
        estimate.estimate_id,
        override_approval ? req.user?.user_id : null,
        override_approval ? override_reason : null,
      ]
    );

    const execution = executionResult.rows[0];

    // TODO: Actually execute via OpenRouter or other LLM provider
    // For now, simulate execution
    const simulatedResponse = {
      model: estimate.model,
      usage: {
        prompt_tokens: Math.floor(estimate.estimated_input_tokens * 0.95), // Slightly under estimate
        completion_tokens: Math.floor(estimate.estimated_output_tokens * 0.85),
        total_tokens: 0,
      },
      output: {
        content: `[Simulated response for ${workOrder.order_type}]`,
        status: 'completed',
      },
    };

    simulatedResponse.usage.total_tokens =
      simulatedResponse.usage.prompt_tokens + simulatedResponse.usage.completion_tokens;

    // Calculate actual cost
    const pricing = await TokenEstimator.getModelPricing(estimate.model);
    if (!pricing) {
      throw new Error(`Model pricing not found for: ${estimate.model}`);
    }

    const actualCost = TokenEstimator.calculateCost(
      simulatedResponse.usage.prompt_tokens,
      simulatedResponse.usage.completion_tokens,
      pricing
    );

    // Calculate variance
    const tokenVariance = ((simulatedResponse.usage.total_tokens - estimate.expected_total_tokens) /
                          estimate.expected_total_tokens) * 100;
    const costVariance = ((actualCost.totalCost - estimate.estimated_cost_usd) /
                         estimate.estimated_cost_usd) * 100;

    // Update execution record
    await client.query(
      `UPDATE work_order_executions SET
        completed_at = CURRENT_TIMESTAMP,
        status = 'completed',
        actual_input_tokens = $1,
        actual_output_tokens = $2,
        actual_total_tokens = $3,
        actual_cost_usd = $4,
        token_variance_pct = $5,
        cost_variance_pct = $6,
        model_used = $7,
        provider = 'simulated',
        response_data = $8,
        execution_duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) * 1000
       WHERE execution_id = $9`,
      [
        simulatedResponse.usage.prompt_tokens,
        simulatedResponse.usage.completion_tokens,
        simulatedResponse.usage.total_tokens,
        actualCost.totalCost,
        tokenVariance.toFixed(2),
        costVariance.toFixed(2),
        estimate.model,
        JSON.stringify(simulatedResponse.output),
        execution.execution_id,
      ]
    );

    // Update work order status
    await client.query(
      `UPDATE work_orders SET
        status = 'completed',
        output_data = $1,
        actual_cost = $2,
        tokens_used = $3,
        completed_at = CURRENT_TIMESTAMP
       WHERE work_order_id = $4`,
      [
        JSON.stringify(simulatedResponse.output),
        actualCost.totalCost,
        simulatedResponse.usage.total_tokens,
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
      ) VALUES ($1, $2, 'on_demand', 'completed', $3, CURRENT_TIMESTAMP, $4, $5, $6, $7, $8, $9, $10)`,
      [
        work_order_id,
        workOrder.agent_id,
        execution.started_at,
        workOrder.input_data,
        simulatedResponse.output,
        simulatedResponse.usage.prompt_tokens,
        simulatedResponse.usage.completion_tokens,
        simulatedResponse.usage.total_tokens,
        actualCost.totalCost,
        estimate.model,
      ]
    );

    await client.query('COMMIT');

    res.json({
      execution_id: execution.execution_id,
      work_order_id,
      status: 'completed',
      estimate_comparison: {
        estimated_tokens: estimate.expected_total_tokens,
        actual_tokens: simulatedResponse.usage.total_tokens,
        token_variance_pct: tokenVariance.toFixed(2),
        estimated_cost: estimate.estimated_cost_usd,
        actual_cost: actualCost.totalCost,
        cost_variance_pct: costVariance.toFixed(2),
      },
      usage: simulatedResponse.usage,
      cost: {
        total: actualCost.totalCost,
        input: actualCost.inputCost,
        output: actualCost.outputCost,
        currency: 'USD',
      },
      output: simulatedResponse.output,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Execute work order error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/work-orders/:work_order_id/estimates
 * Get all estimates for a work order
 */
export async function getEstimates(req: AuthRequest, res: Response) {
  try {
    const { work_order_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM work_order_estimates
       WHERE work_order_id = $1
       ORDER BY created_at DESC`,
      [work_order_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get estimates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/work-orders/:work_order_id/executions
 * Get all executions for a work order
 */
export async function getExecutions(req: AuthRequest, res: Response) {
  try {
    const { work_order_id } = req.params;

    const result = await pool.query(
      `SELECT we.*, woe.estimated_cost_usd, woe.worst_case_cost_usd
       FROM work_order_executions we
       LEFT JOIN work_order_estimates woe ON we.estimate_id = woe.estimate_id
       WHERE we.work_order_id = $1
       ORDER BY we.started_at DESC`,
      [work_order_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/daily-budget
 * Get current daily budget status
 */
export async function getDailyBudgetStatus(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      `SELECT * FROM daily_budget_tracking
       WHERE tracking_date = CURRENT_DATE`,
      []
    );

    let budgetStatus;
    if (result.rows.length === 0) {
      // No tracking for today yet
      budgetStatus = {
        tracking_date: new Date().toISOString().split('T')[0],
        daily_limit: 100.00,
        warning_threshold: 80.00,
        total_actual_spend: 0.00,
        total_estimated_spend: 0.00,
        remaining: 100.00,
        utilization_pct: 0.00,
        status: 'healthy',
      };
    } else {
      const tracking = result.rows[0];
      const spent = tracking.total_actual_spend || tracking.total_estimated_spend || 0;
      const remaining = Math.max(0, tracking.daily_limit - spent);
      const utilizationPct = (spent / tracking.daily_limit) * 100;

      let status = 'healthy';
      if (utilizationPct >= 100) {
        status = 'exceeded';
      } else if (utilizationPct >= tracking.warning_threshold / tracking.daily_limit * 100) {
        status = 'warning';
      }

      budgetStatus = {
        ...tracking,
        remaining: remaining.toFixed(2),
        utilization_pct: utilizationPct.toFixed(2),
        status,
      };
    }

    res.json(budgetStatus);
  } catch (error) {
    console.error('Get daily budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
