import pool from '../db/connection';

/**
 * Token Estimation Service
 * Estimates token counts for LLM inputs before execution
 */

export interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  method: 'tiktoken' | 'claude_tokenizer' | 'fallback';
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  worstCaseCost: number;
  currency: 'USD';
}

export interface ModelPricing {
  model_id: string;
  input_price_per_1k: number;
  output_price_per_1k: number;
  context_window: number;
  max_output_tokens: number;
}

/**
 * Estimate token count using fallback method (chars / 4)
 * This is a rough approximation: English text averages ~4 chars per token
 */
function estimateTokensFallback(text: string): number {
  // More conservative estimate for code/technical text
  const avgCharsPerToken = 3.5; // Slightly lower for technical content
  return Math.ceil(text.length / avgCharsPerToken);
}

/**
 * Estimate tokens using tiktoken (OpenAI models)
 * TODO: Implement when tiktoken is available
 */
function estimateTokensTiktoken(text: string, model: string): number {
  // Placeholder for tiktoken integration
  // const encoding = tiktoken.encoding_for_model(model);
  // return encoding.encode(text).length;

  // Fallback for now
  return estimateTokensFallback(text);
}

/**
 * Estimate tokens using Claude tokenizer
 * TODO: Implement when Claude tokenizer is available
 */
function estimateTokensClaude(text: string): number {
  // Placeholder for Claude tokenizer integration
  // const tokenizer = new ClaudeTokenizer();
  // return tokenizer.encode(text).length;

  // Fallback for now
  return estimateTokensFallback(text);
}

/**
 * Estimate input tokens based on model and text
 */
export function estimateInputTokens(text: string, model: string): TokenEstimate {
  let inputTokens: number;
  let method: TokenEstimate['method'];

  if (model.includes('gpt') || model.includes('openai')) {
    inputTokens = estimateTokensTiktoken(text, model);
    method = 'fallback'; // Will be 'tiktoken' when implemented
  } else if (model.includes('claude') || model.includes('anthropic')) {
    inputTokens = estimateTokensClaude(text);
    method = 'fallback'; // Will be 'claude_tokenizer' when implemented
  } else {
    inputTokens = estimateTokensFallback(text);
    method = 'fallback';
  }

  return {
    inputTokens,
    outputTokens: 0, // Set separately based on config
    totalTokens: inputTokens,
    method,
  };
}

/**
 * Get model pricing from database
 */
