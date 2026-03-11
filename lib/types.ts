export type NavigationRoute =
  | "/dashboard"
  | "/leads"
  | "/deals"
  | "/clients"
  | "/engagements"
  | "/tasks"
  | "/finance"
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

export type EventEntityType = "DEAL" | "ENGAGEMENT" | "TASK";

export type EventType = "STAGE_CHANGED" | "TASK_COMPLETED";

export interface EngagementRecord {
  id: string;
  name: string;
  stage: EngagementStage;
}

export interface TaskRecord {
  id: string;
  title: string;
  status: TaskStatus;
  engagementId?: string;
  dealId?: string;
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
