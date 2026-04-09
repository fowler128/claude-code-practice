// Agents controller - HTTP request handlers
import { Request, Response } from 'express';
import { AgentsService } from './agents.service';
import { RunAgentRequestBody } from './agents.types';

export class AgentsController {
  constructor(private service: AgentsService) {}

  /**
   * POST /api/agents/run
   * Execute an agent by name
   */
  runAgent = async (req: Request, res: Response) => {
    try {
      const body = req.body as RunAgentRequestBody;

      if (!body.agent_name) {
        return res.status(400).json({ error: 'agent_name is required' });
      }

      const result = await this.service.runAgent(
        body.agent_name,
        body.tenant_id || null,
        body.context || {},
        body.mode || 'audit',
        body.sla_hours
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('[AgentsController] Error running agent:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /api/agents
   * List all available agents
   */
  listAgents = async (_req: Request, res: Response) => {
    try {
      const agents = await this.service.listAgents();
      res.status(200).json({ agents });
    } catch (error) {
      console.error('[AgentsController] Error listing agents:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /api/agents/runs/:run_id
   * Get agent run details
   */
  getRunDetails = async (req: Request, res: Response) => {
    try {
      const { run_id } = req.params;

      if (!run_id) {
        return res.status(400).json({ error: 'run_id is required' });
      }

      const details = await this.service.getRunDetails(run_id);
      res.status(200).json(details);
    } catch (error) {
      console.error('[AgentsController] Error getting run details:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('not found')) {
        return res.status(404).json({ error: message });
      }

      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /api/agents/escalations
   * List all pending escalations (admin only)
   */
  listPendingEscalations = async (_req: Request, res: Response) => {
    try {
      const escalations = await this.service.listPendingEscalations();
      res.status(200).json({ escalations });
    } catch (error) {
      console.error('[AgentsController] Error listing escalations:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  };
}
