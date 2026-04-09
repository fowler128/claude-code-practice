// Agents routes - Express route wiring
import { Router } from 'express';
import { Pool } from 'pg';
import { AgentsRepository } from './agents.repository';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';

export function createAgentsRouter(pool: Pool): Router {
  const router = Router();

  // Dependency injection
  const repository = new AgentsRepository(pool);
  const service = new AgentsService(repository);
  const controller = new AgentsController(service);

  // Routes
  router.post('/run', controller.runAgent);
  router.get('/', controller.listAgents);
  router.get('/runs/:run_id', controller.getRunDetails);
  router.get('/escalations', controller.listPendingEscalations);

  return router;
}
