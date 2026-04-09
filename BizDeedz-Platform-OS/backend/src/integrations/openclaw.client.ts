// OpenClaw API client for agent execution
// Connects to the OpenClaw engine for autonomous agent runs

export interface OpenClawRunPayload {
  agent_name: string;
  system_prompt: string;
  tools_allowed: unknown;
  context: Record<string, unknown>;
  mode: "audit" | "draft" | "execute" | "supervise";
  tenant_id?: string;
  run_id?: string;
}

export interface OpenClawRunResult {
  status: "completed" | "needs_review" | "failed";
  output?: Record<string, unknown>;
  metrics?: {
    cost?: number;
    latency_ms?: number;
  };
  escalation?: {
    severity: "low" | "medium" | "high" | "critical";
    reason: string;
    assigned_to?: string;
    due_at?: string;
  };
  error?: string;
}

/**
 * Call OpenClaw engine to execute an agent
 * @param payload - Agent configuration and context
 * @returns Execution result with status, output, and optional escalation
 */
export async function callOpenClaw(payload: OpenClawRunPayload): Promise<OpenClawRunResult> {
  const openclawUrl = process.env.OPENCLAW_API_URL || 'http://localhost:8080';
  const openclawApiKey = process.env.OPENCLAW_API_KEY;

  try {
    const response = await fetch(`${openclawUrl}/v1/agents/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(openclawApiKey ? { 'Authorization': `Bearer ${openclawApiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenClaw API error: ${response.status} - ${errorText}`);
    }

    const result: OpenClawRunResult = await response.json();
    return result;
  } catch (error) {
    console.error('[OpenClaw] Error calling agent:', error);
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error calling OpenClaw',
    };
  }
}
