import pool from '../db/connection';
import MISSION_CONTROL_CONFIG from '../config/missionControl';

export interface BudgetCheckResult {
  canProceed: boolean;
  blockingReasons: string[];
  budgetStatus: {
    dailySpent: number;
    dailyLimit: number;
    dailyRemaining: number;
    agentSpent: number;
    agentLimit: number;
    agentRemaining: number;
    workOrderEstimate: number;
    workOrderCap: number;
  };
}

/**
 * Get total spend today (from agent_run_logs)
 */
export async function getTodaySpend(): Promise<number> {
  const result = await pool.query(
    `SELECT COALESCE(SUM(cost_usd), 0) as total_spend
     FROM agent_run_logs
     WHERE DATE(started_at) = CURRENT_DATE`,
    []
  );

  return Number(result.rows[0].total_spend || 0);
}

/**
 * Get agent spend today (from agent_run_logs)
 */
export async function getAgentSpendToday(agentId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COALESCE(SUM(cost_usd), 0) as agent_spend
     FROM agent_run_logs
     WHERE agent_id = $1
     AND DATE(started_at) = CURRENT_DATE`,
    [agentId]
  );

  return Number(result.rows[0].agent_spend || 0);
}

/**
 * Check if work order can proceed within budget constraints
 */
export async function checkBudgetConstraints(
  agentId: string,
  estimatedCost: number,
  workOrderCap: number,
  isApproved: boolean = false
): Promise<BudgetCheckResult> {
  const budgets = MISSION_CONTROL_CONFIG.budgets;

  // Get current spend
  const dailySpent = await getTodaySpend();
  const agentSpent = await getAgentSpendToday(agentId);

  const dailyRemaining = budgets.daily_cap_usd - dailySpent;
  const agentRemaining = budgets.per_agent_cap_usd - agentSpent;

  const blockingReasons: string[] = [];
  let canProceed = true;

  // Check 1: Daily cap (non-negotiable)
  if (estimatedCost > dailyRemaining) {
    canProceed = false;
    blockingReasons.push(
      `Daily budget exceeded: $${estimatedCost.toFixed(4)} estimated but only $${dailyRemaining.toFixed(4)} remaining of $${budgets.daily_cap_usd} daily cap`
    );
  }

  // Check 2: Per work order cap (can be overridden with approval)
  if (!isApproved && estimatedCost > workOrderCap) {
    canProceed = false;
    blockingReasons.push(
      `Work order cap exceeded: $${estimatedCost.toFixed(4)} estimated but cap is $${workOrderCap.toFixed(4)} (requires approval)`
    );
  }

  // Check 3: Per agent cap (can be overridden with approval)
  if (!isApproved && estimatedCost > agentRemaining) {
    canProceed = false;
    blockingReasons.push(
      `Agent daily cap exceeded: $${estimatedCost.toFixed(4)} estimated but only $${agentRemaining.toFixed(4)} remaining of $${budgets.per_agent_cap_usd} agent cap (requires approval)`
    );
  }

  return {
    canProceed,
    blockingReasons,
    budgetStatus: {
      dailySpent: Number(dailySpent.toFixed(4)),
      dailyLimit: budgets.daily_cap_usd,
      dailyRemaining: Number(dailyRemaining.toFixed(4)),
      agentSpent: Number(agentSpent.toFixed(4)),
      agentLimit: budgets.per_agent_cap_usd,
      agentRemaining: Number(agentRemaining.toFixed(4)),
      workOrderEstimate: Number(estimatedCost.toFixed(4)),
      workOrderCap: Number(workOrderCap.toFixed(4)),
    },
  };
}

/**
 * Check if daily budget warning threshold reached
 */
export async function checkBudgetWarning(): Promise<{
  isWarning: boolean;
  utilizationPct: number;
  message: string | null;
}> {
  const budgets = MISSION_CONTROL_CONFIG.budgets;
  const dailySpent = await getTodaySpend();
  const utilizationPct = (dailySpent / budgets.daily_cap_usd) * 100;

  const isWarning = utilizationPct >= (budgets.warning_threshold * 100);

  let message: string | null = null;
  if (isWarning) {
    message = `Daily budget at ${utilizationPct.toFixed(1)}% ($${dailySpent.toFixed(2)} of $${budgets.daily_cap_usd})`;
  }

  return {
    isWarning,
    utilizationPct: Number(utilizationPct.toFixed(2)),
    message,
  };
}

/**
 * Get top N agents by spend today
 */
export async function getTopAgentsBySpend(limit: number = 3): Promise<Array<{
  agent_id: string;
  agent_name: string;
  total_spend: number;
  run_count: number;
}>> {
  const result = await pool.query(
    `SELECT
      arl.agent_id,
      ad.agent_name,
      COALESCE(SUM(arl.cost_usd), 0) as total_spend,
      COUNT(*) as run_count
     FROM agent_run_logs arl
     LEFT JOIN agent_directory ad ON arl.agent_id = ad.agent_id
     WHERE DATE(arl.started_at) = CURRENT_DATE
     GROUP BY arl.agent_id, ad.agent_name
     ORDER BY total_spend DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(row => ({
    agent_id: row.agent_id,
    agent_name: row.agent_name,
    total_spend: Number(row.total_spend || 0),
    run_count: parseInt(row.run_count || 0),
  }));
}

/**
 * Get spend by work type today
 */
export async function getSpendByWorkType(): Promise<Array<{
  order_type: string;
  total_spend: number;
  work_order_count: number;
  avg_cost: number;
}>> {
  const result = await pool.query(
    `SELECT
      wo.order_type,
      COALESCE(SUM(wo.actual_cost_usd), 0) as total_spend,
      COUNT(*) as work_order_count,
      COALESCE(AVG(wo.actual_cost_usd), 0) as avg_cost
     FROM work_orders wo
     WHERE DATE(wo.created_at) = CURRENT_DATE
       AND wo.actual_cost_usd IS NOT NULL
     GROUP BY wo.order_type
     ORDER BY total_spend DESC`,
    []
  );

  return result.rows.map(row => ({
    order_type: row.order_type,
    total_spend: Number(row.total_spend || 0),
    work_order_count: parseInt(row.work_order_count || 0),
    avg_cost: Number(row.avg_cost || 0),
  }));
}

/**
 * Get daily spend history (last N days)
 */
export async function getDailySpendHistory(days: number = 7): Promise<Array<{
  date: string;
  total_spend: number;
  work_order_count: number;
}>> {
  const result = await pool.query(
    `SELECT
      DATE(started_at) as date,
      COALESCE(SUM(cost_usd), 0) as total_spend,
      COUNT(DISTINCT work_order_id) as work_order_count
     FROM agent_run_logs
     WHERE started_at >= CURRENT_DATE - INTERVAL '${days} days'
     GROUP BY DATE(started_at)
     ORDER BY date DESC`,
    []
  );

  return result.rows.map(row => ({
    date: row.date,
    total_spend: Number(row.total_spend || 0),
    work_order_count: parseInt(row.work_order_count || 0),
  }));
}
