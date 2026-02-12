/**
 * Mission Control Configuration
 * Centralized config for LLM providers, pricing, and budget caps
 */

export const MISSION_CONTROL_CONFIG = {
  // LLM Provider Configuration
  providers: {
    default: 'openrouter',
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKeyEnvVar: 'OPENROUTER_API_KEY',
    },
  },

  // Model Configuration
  models: {
    default: 'moonshot/kimi-2.5',
    fallback: 'openrouter/auto', // Cheap tier fallback

    // Model routing rules
    routing: {
      cheap: 'openrouter/auto', // For structured work
      premium: 'moonshot/kimi-2.5', // For high-value outputs
    },
  },

  // LLM Pricing (per 1M tokens in USD)
  pricing: {
    'moonshot/kimi-2.5': {
      input_per_1m: 1.50,   // $1.50 per 1M input tokens
      output_per_1m: 3.00,  // $3.00 per 1M output tokens
    },
    'openrouter/auto': {
      input_per_1m: 0.10,   // $0.10 per 1M input tokens (cheap fallback)
      output_per_1m: 0.20,  // $0.20 per 1M output tokens
    },
    // Add more models as needed
    'anthropic/claude-3-haiku': {
      input_per_1m: 0.25,
      output_per_1m: 1.25,
    },
    'openai/gpt-3.5-turbo': {
      input_per_1m: 0.50,
      output_per_1m: 1.50,
    },
  },

  // Hard Budget Constraints (USD)
  budgets: {
    daily_cap_usd: 5.00,           // Global daily cap
    per_work_order_cap_usd: 0.25,  // Per work order unless approved
    per_agent_cap_usd: 1.00,       // Per agent per day unless approved
    warning_threshold: 0.80,        // Alert at 80% of cap
  },

  // Work Type Limits
  workTypeLimits: {
    lead_scoring: {
      max_output_tokens: 450,
      cost_cap_usd: 0.08,
      tier: 'cheap',
      requires_approval: false,
    },
    content_outline: {
      max_output_tokens: 700,
      cost_cap_usd: 0.10,
      tier: 'cheap',
      requires_approval: false,
    },
    content_draft: {
      max_output_tokens: 1400,
      cost_cap_usd: 0.20,
      tier: 'cheap',
      requires_approval: false,
    },
    content_qa: {
      max_output_tokens: 600,
      cost_cap_usd: 0.08,
      tier: 'cheap',
      requires_approval: false,
    },
    ops_summary: {
      max_output_tokens: 700,
      cost_cap_usd: 0.10,
      tier: 'cheap',
      requires_approval: false,
    },
    reporting_narrative: {
      max_output_tokens: 700,
      cost_cap_usd: 0.10,
      tier: 'cheap',
      requires_approval: false,
    },
    proposal_draft: {
      max_output_tokens: 1800,
      cost_cap_usd: 0.25,
      tier: 'premium',
      requires_approval: true, // Client-facing, always needs approval
    },
    // Default fallback for unknown work types
    default: {
      max_output_tokens: 1000,
      cost_cap_usd: 0.25,
      tier: 'cheap',
      requires_approval: false,
    },
  },

  // Safety margins
  estimation: {
    safety_margin: 1.15,      // 15% buffer for token estimation
    chars_per_token: 3.5,     // Conservative estimate
    max_retries: 2,           // Max retry attempts on failure
    timeout_ms: 60000,        // 60 second timeout
  },
};

/**
 * Get work type configuration
 */
export function getWorkTypeConfig(workType: string) {
  return MISSION_CONTROL_CONFIG.workTypeLimits[workType] ||
         MISSION_CONTROL_CONFIG.workTypeLimits.default;
}

/**
 * Get model for work type based on routing tier
 */
export function getModelForWorkType(workType: string): string {
  const config = getWorkTypeConfig(workType);
  const tier = config.tier || 'cheap';

  if (tier === 'premium') {
    return MISSION_CONTROL_CONFIG.models.default;
  } else {
    return MISSION_CONTROL_CONFIG.models.routing.cheap;
  }
}

/**
 * Get pricing for a model
 */
export function getModelPricing(model: string) {
  return MISSION_CONTROL_CONFIG.pricing[model] || {
    input_per_1m: 1.00,  // Default fallback
    output_per_1m: 2.00,
  };
}

/**
 * Calculate cost from token counts
 */
export function calculateCostFromTokens(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing = getModelPricing(model);

  const inputCost = (inputTokens / 1_000_000) * pricing.input_per_1m;
  const outputCost = (outputTokens / 1_000_000) * pricing.output_per_1m;

  return Number((inputCost + outputCost).toFixed(4));
}

/**
 * Estimate tokens from text (fallback method)
 */
export function estimateTokensFromText(text: string): number {
  const charsPerToken = MISSION_CONTROL_CONFIG.estimation.chars_per_token;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Apply safety margin to token estimate
 */
export function applySafetyMargin(tokens: number): number {
  const margin = MISSION_CONTROL_CONFIG.estimation.safety_margin;
  return Math.ceil(tokens * margin);
}

export default MISSION_CONTROL_CONFIG;
