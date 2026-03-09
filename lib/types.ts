export type Role = "Admin" | "Operations" | "Sales" | "Finance" | "Viewer";
export type Severity = "Critical" | "Warning";

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  status: "New" | "Contacted" | "Qualified" | "Converted" | "Closed Lost";
  ownerId: string;
  source?: string;
  nextStep?: string;
  nextStepDueDate?: string;
}

export interface Deal {
  id: string;
  leadId: string;
  name: string;
  stage:
    | "Qualified"
    | "Discovery Scheduled"
    | "Discovery Completed"
    | "Proposal Sent"
    | "Negotiation"
    | "Won"
    | "Lost";
  ownerId: string;
  value?: number;
  nextStep?: string;
  nextStepDueDate?: string;
}

export interface Client {
  id: string;
  name: string;
  primaryContact?: string;
  salesOwnerId?: string;
  createdFromDealId?: string;
}

export interface Engagement {
  id: string;
  clientId: string;
  name: string;
  offerType?: string;
  stage: "Discovery" | "Audit" | "Automation" | "Testing" | "Implementation" | "Optimization" | "Completed" | "Paused";
  healthStatus: "Green" | "Yellow" | "Red";
  ownerId: string;
  nextMilestone?: string;
  nextMilestoneDueDate?: string;
}

export interface Task {
  id: string;
  engagementId: string;
  title: string;
  status: "Not Started" | "In Progress" | "Waiting" | "Completed" | "Blocked";
  ownerId: string;
  dueDate?: string;
  materialImpact: boolean;
}

export interface EventRecord {
  id: string;
  engagementId: string;
  type: string;
  summary: string;
  ownerId: string;
  createdAt: string;
  clientNotificationRequired: boolean;
  clientNotificationSent: boolean;
}

export interface Deliverable {
  id: string;
  engagementId: string;
  name: string;
  status: "Draft" | "In Review" | "Delivered";
  ownerId: string;
}

export interface FinanceRecord {
  id: string;
  engagementId: string;
  type: "Invoice" | "Payment" | "Credit";
  invoiceNumber?: string;
  amount: number;
  dueDate?: string;
  status: "Draft" | "Sent" | "Overdue" | "Paid";
  paymentReceived: boolean;
}

export interface MissionControlSeed {
  leads: Lead[];
  deals: Deal[];
  clients: Client[];
  engagements: Engagement[];
  tasks: Task[];
  events: EventRecord[];
  deliverables: Deliverable[];
  financeRecords: FinanceRecord[];
}
