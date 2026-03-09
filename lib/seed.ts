import { MissionControlSeed } from "@/lib/types";

export const seedData: MissionControlSeed = {
  leads: [
    { id: "L1", companyName: "Apex Immigration", contactName: "M. Diaz", status: "Qualified", ownerId: "U-sales-1", nextStep: "Discovery call" },
    { id: "L2", companyName: "Harper Legal", contactName: "J. Harper", status: "Contacted", ownerId: "U-sales-2", nextStep: "Follow-up" },
    { id: "L3", companyName: "Pine Tax", contactName: "A. Lake", status: "New", ownerId: "U-sales-1" }
  ],
  deals: [
    { id: "D1", leadId: "L1", name: "AI Intake Modernization", stage: "Proposal Sent", ownerId: "U-sales-1", nextStep: "Proposal review" },
    { id: "D2", leadId: "L2", name: "Workflow Automation Sprint", stage: "Negotiation", ownerId: "U-sales-2", nextStep: "Redline terms" }
  ],
  clients: [
    { id: "C1", name: "Immigration Firm" },
    { id: "C2", name: "Northstar Clinic" },
    { id: "C3", name: "Foundry Manufacturing" }
  ],
  engagements: [
    { id: "E1", clientId: "C1", name: "AI Readiness Audit", offerType: "Audit", stage: "Audit", healthStatus: "Green", ownerId: "U-ops-1", nextMilestone: "Process map signoff", nextMilestoneDueDate: "2026-03-12" },
    { id: "E2", clientId: "C2", name: "Client Intake Revamp", offerType: "Automation", stage: "Testing", healthStatus: "Yellow", ownerId: "U-ops-2", nextMilestone: "UAT complete", nextMilestoneDueDate: "2026-03-10" },
    { id: "E3", clientId: "C3", name: "Ops Design", offerType: "Ops Design", stage: "Implementation", healthStatus: "Red", ownerId: "U-ops-1", nextMilestone: "Training launch", nextMilestoneDueDate: "2026-03-05" },
    { id: "E4", clientId: "C1", name: "Workflow Automation Sprint", offerType: "Automation", stage: "Automation", healthStatus: "Green", ownerId: "U-ops-2", nextMilestone: "Bot validation", nextMilestoneDueDate: "2026-03-13" }
  ],
  tasks: [
    { id: "T1", engagementId: "E1", title: "Audit interview synthesis", status: "In Progress", ownerId: "U-ops-1", dueDate: "2026-03-10", materialImpact: true },
    { id: "T2", engagementId: "E1", title: "Evidence library cleanup", status: "Not Started", ownerId: "U-ops-1", dueDate: "2026-03-14", materialImpact: false },
    { id: "T3", engagementId: "E2", title: "UAT defect triage", status: "Waiting", ownerId: "U-ops-2", dueDate: "2026-03-08", materialImpact: true },
    { id: "T4", engagementId: "E2", title: "Client walkthrough prep", status: "Completed", ownerId: "U-ops-2", dueDate: "2026-03-07", materialImpact: false },
    { id: "T5", engagementId: "E3", title: "Invoice reconciliation map", status: "Blocked", ownerId: "U-ops-1", dueDate: "2026-03-04", materialImpact: true },
    { id: "T6", engagementId: "E3", title: "Ops handoff checklist", status: "In Progress", ownerId: "U-ops-1", dueDate: "2026-03-11", materialImpact: false },
    { id: "T7", engagementId: "E4", title: "Automation test plan", status: "Not Started", ownerId: "U-ops-2", dueDate: "2026-03-12", materialImpact: true },
    { id: "T8", engagementId: "E4", title: "Bot failover review", status: "Waiting", ownerId: "U-ops-2", dueDate: "2026-03-09", materialImpact: true }
  ],
  events: [
    { id: "EV1", engagementId: "E1", type: "System", summary: "Discovery call completed", ownerId: "U-ops-1", createdAt: "2026-03-08T10:32:00", clientNotificationRequired: false, clientNotificationSent: false },
    { id: "EV2", engagementId: "E1", type: "System", summary: "Client questionnaire received", ownerId: "U-ops-1", createdAt: "2026-03-08T10:45:00", clientNotificationRequired: false, clientNotificationSent: false },
    { id: "EV3", engagementId: "E3", type: "Escalation", summary: "Leadership escalation", ownerId: "U-ops-1", createdAt: "2026-02-28T15:00:00", clientNotificationRequired: true, clientNotificationSent: false }
  ],
  deliverables: [
    { id: "DL1", engagementId: "E1", name: "Audit findings deck", status: "In Review", ownerId: "U-ops-1" },
    { id: "DL2", engagementId: "E2", name: "Client intake SOP", status: "Draft", ownerId: "U-ops-2" },
    { id: "DL3", engagementId: "E3", name: "Ops dashboard handoff", status: "Delivered", ownerId: "U-ops-1" }
  ],
  financeRecords: [
    { id: "F1", engagementId: "E1", type: "Invoice", invoiceNumber: "4432", amount: 8500, dueDate: "2026-03-08", status: "Sent", paymentReceived: false },
    { id: "F2", engagementId: "E2", type: "Invoice", invoiceNumber: "4438", amount: 6400, dueDate: "2026-03-07", status: "Paid", paymentReceived: true },
    { id: "F3", engagementId: "E3", type: "Invoice", invoiceNumber: "4441", amount: 9200, dueDate: "2026-03-01", status: "Overdue", paymentReceived: false }
  ]
};
