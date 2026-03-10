/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.financeRecord.deleteMany();
  await prisma.engagement.deleteMany();
  await prisma.client.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();

  const leads = await Promise.all([
    prisma.lead.create({ data: { companyName: "Apex Immigration", contactName: "M. Diaz", status: "QUALIFIED", ownerId: "U-sales-1", source: "Referral", nextStep: "Discovery call", nextStepDueDate: new Date("2026-03-12") } }),
    prisma.lead.create({ data: { companyName: "Harper Legal", contactName: "J. Harper", status: "CONTACTED", ownerId: "U-sales-2", source: "Website", nextStep: "Qualification follow-up", nextStepDueDate: new Date("2026-03-11") } }),
    prisma.lead.create({ data: { companyName: "Pine Tax", contactName: "A. Lake", status: "NEW", ownerId: "U-sales-1", source: "Outbound" } })
  ]);

  const deals = await Promise.all([
    prisma.deal.create({ data: { leadId: leads[0].id, name: "AI Intake Modernization", stage: "PROPOSAL_SENT", ownerId: "U-sales-1", value: 18000, nextStep: "Proposal review", nextStepDueDate: new Date("2026-03-13") } }),
    prisma.deal.create({ data: { leadId: leads[1].id, name: "Workflow Automation Sprint", stage: "NEGOTIATION", ownerId: "U-sales-2", value: 22000, nextStep: "Redline terms", nextStepDueDate: new Date("2026-03-12") } })
  ]);

  const clients = await Promise.all([
    prisma.client.create({ data: { name: "Immigration Firm", primaryContact: "M. Diaz", salesOwnerId: "U-sales-1", createdFromDealId: deals[0].id } }),
    prisma.client.create({ data: { name: "Northstar Clinic", primaryContact: "N. Star", salesOwnerId: "U-sales-2" } }),
    prisma.client.create({ data: { name: "Foundry Manufacturing", primaryContact: "R. Forge", salesOwnerId: "U-sales-1" } })
  ]);

  const engagements = await Promise.all([
    prisma.engagement.create({ data: { clientId: clients[0].id, name: "AI Readiness Audit", offerType: "Audit", stage: "AUDIT", healthStatus: "GREEN", ownerId: "U-ops-1", startDate: new Date("2026-03-01"), targetEndDate: new Date("2026-04-01"), nextMilestone: "Process map signoff", nextMilestoneDueDate: new Date("2026-03-12"), progressPercent: 65 } }),
    prisma.engagement.create({ data: { clientId: clients[1].id, name: "Client Intake Revamp", offerType: "Automation", stage: "TESTING", healthStatus: "YELLOW", ownerId: "U-ops-2", startDate: new Date("2026-02-15"), targetEndDate: new Date("2026-03-30"), nextMilestone: "UAT complete", nextMilestoneDueDate: new Date("2026-03-10"), progressPercent: 82 } }),
    prisma.engagement.create({ data: { clientId: clients[2].id, name: "Ops Design", offerType: "Ops Design", stage: "IMPLEMENTATION", healthStatus: "RED", ownerId: "U-ops-1", startDate: new Date("2026-02-01"), targetEndDate: new Date("2026-03-25"), nextMilestone: "Training launch", nextMilestoneDueDate: new Date("2026-03-05"), progressPercent: 44 } }),
    prisma.engagement.create({ data: { clientId: clients[0].id, name: "Workflow Automation Sprint", offerType: "Automation", stage: "AUTOMATION", healthStatus: "GREEN", ownerId: "U-ops-2", startDate: new Date("2026-03-03"), targetEndDate: new Date("2026-04-05"), nextMilestone: "Bot validation", nextMilestoneDueDate: new Date("2026-03-13"), progressPercent: 37 } })
  ]);

  await Promise.all([
    prisma.task.create({ data: { engagementId: engagements[0].id, title: "Audit interview synthesis", status: "IN_PROGRESS", ownerId: "U-ops-1", materialImpact: true, dueDate: new Date("2026-03-10") } }),
    prisma.task.create({ data: { engagementId: engagements[0].id, title: "Evidence library cleanup", status: "NOT_STARTED", ownerId: "U-ops-1", materialImpact: false, dueDate: new Date("2026-03-14") } }),
    prisma.task.create({ data: { engagementId: engagements[1].id, title: "UAT defect triage", status: "WAITING", ownerId: "U-ops-2", materialImpact: true, dueDate: new Date("2026-03-08") } }),
    prisma.task.create({ data: { engagementId: engagements[1].id, title: "Client walkthrough prep", status: "COMPLETED", ownerId: "U-ops-2", materialImpact: false, dueDate: new Date("2026-03-07") } }),
    prisma.task.create({ data: { engagementId: engagements[2].id, title: "Invoice reconciliation map", status: "BLOCKED", ownerId: "U-ops-1", materialImpact: true, dueDate: new Date("2026-03-04") } }),
    prisma.task.create({ data: { engagementId: engagements[2].id, title: "Ops handoff checklist", status: "IN_PROGRESS", ownerId: "U-ops-1", materialImpact: false, dueDate: new Date("2026-03-11") } }),
    prisma.task.create({ data: { engagementId: engagements[3].id, title: "Automation test plan", status: "NOT_STARTED", ownerId: "U-ops-2", materialImpact: true, dueDate: new Date("2026-03-12") } }),
    prisma.task.create({ data: { engagementId: engagements[3].id, title: "Bot failover review", status: "WAITING", ownerId: "U-ops-2", materialImpact: true, dueDate: new Date("2026-03-09") } })
  ]);

  await Promise.all([
    prisma.event.create({ data: { engagementId: engagements[0].id, type: "Discovery", summary: "Discovery call completed", ownerId: "U-ops-1", nextStep: "Send questionnaire", nextStepDueDate: new Date("2026-03-10") } }),
    prisma.event.create({ data: { engagementId: engagements[0].id, type: "Intake", summary: "Client questionnaire received", ownerId: "U-ops-1", nextStep: "Start audit analysis", nextStepDueDate: new Date("2026-03-09") } }),
    prisma.event.create({ data: { engagementId: engagements[0].id, type: "Work", summary: "Audit analysis started", ownerId: "U-ops-1", nextStep: "Draft findings", nextStepDueDate: new Date("2026-03-11") } }),
    prisma.event.create({ data: { engagementId: engagements[1].id, type: "Testing", summary: "UAT kickoff", ownerId: "U-ops-2", nextStep: "Defect sweep", nextStepDueDate: new Date("2026-03-09") } }),
    prisma.event.create({ data: { engagementId: engagements[1].id, type: "Testing", summary: "Defect review complete", ownerId: "U-ops-2", nextStep: "Prepare signoff", nextStepDueDate: new Date("2026-03-12") } }),
    prisma.event.create({ data: { engagementId: engagements[2].id, type: "Escalation", summary: "Leadership escalation", ownerId: "U-ops-1", nextStep: "Resolve blocker", nextStepDueDate: new Date("2026-03-06"), clientNotificationRequired: true, clientNotificationSent: false } }),
    prisma.event.create({ data: { engagementId: engagements[2].id, type: "Finance", summary: "Invoice issue identified", ownerId: "U-ops-1", nextStep: "Reconcile accounts", nextStepDueDate: new Date("2026-03-08") } }),
    prisma.event.create({ data: { engagementId: engagements[3].id, type: "Automation", summary: "Automation sprint started", ownerId: "U-ops-2", nextStep: "Bot validation", nextStepDueDate: new Date("2026-03-13") } }),
    prisma.event.create({ data: { engagementId: engagements[3].id, type: "Automation", summary: "Failover scenario documented", ownerId: "U-ops-2", nextStep: "Run resiliency test", nextStepDueDate: new Date("2026-03-14") } }),
    prisma.event.create({ data: { engagementId: engagements[3].id, type: "Deliverable", summary: "Draft deliverable completed", ownerId: "U-ops-2", nextStep: "Internal review", nextStepDueDate: new Date("2026-03-15") } })
  ]);

  await Promise.all([
    prisma.deliverable.create({ data: { engagementId: engagements[0].id, name: "Audit findings deck", status: "IN_REVIEW", ownerId: "U-ops-1", dueDate: new Date("2026-03-15") } }),
    prisma.deliverable.create({ data: { engagementId: engagements[1].id, name: "Client intake SOP", status: "DRAFT", ownerId: "U-ops-2", dueDate: new Date("2026-03-13") } }),
    prisma.deliverable.create({ data: { engagementId: engagements[2].id, name: "Ops dashboard handoff", status: "DELIVERED", ownerId: "U-ops-1", dueDate: new Date("2026-03-03"), deliveredAt: new Date("2026-03-03") } })
  ]);

  await Promise.all([
    prisma.financeRecord.create({ data: { engagementId: engagements[0].id, type: "INVOICE", invoiceNumber: "4432", amount: 8500, dueDate: new Date("2026-03-08"), status: "SENT", paymentReceived: false } }),
    prisma.financeRecord.create({ data: { engagementId: engagements[1].id, type: "INVOICE", invoiceNumber: "4438", amount: 6400, dueDate: new Date("2026-03-07"), status: "PAID", paymentReceived: true } }),
    prisma.financeRecord.create({ data: { engagementId: engagements[2].id, type: "INVOICE", invoiceNumber: "4441", amount: 9200, dueDate: new Date("2026-03-01"), status: "OVERDUE", paymentReceived: false } })
  ]);

  console.log("Seed complete: 3 leads, 2 deals, 3 clients, 4 engagements, 8 tasks, 10 events, 3 deliverables, 3 finance records");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