export async function getModelPricing(modelId: string): Promise<ModelPricing | null> {
  const result = await pool.query(
    'SELECT * FROM model_pricing WHERE model_id = $1 AND is_active = true',
    [modelId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Calculate cost based on token counts and pricing
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricing
): CostEstimate {
  const inputCost = (inputTokens / 1000) * pricing.input_price_per_1k;
  const outputCost = (outputTokens / 1000) * pricing.output_price_per_1k;
  const totalCost = inputCost + outputCost;

  // Worst case assumes max output tokens
  const worstCaseOutputCost = (pricing.max_output_tokens / 1000) * pricing.output_price_per_1k;
  const worstCaseCost = inputCost + worstCaseOutputCost;

  return {
    inputCost: Number(inputCost.toFixed(4)),
    outputCost: Number(outputCost.toFixed(4)),
    totalCost: Number(totalCost.toFixed(4)),
    worstCaseCost: Number(worstCaseCost.toFixed(4)),
    currency: 'USD',
  };
}

/**
 * Assemble the full prompt that will be sent to the model
 */
export function assemblePrompt(
  systemPrompt: string,
  userPrompt: string,
  contextSnippet?: string
): string {
  let fullPrompt = '';

  if (systemPrompt) {
    fullPrompt += `SYSTEM:\n${systemPrompt}\n\n`;
  }

  if (contextSnippet) {
    fullPrompt += `CONTEXT:\n${contextSnippet}\n\n`;
  }

  fullPrompt += `USER:\n${userPrompt}`;

  return fullPrompt;
}

/**
 * Get current daily budget remaining
 */
export async function getDailyBudgetRemaining(): Promise<number> {
  // Get today's tracking record
  const trackingResult = await pool.query(
    `SELECT daily_limit, total_actual_spend, total_estimated_spend
     FROM daily_budget_tracking
     WHERE tracking_date = CURRENT_DATE`,
    []
  );

  let dailyLimit = 100.00; // Default
  let totalSpend = 0.00;

  if (trackingResult.rows.length > 0) {
    const tracking = trackingResult.rows[0];
    dailyLimit = tracking.daily_limit;
    // Use actual spend if available, otherwise use estimated
    totalSpend = tracking.total_actual_spend || tracking.total_estimated_spend || 0;
  }

  const remaining = dailyLimit - totalSpend;
  return Math.max(0, remaining);
}

/**
 * Check if estimate is within budget limits
 */
export async function checkBudgetLimits(
  estimatedCost: number,
  worstCaseCost: number
): Promise<{
  withinPerRunLimit: boolean;
  withinDailyBudget: boolean;
  dailyBudgetRemaining: number;
  blockingReason: string | null;
}> {
  // Get per-run limit from governance rules
  const governanceResult = await pool.query(
    `SELECT rule_config FROM governance_rules
     WHERE rule_type = 'cost_limit'
     AND is_active = true
     AND rule_config->>'max_per_run' IS NOT NULL
     ORDER BY priority ASC
     LIMIT 1`
  );

  let perRunLimit = 10.00; // Default
  if (governanceResult.rows.length > 0) {
    perRunLimit = parseFloat(governanceResult.rows[0].rule_config.max_per_run);
  }

  // Get daily budget remaining
  const dailyBudgetRemaining = await getDailyBudgetRemaining();

  const withinPerRunLimit = worstCaseCost <= perRunLimit;
  const withinDailyBudget = worstCaseCost <= dailyBudgetRemaining;

  let blockingReason: string | null = null;
  if (!withinPerRunLimit) {
    blockingReason = `Worst-case cost ($${worstCaseCost.toFixed(2)}) exceeds per-run limit ($${perRunLimit.toFixed(2)})`;
  } else if (!withinDailyBudget) {
    blockingReason = `Worst-case cost ($${worstCaseCost.toFixed(2)}) exceeds remaining daily budget ($${dailyBudgetRemaining.toFixed(2)})`;
  }

  return {
    withinPerRunLimit,
    withinDailyBudget,
    dailyBudgetRemaining: Number(dailyBudgetRemaining.toFixed(2)),
    blockingReason,
  };
}

/**
 * Apply safety margin to token estimates
 */
export function applySafetyMargin(
  tokenEstimate: TokenEstimate,
  safetyMargin: number = 1.2
): TokenEstimate {
  return {
    inputTokens: Math.ceil(tokenEstimate.inputTokens * safetyMargin),
    outputTokens: Math.ceil(tokenEstimate.outputTokens * safetyMargin),
    totalTokens: Math.ceil(tokenEstimate.totalTokens * safetyMargin),
    method: tokenEstimate.method,
  };
}

/**
 * Create a comprehensive estimate for a work order
 */
export interface ComprehensiveEstimate {
  tokenEstimate: TokenEstimate;
  costEstimate: CostEstimate;
  budgetCheck: {
    withinPerRunLimit: boolean;
    withinDailyBudget: boolean;
    dailyBudgetRemaining: number;
    blockingReason: string | null;
  };
  metadata: {
    assembledPromptLength: number;
    model: string;
    safetyMargin: number;
    maxOutputTokens: number;
    worstCaseTokens: number;
  };
}

export async function createComprehensiveEstimate(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  options: {
    contextSnippet?: string;
    maxOutputTokens?: number;
    expectedTurns?: number;
    maxTurns?: number;
    safetyMargin?: number;
  } = {}
): Promise<ComprehensiveEstimate> {
  const {
    contextSnippet = '',
    maxOutputTokens = 1000,
    expectedTurns = 1,
    maxTurns = 1,
    safetyMargin = 1.2,
  } = options;

  // Assemble full prompt
  const assembledPrompt = assemblePrompt(systemPrompt, userPrompt, contextSnippet);

  // Get base token estimate
  const baseEstimate = estimateInputTokens(assembledPrompt, model);

  // Add expected output tokens
  baseEstimate.outputTokens = maxOutputTokens * expectedTurns;
  baseEstimate.totalTokens = baseEstimate.inputTokens + baseEstimate.outputTokens;

  // Apply safety margin
  const safeTokenEstimate = applySafetyMargin(baseEstimate, safetyMargin);

  // Calculate worst-case tokens (max turns with max output)
  const worstCaseTokens = baseEstimate.inputTokens +
                          (maxOutputTokens * maxTurns * safetyMargin);

  // Get model pricing
  const pricing = await getModelPricing(model);
  if (!pricing) {
    throw new Error(`Model pricing not found for: ${model}`);
  }

  // Calculate costs
  const costEstimate = calculateCost(
    safeTokenEstimate.inputTokens,
    safeTokenEstimate.outputTokens,
    pricing
  );

  // Calculate worst-case cost
  const worstCaseCostCalc = calculateCost(
    safeTokenEstimate.inputTokens,
    maxOutputTokens * maxTurns,
    pricing
  );

  // Check budget limits
  const budgetCheck = await checkBudgetLimits(
    costEstimate.totalCost,
    worstCaseCostCalc.totalCost
  );

  return {
    tokenEstimate: safeTokenEstimate,
    costEstimate: {
      ...costEstimate,
      worstCaseCost: worstCaseCostCalc.totalCost,
    },
    budgetCheck,
    metadata: {
      assembledPromptLength: assembledPrompt.length,
      model,
      safetyMargin,
      maxOutputTokens,
      worstCaseTokens: Math.ceil(worstCaseTokens),
    },
  };
}
