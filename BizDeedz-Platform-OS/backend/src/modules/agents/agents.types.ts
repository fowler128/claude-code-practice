// Agent types for OpenClaw integration
// Supports autonomous agent execution with governance and escalation

export type AgentRiskLevel = 'low' | 'medium' | 'high';
export type AgentRunStatus = 'queued' | 'running' | 'completed' | 'needs_review' | 'failed';
export type AgentRunMode = 'audit' | 'draft' | 'execute' | 'supervise';

export interface AgentRow {
  id: string;
  name: string;
  purpose: string | null;
  risk_level: AgentRiskLevel;
  default_model: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AgentVersionRow {
  id: string;
  agent_id: string;
  version: number;
  system_prompt: string | null;
  tools_allowed: any; // JSONB
  created_at: string;
}

export interface AgentRunRow {
  id: string;
  agent_id: string;
  tenant_id: string | null;
  status: AgentRunStatus;
  started_at: string;
  ended_at: string | null;
  cost: string | null; // numeric in pg returns string
  latency_ms: number | null;
  error: string | null;
}

export interface AgentEscalationRow {
  id: string;
  run_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  assigned_to: string | null;
  due_at: string | null;
  resolved_at: string | null;
  created_at?: string;
}

export type AgentRunContext = Record<string, unknown>;

export interface RunAgentRequestBody {
  agent_name: string;
  tenant_id?: string;
  context?: AgentRunContext;
  mode?: AgentRunMode; // default: "audit"
  sla_hours?: number; // optional override
}

export interface RunAgentResponseBody {
  run_id: string;
  status: AgentRunStatus;
  output?: Record<string, unknown>;
  escalations?: AgentEscalationRow[];
}

export interface AgentListItem {
  id: string;
  name: string;
  purpose: string | null;
  risk_level: AgentRiskLevel;
  is_active: boolean;
  latest_version: number | null;
  last_run_status: AgentRunStatus | null;
  last_run_started_at: string | null;
}
