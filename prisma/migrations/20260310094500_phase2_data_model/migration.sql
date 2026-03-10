-- Create enums
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED_LOST');
CREATE TYPE "DealStage" AS ENUM ('QUALIFIED', 'DISCOVERY_SCHEDULED', 'DISCOVERY_COMPLETED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');
CREATE TYPE "EngagementStage" AS ENUM ('DISCOVERY', 'AUDIT', 'AUTOMATION', 'TESTING', 'IMPLEMENTATION', 'OPTIMIZATION', 'COMPLETED', 'PAUSED');
CREATE TYPE "HealthStatus" AS ENUM ('GREEN', 'YELLOW', 'RED');
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'BLOCKED');
CREATE TYPE "DeliverableStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'DELIVERED');
CREATE TYPE "FinanceType" AS ENUM ('INVOICE', 'PAYMENT', 'CREDIT');
CREATE TYPE "FinanceStatus" AS ENUM ('DRAFT', 'SENT', 'OVERDUE', 'PAID');

-- Create tables
CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "source" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "ownerId" TEXT NOT NULL,
  "nextStep" TEXT,
  "nextStepDueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Deal" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "stage" "DealStage" NOT NULL DEFAULT 'QUALIFIED',
  "value" DECIMAL(65,30),
  "ownerId" TEXT NOT NULL,
  "nextStep" TEXT,
  "nextStepDueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Client" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "primaryContact" TEXT,
  "salesOwnerId" TEXT,
  "createdFromDealId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Engagement" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "offerType" TEXT,
  "stage" "EngagementStage" NOT NULL DEFAULT 'DISCOVERY',
  "healthStatus" "HealthStatus" NOT NULL DEFAULT 'GREEN',
  "ownerId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3),
  "targetEndDate" TIMESTAMP(3),
  "nextMilestone" TEXT,
  "nextMilestoneDueDate" TIMESTAMP(3),
  "progressPercent" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "ownerId" TEXT NOT NULL,
  "materialImpact" BOOLEAN NOT NULL DEFAULT false,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
  "id" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "notes" TEXT,
  "ownerId" TEXT NOT NULL,
  "nextStep" TEXT,
  "nextStepOwnerId" TEXT,
  "nextStepDueDate" TIMESTAMP(3),
  "clientNotificationRequired" BOOLEAN NOT NULL DEFAULT false,
  "clientNotificationSent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Deliverable" (
  "id" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "DeliverableStatus" NOT NULL DEFAULT 'DRAFT',
  "ownerId" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinanceRecord" (
  "id" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "type" "FinanceType" NOT NULL,
  "invoiceNumber" TEXT,
  "amount" DECIMAL(65,30) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "status" "FinanceStatus" NOT NULL DEFAULT 'DRAFT',
  "paymentReceived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinanceRecord_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "Deal_leadId_idx" ON "Deal"("leadId");
CREATE INDEX "Client_createdFromDealId_idx" ON "Client"("createdFromDealId");
CREATE INDEX "Engagement_clientId_idx" ON "Engagement"("clientId");
CREATE INDEX "Task_engagementId_idx" ON "Task"("engagementId");
CREATE INDEX "Event_engagementId_createdAt_idx" ON "Event"("engagementId", "createdAt");
CREATE INDEX "Deliverable_engagementId_idx" ON "Deliverable"("engagementId");
CREATE INDEX "FinanceRecord_engagementId_idx" ON "FinanceRecord"("engagementId");

-- Add foreign keys
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_createdFromDealId_fkey" FOREIGN KEY ("createdFromDealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinanceRecord" ADD CONSTRAINT "FinanceRecord_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
