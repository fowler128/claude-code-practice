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

## 15) Field Defaults, Rules, and UX Constraints

### Field Defaults
Unless otherwise specified, timestamps are auto-generated by the system.

### Default Values
- Lead.status = "New"
- Deal.stage = "Qualified"
- Engagement.stage = "Discovery"
- Engagement.healthStatus = "Green"
- Engagement.progressPercent = 0
- Task.status = "Not Started"
- Task.materialImpact = false
- Event.clientNotificationRequired = false
- Event.clientNotificationSent = false
- FinanceRecord.status = "Draft"
- FinanceRecord.paymentReceived = false

### Auto-generated Fields
- id = UUID
- createdAt = auto timestamp
- updatedAt = auto timestamp (when record changes)

### Required Fields

#### Lead
**Required:**
- companyName
- contactName
- status
- ownerId

**Optional:**
- source
- nextStep
- nextStepDueDate

#### Deal
**Required:**
- leadId
- name
- stage
- ownerId

**Optional:**
- value
- nextStep
- nextStepDueDate

#### Client
**Required:**
- name

**Optional:**
- primaryContact
- salesOwnerId
- createdFromDealId

#### Engagement
**Required:**
- clientId
- name
- stage
- ownerId

**Optional:**
- offerType
- startDate
- targetEndDate
- nextMilestone
- nextMilestoneDueDate
- progressPercent
- healthStatus

#### Task
**Required:**
- engagementId
- title
- status
- ownerId

**Optional:**
- materialImpact
- dueDate

#### Event
**Required:**
- engagementId
- type
- summary
- ownerId

**Optional:**
- notes
- nextStep
- nextStepOwnerId
- nextStepDueDate
- clientNotificationRequired
- clientNotificationSent

#### Deliverable
**Required:**
- engagementId
- name
- status
- ownerId

**Optional:**
- dueDate
- deliveredAt

#### FinanceRecord
**Required:**
- engagementId
- type
- amount
- status

**Optional:**
- invoiceNumber
- dueDate
- paymentReceived

### Engagement Progress Logic
For v1, engagement progress is calculated automatically using task completion.

`progressPercent = (completed tasks / total tasks) * 100`

Rules:
- If engagement has zero tasks, progressPercent = 0
- Progress rounded to nearest whole number
- Progress recalculates whenever task status changes

### Alert Severity Rules
Alerts should be categorized into Critical and Warning.

#### Critical Alerts
Trigger when:
- unpaid invoice is past due
- engagement healthStatus = Red
- next milestone overdue by more than 3 days

Dashboard behavior:
- Critical alerts appear first
- Highlighted visually in red

#### Warning Alerts
Trigger when:
- overdue task exists
- clientNotificationRequired = true but clientNotificationSent = false
- deal has no nextStep
- engagement has no event logged in last 7 days

Dashboard behavior:
- Display max 5 alerts
- Sort by severity then oldest first
- Collapse duplicates for same engagement

### Engagement Focus View Contents
When an engagement card is opened, the Engagement Focus View must display:
- engagement name
- client name
- offer type
- stage
- health status
- owner
- progressPercent
- next milestone
- next milestone due date

Operational panels should include:
- tasks list
- deliverables list
- finance summary
- recent events timeline
- engagement alerts

### Detail Drawer Behavior
Clicking an object opens a right-side slide-over drawer.

#### Task Drawer
- title
- status
- owner
- due date
- materialImpact

#### Event Drawer
- type
- summary
- notes
- owner
- nextStep
- nextStepOwnerId
- nextStepDueDate
- notification flags

#### Deliverable Drawer
- name
- status
- owner
- due date
- deliveredAt

#### Finance Drawer
- type
- invoiceNumber
- amount
- dueDate
- status
- paymentReceived

### Conversion UX Rules

#### Lead -> Deal
When converting a lead:
1. Open modal prefilled with lead data.
2. Allow editing deal fields:
   - deal name
   - stage
   - value
   - owner
3. After confirmation:
   - create Deal
   - update Lead.status = Converted

#### Deal -> Client -> Engagement
When deal stage becomes Won:
1. Open modal prefilled with deal data.
2. Create Client.
3. Create Engagement linked to Client.

Rules:
- Client must be created before Engagement
- If engagement creation fails, rollback conversion
- Show success confirmation when both records exist

### Interaction Consistency Rules
- Click engagement card -> open Engagement Focus View
- Click task/event/deliverable/finance -> open Detail Drawer
- Drag engagement card across stage -> update stage + create event
- Back navigation returns to previous dashboard layer

### Why This Section Matters
This section removes the last major sources of ambiguity for Codex:
- field defaults
- required fields
- progress logic
- alert priority
- interaction details
- conversion UX

Without this, Codex must guess behavior, which leads to inconsistent builds.
With this, Codex can implement deterministic logic.

