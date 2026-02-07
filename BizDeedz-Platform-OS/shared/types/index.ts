// Shared TypeScript types for BizDeedz Platform OS

export type UserRole = 'admin' | 'attorney' | 'paralegal' | 'intake_specialist' | 'billing_specialist' | 'ops_lead';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type RiskTier = 'low' | 'medium' | 'high' | 'critical';

export type BillingType = 'hourly' | 'fixed' | 'subscription' | 'contingency';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'cancelled';

export type QCStatus = 'pending' | 'pass' | 'fail' | 'needs_review';

export type ArtifactSource = 'client' | 'email' | 'portal' | 'drive' | 'court' | 'agency' | 'internal';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_required';

export type EventCategory = 'matter' | 'task' | 'artifact' | 'ai_run' | 'billing' | 'status_change' | 'defect' | 'approval' | 'system';

export type ActorType = 'user' | 'system' | 'automation' | 'ai';

export type CreatedByType = 'human' | 'automation' | 'ai';

export type BillingEventType = 'time_entry' | 'milestone' | 'expense' | 'invoice' | 'payment' | 'adjustment';

export type BillingEventStatus = 'draft' | 'pending' | 'invoiced' | 'paid' | 'cancelled';

export interface User {
  user_id: string;
  email: string;
  password_hash?: string; // Excluded from API responses
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PracticeArea {
  practice_area_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface MatterType {
  matter_type_id: string;
  practice_area_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface Matter {
  matter_id: string;
  matter_number: string;
  client_name: string;
  client_entity?: string;
  practice_area_id: string;
  matter_type_id: string;
  status: string;
  lane: string;
  priority: Priority;
  owner_user_id?: string;
  assigned_roles?: string[];
  opened_at: Date;
  target_dates?: any; // JSONB
  closed_at?: Date;
  matter_health_score?: number;
  risk_tier?: RiskTier;
  last_defect_reason?: string;
  defect_count: number;
  billing_type?: BillingType;
  metadata_json?: any; // JSONB
  playbook_id?: string;
  playbook_version?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  task_id: string;
  matter_id: string;
  task_type: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_role?: string;
  due_date?: Date;
  sla_minutes?: number;
  status: TaskStatus;
  depends_on?: string[];
  created_by_type?: CreatedByType;
  created_by_id?: string;
  completion_notes?: string;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ArtifactType {
  artifact_type_id: string;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: Date;
}

export interface Artifact {
  artifact_id: string;
  matter_id: string;
  artifact_type_id: string;
  name: string;
  description?: string;
  required: boolean;
  received: boolean;
  qc_status?: QCStatus;
  source?: ArtifactSource;
  storage_pointer?: string;
  file_type?: string;
  file_size_bytes?: number;
  uploaded_by?: string;
  uploaded_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PromptLibraryEntry {
  prompt_id: string;
  prompt_key: string;
  version: string;
  title: string;
  description?: string;
  prompt_template: string;
  use_case?: string;
  risk_level: RiskLevel;
  requires_approval: boolean;
  allowed_roles?: string[];
  practice_areas?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AIRun {
  ai_run_id: string;
  matter_id?: string;
  action_type: string;
  action_description?: string;
  model_used: string;
  prompt_id?: string;
  prompt_version?: string;
  inputs_pointer?: string;
  output_pointer?: string;
  output_preview?: string;
  confidence?: number;
  approvals_required: boolean;
  approval_status: ApprovalStatus;
  reviewer_user_id?: string;
  review_notes?: string;
  reviewed_at?: Date;
  risk_level: RiskLevel;
  citations?: any; // JSONB
  execution_time_ms?: number;
  tokens_used?: number;
  cost_usd?: number;
  error_message?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  event_id: string;
  matter_id?: string;
  event_type: string;
  event_category: EventCategory;
  actor_type: ActorType;
  actor_user_id?: string;
  description: string;
  metadata_json?: any; // JSONB
  reference_id?: string;
  reference_type?: string;
  created_at: Date;
}

export interface BillingEvent {
  billing_event_id: string;
  matter_id: string;
  event_type: BillingEventType;
  amount: number;
  status: BillingEventStatus;
  description?: string;
  date: Date;
  external_ref?: string;
  metadata_json?: any; // JSONB
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DefectReason {
  defect_reason_id: string;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: Date;
}

export interface PlaybookTemplate {
  playbook_id: string;
  version: string;
  practice_area_id: string;
  matter_type_id: string;
  name: string;
  description?: string;
  template_json: PlaybookTemplateJSON;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlaybookTemplateJSON {
  lanes: Lane[];
  statuses: Status[];
  required_artifacts: RequiredArtifact[];
  qc_gates: QCGate[];
  sla_rules: SLARule[];
  automation_rules: AutomationRule[];
  ai_actions_allowed: AIActionAllowed[];
}

export interface Lane {
  lane_id: string;
  name: string;
  order: number;
  roles: UserRole[];
}

export interface Status {
  status_code: string;
  name: string;
  lane_id: string;
  order: number;
}

export interface RequiredArtifact {
  artifact_type_id: string;
  required_at_status?: string;
  gate_id?: string;
}

export interface QCGate {
  gate_id: string;
  name: string;
  status_code: string;
  criteria: string[];
}

export interface SLARule {
  status_code: string;
  sla_hours: number;
  escalation_enabled: boolean;
  escalation_roles?: UserRole[];
}

export interface AutomationRule {
  rule_name: string;
  trigger_type: string;
  trigger_conditions: any;
  action_type: string;
  action_config: any;
}

export interface AIActionAllowed {
  action_type: string;
  risk_level: RiskLevel;
  requires_approval: boolean;
  allowed_roles?: UserRole[];
}

// Matter Health Score
export interface MatterHealthScore {
  score: number;
  risk_tier: RiskTier;
  drivers: ScoreDriver[];
  recommended_actions: string[];
}

export interface ScoreDriver {
  driver: string;
  impact: number;
  description: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface CreateMatterRequest {
  client_name: string;
  client_entity?: string;
  practice_area_id: string;
  matter_type_id: string;
  priority: Priority;
  owner_user_id?: string;
  billing_type?: BillingType;
  metadata_json?: any;
  playbook_id?: string;
}

export interface CreateTaskRequest {
  matter_id: string;
  task_type: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_role?: string;
  due_date?: Date;
  sla_minutes?: number;
}

export interface CreateArtifactRequest {
  matter_id: string;
  artifact_type_id: string;
  name: string;
  description?: string;
  required?: boolean;
  source?: ArtifactSource;
  storage_pointer?: string;
}

export interface CreateAIRunRequest {
  matter_id?: string;
  action_type: string;
  action_description?: string;
  model_used: string;
  prompt_id?: string;
  risk_level: RiskLevel;
  inputs_pointer?: string;
  output_pointer?: string;
  output_preview?: string;
}

export interface ApproveAIRunRequest {
  approval_status: 'approved' | 'rejected';
  review_notes?: string;
}
