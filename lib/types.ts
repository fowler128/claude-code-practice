export type NavigationRoute =
  | "/dashboard"
  | "/leads"
  | "/deals"
  | "/clients"
  | "/engagements"
  | "/tasks"
  | "/finance"
  | "/content"
  | "/knowledge"
  | "/settings";

export interface ShellNavItem {
  href: NavigationRoute;
  label: string;
}

export type EngagementStage =
  | "DISCOVERY"
  | "AUDIT"
  | "AUTOMATION"
  | "TESTING"
  | "IMPLEMENTATION"
  | "OPTIMIZATION"
  | "COMPLETED"
  | "PAUSED";

export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "WAITING" | "COMPLETED" | "BLOCKED";

export type InvoiceStatus = "DRAFT" | "SENT" | "OVERDUE" | "PAID";

export type EventEntityType = "DEAL" | "ENGAGEMENT" | "TASK";

export type EventType = "STAGE_CHANGED" | "TASK_COMPLETED";

export interface DealRecord {
  id: string;
  name: string;
  stage: "QUALIFIED" | "DISCOVERY_SCHEDULED" | "DISCOVERY_COMPLETED" | "PROPOSAL_SENT" | "NEGOTIATION" | "WON" | "LOST";
  nextStep?: string;
}

export interface EngagementRecord {
  id: string;
  name: string;
  stage: EngagementStage;
}

export interface TaskRecord {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  dueDate?: string;
  engagementId?: string;
  dealId?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  dueDate?: string;
}

export interface EventRecord {
  id: string;
  entityType: EventEntityType;
  entityId: string;
  eventType: EventType;
  description: string;
  createdBy: string;
  createdAt: string;
}

export type AlertType =
  | "DEAL_NO_NEXT_STEP"
  | "ENGAGEMENT_NO_EVENT_7_DAYS"
  | "OVERDUE_TASK"
  | "UNPAID_INVOICE";

export interface AlertRecord {
  id: string;
  type: AlertType;
  message: string;
}

// ── Content Module Types ──

export type ArticleStatus = "IDEA" | "DRAFTING" | "REVIEW" | "PUBLISHED";

export type ContentType = "BLOG" | "SOCIAL";

export interface GscMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
}

export interface AeoGeoCheckItem {
  label: string;
  passed: boolean;
}

export interface SchemaMarkup {
  type: string;
  snippet: string;
}

export interface ArticleRecord {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  targetKeyword: string;
  contentType: ContentType;
  status: ArticleStatus;
  publishedAt?: string;
  url?: string;
  gsc: GscMetrics;
  aeoGeoChecklist: AeoGeoCheckItem[];
  schemaMarkup: SchemaMarkup[];
}
