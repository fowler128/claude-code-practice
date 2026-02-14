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

// ============================================================================
// OpenClaw Integration Types
// ============================================================================

export type ServiceAccountScope =
  | 'ingestion:write'
  | 'artifacts:write'
  | 'tasks:write'
  | 'events:write'
  | 'ai_runs:write';

export type AutomationRunStatus = 'running' | 'success' | 'failed' | 'timeout' | 'cancelled';

export type IngestionItemStatus = 'pending' | 'classified' | 'filed' | 'rejected' | 'error';

export type StorageProvider = 'local' | 'sharepoint' | 'gdrive' | 's3';

export type ArtifactStatus = 'draft' | 'qc_pending' | 'approved' | 'filed' | 'rejected';

export type CreatedByTypeExtended = 'user' | 'service' | 'automation' | 'ai';

// Service Account
export interface ServiceAccount {
  service_id: string;
  name: string;
  description?: string;
  api_key_hash: string;
  scopes: ServiceAccountScope[];
  enabled: boolean;
  last_used_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Automation Job
export interface AutomationJob {
  job_id: string;
  name: string;
  description?: string;
  schedule?: string; // Cron expression
  enabled: boolean;
  risk_default: RiskLevel;
  service_account_id?: string;
  config_json?: any; // JSONB
  last_run_at?: Date;
  next_run_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Automation Run
export interface AutomationRun {
  run_id: string;
  job_id?: string;
  job_name: string;
  correlation_id: string;
  status: AutomationRunStatus;
  started_at: Date;
  ended_at?: Date;
  duration_ms?: number;
  error_message?: string;
  inputs_ref?: string;
  outputs_ref?: string;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  cost_estimate?: number;
  cost_actual?: number;
  service_account_id?: string;
  metadata_json?: any; // JSONB
}

// Job Lock
export interface JobLock {
  lock_key: string;
  locked_at: Date;
  locked_by: string;
  expires_at: Date;
  run_id?: string;
  metadata_json?: any; // JSONB
}

// Ingestion Item
export interface IngestionItem {
  item_id: string;
  source: string;
  raw_uri: string;
  original_filename?: string;
  checksum_sha256?: string;
  mime_type?: string;
  file_size_bytes?: number;
  detected_type?: string;
  confidence?: number; // 0-100
  proposed_matter_id?: string;
  proposed_artifact_type?: string;
  status: IngestionItemStatus;
  filed_artifact_id?: string;
  handled_by?: string;
  automation_run_id?: string;
  correlation_id?: string;
  error_message?: string;
  metadata_json?: any; // JSONB
  created_at: Date;
  updated_at: Date;
}

// Extended Artifact (includes new file-authoritative fields)
export interface ArtifactExtended extends Artifact {
  file_uri?: string;
  storage_provider: StorageProvider;
  checksum_sha256?: string;
  mime_type?: string;
  version: number;
  status: ArtifactStatus;
  qc_gate?: string;
  created_by_type: CreatedByTypeExtended;
  ingestion_item_id?: string;
  correlation_id?: string;
}

// Extended Event (includes new integration fields)
export interface EventExtended extends Event {
  entity_type?: string;
  entity_id?: string;
  correlation_id?: string;
  service_account_id?: string;
  automation_run_id?: string;
  payload?: any; // JSONB
}

// ============================================================================
// Integration API Request/Response Types
// ============================================================================

export interface CreateServiceAccountRequest {
  name: string;
  description?: string;
  scopes: ServiceAccountScope[];
}

export interface CreateServiceAccountResponse {
  service_account: Omit<ServiceAccount, 'api_key_hash'>;
  api_key: string; // Only returned once at creation
}

export interface CreateIngestionItemRequest {
  source: string;
  raw_uri: string;
  original_filename?: string;
  checksum_sha256?: string;
  mime_type?: string;
  file_size_bytes?: number;
  detected_type?: string;
  confidence?: number;
  proposed_matter_id?: string;
  proposed_artifact_type?: string;
  automation_run_id?: string;
  correlation_id?: string;
  metadata_json?: any;
}

export interface UpdateIngestionItemRequest {
  status?: IngestionItemStatus;
  proposed_matter_id?: string;
  proposed_artifact_type?: string;
  filed_artifact_id?: string;
  handled_by?: string;
  error_message?: string;
  metadata_json?: any;
}

export interface CreateArtifactExtendedRequest extends CreateArtifactRequest {
  file_uri?: string;
  storage_provider?: StorageProvider;
  checksum_sha256?: string;
  mime_type?: string;
  status?: ArtifactStatus;
  created_by_type?: CreatedByTypeExtended;
  ingestion_item_id?: string;
  correlation_id?: string;
}

export interface CreateEventExtendedRequest {
  matter_id?: string;
  event_type: string;
  event_category: EventCategory;
  actor_type: ActorType;
  description: string;
  entity_type?: string;
  entity_id?: string;
  correlation_id?: string;
  service_account_id?: string;
  automation_run_id?: string;
  payload?: any;
}

export interface StartAutomationRunRequest {
  job_id?: string;
  job_name: string;
  correlation_id?: string;
  inputs_ref?: string;
  service_account_id?: string;
  metadata_json?: any;
}

export interface FinishAutomationRunRequest {
  status: Exclude<AutomationRunStatus, 'running'>;
  error_message?: string;
  outputs_ref?: string;
  items_processed?: number;
  items_created?: number;
  items_updated?: number;
  items_failed?: number;
  cost_actual?: number;
}

export interface AcquireLockRequest {
  lock_key: string;
  locked_by: string;
  expiry_seconds?: number;
  run_id?: string;
}

export interface AcquireLockResponse {
  acquired: boolean;
  lock?: JobLock;
}

export interface ReleaseLockRequest {
  lock_key: string;
  locked_by: string;
}

export interface ReleaseLockResponse {
  released: boolean;
}

export interface IntegrationApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlation_id?: string;
  timestamp: string;
}

// ============================================================================
// Content Ops Autopilot Types
// ============================================================================

export type BrandLane = 'bizdeedz' | 'turea' | 'both';

export type ContentIdeaStatus = 'captured' | 'approved' | 'drafted' | 'scheduled' | 'published' | 'archived';

export type ContentPlatform = 'linkedin' | 'tiktok' | 'twitter' | 'instagram' | 'youtube';

export type PublishStatus = 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';

// Content Skill File
export interface ContentSkillFile {
  skill_file_id: string;
  name: string;
  brand_lane: BrandLane;
  markdown_text: string;
  version: number;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Content Voice Memo
export interface ContentVoiceMemo {
  memo_id: string;
  source: string;
  file_url?: string;
  transcript_text?: string;
  duration_seconds?: number;
  created_by?: string;
  created_at: Date;
  processed_at?: Date;
  tags?: string[];
}

// Content Idea
export interface ContentIdea {
  idea_id: string;
  lane: BrandLane;
  sku?: string;
  hook_1: string;
  hook_2?: string;
  mechanism?: string;
  principle?: string;
  status: ContentIdeaStatus;
  tags?: string[];
  source_memo_id?: string;
  approved_by?: string;
  approved_at?: Date;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  metadata_json?: any;
}

// Content Draft
export interface ContentDraft {
  draft_id: string;
  idea_id: string;
  platform: ContentPlatform;
  draft_text: string;
  qa_principle: boolean;
  qa_mechanism: boolean;
  qa_cta: boolean;
  qa_audience: boolean;
  qa_passed?: boolean; // Computed field
  reviewed_by?: string;
  reviewed_at?: Date;
  review_notes?: string;
  version: number;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Content Calendar
export interface ContentCalendar {
  calendar_id: string;
  draft_id: string;
  scheduled_for: Date;
  publish_status: PublishStatus;
  published_at?: Date;
  publish_url?: string;
  publish_error?: string;
  scheduled_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Content Performance
export interface ContentPerformance {
  performance_id: string;
  draft_id: string;
  impressions: number;
  saves: number;
  comments: number;
  likes: number;
  shares: number;
  dms: number;
  calls: number;
  conversions: number;
  notes?: string;
  top_comment?: string;
  measured_at: Date;
  measured_by?: string;
  created_at: Date;
}

// API Request Types
export interface CreateContentSkillFileRequest {
  name: string;
  brand_lane: BrandLane;
  markdown_text: string;
  version?: number;
}

export interface UpdateContentSkillFileRequest {
  name?: string;
  brand_lane?: BrandLane;
  markdown_text?: string;
  version?: number;
  is_active?: boolean;
}

export interface CreateContentVoiceMemoRequest {
  source: string;
  file_url?: string;
  transcript_text?: string;
  duration_seconds?: number;
  tags?: string[];
}

export interface CreateContentIdeaRequest {
  lane: BrandLane;
  sku?: string;
  hook_1: string;
  hook_2?: string;
  mechanism?: string;
  principle?: string;
  status?: ContentIdeaStatus;
  tags?: string[];
  source_memo_id?: string;
  metadata_json?: any;
}

export interface UpdateContentIdeaRequest {
  lane?: BrandLane;
  sku?: string;
  hook_1?: string;
  hook_2?: string;
  mechanism?: string;
  principle?: string;
  status?: ContentIdeaStatus;
  tags?: string[];
  metadata_json?: any;
}

export interface ApproveContentIdeaRequest {
  approved: boolean;
}

export interface CreateContentDraftRequest {
  idea_id: string;
  platform: ContentPlatform;
  draft_text: string;
  version?: number;
}

export interface UpdateContentDraftRequest {
  draft_text?: string;
  platform?: ContentPlatform;
  version?: number;
  is_active?: boolean;
}

export interface UpdateContentDraftQARequest {
  qa_principle?: boolean;
  qa_mechanism?: boolean;
  qa_cta?: boolean;
  qa_audience?: boolean;
  review_notes?: string;
}

export interface ScheduleContentRequest {
  draft_id: string;
  scheduled_for: Date;
}

export interface CreateContentCalendarRequest {
  draft_id: string;
  scheduled_for: Date | string;
  publish_status?: PublishStatus;
}

export interface UpdateContentCalendarRequest {
  scheduled_for?: Date | string;
  publish_status?: PublishStatus;
  published_at?: Date | string;
  publish_url?: string;
  publish_error?: string;
}

export interface RecordPerformanceRequest {
  draft_id: string;
  impressions?: number;
  saves?: number;
  comments?: number;
  likes?: number;
  shares?: number;
  dms?: number;
  calls?: number;
  conversions?: number;
  notes?: string;
  top_comment?: string;
}

export interface CreateContentPerformanceRequest {
  draft_id: string;
  impressions?: number;
  saves?: number;
  comments?: number;
  likes?: number;
  shares?: number;
  dms?: number;
  calls?: number;
  conversions?: number;
  notes?: string;
  top_comment?: string;
}

// Type Aliases
export type ContentCalendarEntry = ContentCalendar;

// Dashboard/Analytics Types
export interface ContentOpsDashboard {
  ideas_pipeline?: ContentIdeaPipeline[];
  ideas_by_status?: { status: ContentIdeaStatus; count: number }[];
  drafts_pending_review: number;
  drafts_qa_passed?: number;
  scheduled_this_week: number;
  published_this_week?: number;
  total_published: number;
  avg_performance_score?: number;
  top_performing: any[];
  top_performing_content?: any[];
}

export interface ContentIdeaPipeline {
  lane: BrandLane;
  status: ContentIdeaStatus;
  idea_count: number;
  unique_skus: number;
  oldest_idea: Date;
  newest_idea: Date;
}

export interface ContentReviewQueueItem {
  draft_id: string;
  idea_id: string;
  lane: BrandLane;
  sku?: string;
  platform: ContentPlatform;
  draft_text: string;
  qa_principle: boolean;
  qa_mechanism: boolean;
  qa_cta: boolean;
  qa_audience: boolean;
  qa_passed: boolean;
  drafted_at: Date;
  drafted_by_id?: string;
  drafted_by_name?: string;
  reviewed_at?: Date;
  reviewed_by_id?: string;
  reviewed_by_name?: string;
}
