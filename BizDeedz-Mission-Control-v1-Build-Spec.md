# BizDeedz Mission Control v1 Build Spec

## 1) Product Brief
BizDeedz Mission Control is an internal operations platform for BizDeedz. It is used to manage leads, deals, clients, engagements, tasks, events, deliverables, finance records, and leadership visibility. Its purpose is to centralize operations, enforce event logging, track engagement progress, and surface what needs attention right now. This is an internal command-center product, not a generic CRM.

## 2) MVP Scope
### In v1
- Dashboard
- Leads
- Deals
- Clients
- Engagements
- Tasks
- Events
- Deliverables
- Finance

### Excluded from v1
- Public client portal
- Advanced AI agents
- Full billing integrations
- Deep email sync
- Knowledge base authoring
- Content pipeline
- Multi-workspace support

## 3) User Roles & Permissions
### Roles
- Admin
- Operations
- Sales
- Finance
- Viewer

### Permission Matrix
- **Admin**: Full CRUD on all modules + stage changes + financial updates + configuration.
- **Operations**: CRUD for engagements, tasks, events, deliverables. Read leads/deals/finance.
- **Sales**: CRUD for leads, deals, clients. Read engagements/tasks/events.
- **Finance**: CRUD for finance records. Read clients/engagements/events.
- **Viewer**: Dashboard and entity detail read-only.

## 4) Data Model (v1)
### Core Relationship Chain
- Lead -> Deal -> Client -> Engagement
- Engagement -> Tasks
- Engagement -> Events
- Engagement -> Deliverables
- Engagement -> FinanceRecords

### Entities
#### Lead
- id
- companyName
- contactName
- source
- status (New, Contacted, Qualified, Converted, Closed Lost)
- ownerId
- nextStep
- nextStepDueDate
- createdAt

#### Deal
- id
- leadId
- name
- stage (Qualified, Discovery Scheduled, Discovery Completed, Proposal Sent, Negotiation, Won, Lost)
- value
- ownerId
- nextStep
- nextStepDueDate
- createdAt

#### Client
- id
- name
- primaryContact
- salesOwnerId
- createdFromDealId
- createdAt

#### Engagement
- id
- clientId
- name
- offerType
- stage (Discovery, Audit, Automation, Testing, Implementation, Optimization, Completed, Paused)
- healthStatus (Green, Yellow, Red)
- ownerId
- startDate
- targetEndDate
- nextMilestone
- nextMilestoneDueDate
- progressPercent

#### Task
- id
- engagementId
- title
- status (Not Started, In Progress, Waiting, Completed, Blocked)
- materialImpact (boolean)
- ownerId
- dueDate

#### Event
- id
- engagementId
- type
- summary
- notes
- ownerId
- nextStep
- nextStepOwnerId
- nextStepDueDate
- clientNotificationRequired
- clientNotificationSent
- createdAt

#### Deliverable
- id
- engagementId
- name
- status (Draft, In Review, Delivered)
- ownerId
- dueDate
- deliveredAt

#### FinanceRecord
- id
- engagementId
- type (Invoice, Payment, Credit)
- invoiceNumber
- amount
- dueDate
- status (Draft, Sent, Overdue, Paid)
- paymentReceived

## 5) Workflow Rules
### Lead -> Deal
1. Create lead.
2. Update lead status to Qualified.
3. Convert qualified lead to deal (lead becomes Converted).

### Deal -> Client -> Engagement
1. Mark deal Won.
2. Create client from deal.
3. Create first engagement for that client.

### Engagement Stage Change
1. User drags engagement card to new stage.
2. System updates engagement.stage.
3. System auto-creates Event(type="Stage Change").
4. Dashboard alerts/metrics recalculate.

### Task Completion
1. User marks task Completed.
2. If task.materialImpact=true, system requires/prompts Event logging.
3. Engagement progress recalculates.

### Deliverable Update
1. User updates deliverable status.
2. If status=Delivered, system auto-creates Event(type="Deliverable Update").
3. If client notification required, add/send notification state.

## 6) State Logic
### Engagement Stages
- Discovery
- Audit
- Automation
- Testing
- Implementation
- Optimization
- Completed
- Paused

### Health Statuses
- Green
- Yellow
- Red

### Task Statuses
- Not Started
- In Progress
- Waiting
- Completed
- Blocked

### Deal Stages
- Qualified
- Discovery Scheduled
- Discovery Completed
- Proposal Sent
- Negotiation
- Won
- Lost

## 7) Event Logging Rules (Non-negotiable)
Every meaningful engagement touch creates an event.

An event must include:
- summary
- owner
- next step
- next step owner (if applicable)
- next step due date (if applicable)

System auto-log rules:
- Engagement stage changes auto-create event.
- Deliverable marked Delivered auto-creates event.
- Material-impact task completion requires/prompts event logging.

## 8) Alert Logic
Operational alerts trigger when:
- Overdue task exists.
- Engagement health is Red.
- Unpaid invoice is past due.
- Next milestone is overdue.
- Client notification required but not sent.
- Deal has no next step.
- Engagement has no event in last X days (v1 default: 7).

## 9) Dashboard Metric Definitions
- **Active Leads**: Lead.status not in (Converted, Closed Lost)
- **Deals in Pipeline**: Deal.stage not in (Won, Lost)
- **Active Engagements**: Engagement.stage not in (Completed, Paused)
- **Overdue Tasks**: Task.dueDate < today and Task.status != Completed
- **Unpaid Invoices**: FinanceRecord.status in (Sent, Overdue) and paymentReceived=false

## 10) Interaction Behavior
- Default state: Company Operations view.
- Click engagement card: open Engagement Focus view.
- Click task/event/deliverable/finance item: open right-side detail drawer.
- Drag card across stages: update stage + create event + animate transition.
- Back behavior: return to previous layer without losing context.

## 11) Seed Data (v1 demo)
- Leads: 3
- Deals: 2
- Clients: 3
- Engagements: 4
- Tasks: 8
- Events: 10
- Deliverables: 3
- FinanceRecords: 3

## 12) Design System Guidance
- Dark theme
- Card-based UI
- Progress bars, status badges, compact metrics
- Framer Motion transitions
- Slide-over detail panels
- Command-center feel over generic SaaS admin

## 13) Technical Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Supabase
- PostgreSQL
- Prisma
- Vercel

## 14) Acceptance Criteria
The app must:
- support login
- show dashboard metrics using defined formulas
- support create/edit for leads, deals, clients, engagements, tasks, events, deliverables, finance records
- allow engagement stage changes via drag/drop
- auto-create events for stage changes
- show activity feed
- open engagement focus view on engagement-card click
- open detail drawer for task/event/deliverable/finance click
- load seeded demo data successfully
