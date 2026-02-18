// Agents service - Business logic for agent execution
import { AgentsRepository } from './agents.repository';
import { callOpenClaw, OpenClawRunPayload } from '../../integrations/openclaw.client';
import {
  AgentRunContext,
  AgentRunMode,
  RunAgentResponseBody,
  AgentEscalationRow,
} from './agents.types';

export class AgentsService {
  constructor(private repository: AgentsRepository) {}

  /**
   * Execute an agent by name with given context
   * @param agentName - Name of the agent to run
   * @param tenantId - Optional tenant ID for multi-tenancy
   * @param context - Input context for the agent
   * @param mode - Execution mode (audit, draft, execute, supervise)
   * @param slaHours - Optional SLA override for escalation due date
   * @returns Run result with status, output, and escalations
   */
  async runAgent(
    agentName: string,
    tenantId: string | null,
    context: AgentRunContext,
    mode: AgentRunMode = 'audit',
    slaHours?: number
  ): Promise<RunAgentResponseBody> {
    // 1. Lookup agent by name
    const agent = await this.repository.getAgentByName(agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    if (!agent.is_active) {
      throw new Error(`Agent is not active: ${agentName}`);
    }

    // 2. Get latest version
    const version = await this.repository.getLatestVersion(agent.id);
    if (!version) {
      throw new Error(`No version found for agent: ${agentName}`);
    }

    // 3. Create agent run record
    const run = await this.repository.createRun(agent.id, tenantId, 'queued');

    // 4. Save input context
    await this.repository.saveRunInput(run.id, context);

    // 5. Prepare OpenClaw payload
    const payload: OpenClawRunPayload = {
      agent_name: agentName,
      system_prompt: version.system_prompt || '',
      tools_allowed: version.tools_allowed,
      context,
      mode,
      tenant_id: tenantId || undefined,
      run_id: run.id,
    };

    // 6. Update status to running
    await this.repository.updateRun(run.id, { status: 'running' });

    const startTime = Date.now();

    try {
      // 7. Call OpenClaw
      const result = await callOpenClaw(payload);

      const latency_ms = Date.now() - startTime;
      const cost = result.metrics?.cost?.toString() || null;

      // 8. Update run with result
      await this.repository.updateRun(run.id, {
        status: result.status,
        ended_at: new Date(),
        cost: cost,
        latency_ms,
        error: result.error || null,
      });

      // 9. Save output if present
      if (result.output) {
        await this.repository.saveRunOutput(run.id, result.output);
      }

      // 10. Handle escalation if needed
      let escalations: AgentEscalationRow[] = [];
      if (result.escalation) {
        const dueAt = result.escalation.due_at
          ? new Date(result.escalation.due_at)
          : this.calculateDueDate(agent.risk_level, slaHours);

        const escalation = await this.repository.createEscalation(
          run.id,
          result.escalation.severity,
          result.escalation.reason,
          result.escalation.assigned_to || null,
          dueAt
        );
        escalations.push(escalation);
      }

      return {
        run_id: run.id,
        status: result.status,
        output: result.output,
        escalations: escalations.length > 0 ? escalations : undefined,
      };
    } catch (error) {
      // Handle execution error
      const latency_ms = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.repository.updateRun(run.id, {
        status: 'failed',
        ended_at: new Date(),
        latency_ms,
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Calculate escalation due date based on risk level and SLA
   */
  private calculateDueDate(riskLevel: string, slaHours?: number): Date {
    const hours = slaHours || this.getDefaultSLA(riskLevel);
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + hours);
    return dueDate;
  }

  /**
   * Get default SLA hours based on risk level
   */
  private getDefaultSLA(riskLevel: string): number {
    switch (riskLevel) {
      case 'high':
        return 2; // 2 hours for high risk
      case 'medium':
        return 24; // 24 hours for medium risk
      case 'low':
      default:
        return 72; // 72 hours for low risk
    }
  }

  /**
   * List all available agents
   */
  async listAgents() {
    return this.repository.listAgents();
  }

  /**
   * Get agent run details including output
   */
  async getRunDetails(runId: string) {
    const run = await this.repository.getRunById(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    const output = await this.repository.getRunOutput(runId);
    const escalations = await this.repository.listEscalationsByRunId(runId);

    return {
      ...run,
      output,
      escalations: escalations.length > 0 ? escalations : undefined,
    };
  }

  /**
   * List all pending escalations (for admin dashboard)
   */
  async listPendingEscalations() {
    return this.repository.listPendingEscalations();
  }
}
