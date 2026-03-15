# BizDeedz Mission Control - Workflow Matrix

## 1. Purpose

This matrix maps the 9 target BizDeedz workflows into build categories so engineering can decide what belongs in core Mission Control, what requires schema work, what requires automation work, and what should remain outside the core platform.

Each workflow is mapped into:
1. already supported by current schema
2. needs schema change
3. needs automation only
4. should stay outside core Mission Control

## 2. Category Definitions

### Already Supported by Current Schema
The current or near-current schema already has the core entities needed. Build work is mostly UI, workflow logic, and automation wiring.

### Needs Schema Change
The current schema is missing one or more first-class business objects or critical fields.

### Needs Automation Only
The record structure is sufficient, but orchestration, generation, or routing logic still needs to be built.

### Outside Core Mission Control
The workflow may still matter to BizDeedz, but it should live in a separate module or adjacent system rather than the core command center.

## 3. Matrix

| Workflow | Inside Core Mission Control? | Already Supported by Current Schema | Needs Schema Change | Needs Automation Only | Outside Core Mission Control |
|---|---|---:|---:|---:|---:|
| 1. Lead-to-Consult Qualification Router | Yes | Partial | Yes | Yes | No |
| 2. Consult-to-Proposal Autopilot | Yes | Minimal | Yes | Yes | No |
| 3. Client Onboarding + Kickoff Pack Generator | Yes | Partial | Light | Yes | No |
| 4. Ticketing + Task Ops | Yes | Partial | Yes | Yes | No |
| 5. Document Assembly Pipeline | Partly | Minimal | Yes | Yes | Partial |
| 6. QA + Risk Guardrails Agent | Yes | No | Yes | Yes | No |
| 7. Authority Content Repurposer | No, not core | No | No for core | Yes | Yes |
| 8. Client Expansion + Renewal Agent | Yes, phase 2 | Partial | Yes | Yes | No |
| 9. Finance Ops Agent | Yes | Partial | Yes | Yes | No |

## 4. Workflow-by-Workflow Detail

---

## Workflow 1 - Lead-to-Consult Qualification Router

### Outcome
Turn messy leads into booked calls and clean pipeline states.

### Core Trigger
New lead arrives from:
- form
- DM
- email
- referral
- spreadsheet import
- manual entry

### Mission Control Role
Mission Control should store:
- lead record
- enrichment status
- score summary
- route outcome
- owner
- next step
- booking status

### Current Support
Partially supported by:
- Lead
- Deal
- ownerId
- nextStep
- nextStepDueDate
- event logging potential

### Required Schema Additions
- enrichment payload
- ICP fit score
- pain intensity score
- budget probability score
- lead temperature (Hot/Warm/Cold/Parked)
- routed timestamp
- optional booking state

### Required Automation
- enrich lead signals
- score lead
- route lead
- draft outreach message
- generate booking CTA
- create follow-up tasks/events

### Human Gate
Human may approve or edit outreach before send in early phases.

### Knowledge Dependencies
- `knowledge/notes/sales/lead-scoring-framework.md`
- `knowledge/self/ideal-clients.md`
- `knowledge/notes/sales/objections-library.md`

### Build Classification
- **Needs schema change**
- **Needs automation**
- **Inside core Mission Control**

---

## Workflow 2 - Consult-to-Proposal Autopilot

### Outcome
Generate proposal and SOW package quickly and consistently.

### Core Trigger
- consult booked
- consult completed

### Mission Control Role
Mission Control should store:
- consult record
- pre-call brief
- post-call synthesis
- proposal versions
- pricing options
- sent/accepted status
- next step

### Current Support
Very lightly supported by:
- Deal
- Client
- Engagement
- generic Event

### Required Schema Additions
- Consult
- Proposal
- ProposalOption
- proposal status tracking

### Required Automation
- pre-call brief generation
- post-call synthesis
- proposal draft
- SOW scaffolding
- Standard and Premium version generation
- follow-up email draft

### Human Gate
Required for:
- scope
- pricing
- client send

### Knowledge Dependencies
- `knowledge/notes/sales/discovery-question-bank.md`
- `knowledge/notes/sales/proposal-positioning.md`
- `knowledge/templates/proposal-template.md`

### Build Classification
- **Needs schema change**
- **Needs automation**
- **Inside core Mission Control**

---

## Workflow 3 - Client Onboarding + Kickoff Pack Generator

### Outcome
Start delivery cleanly and reduce onboarding chaos.

### Core Trigger
- proposal accepted
- invoice paid
- engagement created

### Mission Control Role
Mission Control should store:
- onboarding run
- provisioning status
- kickoff agenda
- access checklist
- week 1 sprint backlog
- owner and due dates

### Current Support
Partially supported by:
- Client
- Engagement
- Task
- Deliverable

### Required Schema Additions
- OnboardingRun
- optional provisioning status fields
- optional kickoff artifact references

### Required Automation
- provision Drive folders
- provision Notion project
- generate kickoff agenda
- generate discovery checklist
- generate week 1 backlog
- create onboarding tasks/events

### Human Gate
Human reviews kickoff pack before external use in early phases.

### Knowledge Dependencies
- `knowledge/notes/delivery/onboarding-playbook.md`
- `knowledge/notes/delivery/sprint-structure.md`
- `knowledge/templates/client-note-template.md`

### Build Classification
- **Needs light schema change**
- **Needs automation**
- **Inside core Mission Control**

---

## Workflow 4 - Ticketing + Task Ops

### Outcome
Create a predictable work intake and delivery queue with accountability.

### Core Trigger
- ticket intake via form/email/message/manual
- task creation from workflow or delivery work

### Mission Control Role
Mission Control should store:
- tickets
- tasks
- category
- owner
- SLA
- priority
- escalation state
- completion state

### Current Support
Partially supported by Task only.

### Required Schema Additions
- Ticket
- SLA due date
- escalation level
- category / source / requester metadata

### Required Automation
- classify ticket
- assign owner
- set priority
- set SLA
- send digest
- escalate when at risk

### Human Gate
Escalation and reassignment may be overridden by human.

### Knowledge Dependencies
- `knowledge/notes/legal-ops/ticketing-for-law-firms.md`
- `knowledge/notes/legal-ops/workflow-mapping.md`
- `knowledge/notes/legal-ops/kpi-definitions.md`

### Build Classification
- **Needs schema change**
- **Needs automation**
- **Inside core Mission Control**

---

## Workflow 5 - Document Assembly Pipeline

### Outcome
Produce repeatable legal ops artifacts faster with review control.

### Core Trigger
- ticket type = document generation
- deliverable request
- onboarding artifact request
- audit artifact request

### Mission Control Role
Mission Control should track:
- document run
- deliverable record
- template used
- QA state
- approval state
- artifact location

### Current Support
Minimal support through Deliverable only.

### Required Schema Additions
- document run metadata
- approval gates
- template references
- artifact URLs

### Required Automation
- pull variables
- assemble template-based drafts
- run QA checklist
- generate fix list
- handoff to human approval

### Human Gate
Required for all client-facing outputs.

### Knowledge Dependencies
- `knowledge/templates/workflow-audit-template.md`
- `knowledge/templates/sop-template.md`
- `knowledge/notes/delivery/deliverable-standards.md`

### Build Classification
- **Needs schema change**
- **Needs automation**
- **Partly inside core Mission Control**
- actual document generation may execute through external tools

---

## Workflow 6 - QA + Risk Guardrails Agent

### Outcome
Reduce avoidable errors and protect brand/compliance posture.

### Core Trigger
- before deliverable release
- after document generation
- when flagged by workflow or human

### Mission Control Role
Mission Control should store:
- quality check
- risk flag
- severity
- owner
- resolution state
- related entity

### Current Support
Not meaningfully supported in current schema.

### Required Schema Additions
- QualityCheck
- RiskFlag

### Required Automation
- missing section check
- inconsistent naming check
- confidentiality flag
- scope creep flag
- policy gap check
- fix list generation

### Human Gate
Critical issues must be resolved or accepted by human.

### Knowledge Dependencies
- `knowledge/notes/delivery/qa-guardrails.md`
- `knowledge/notes/legal-ops/compliance-and-risk.md`

### Build Classification
- **Needs schema change**
- **Needs automation**
- **Inside core Mission Control**

---

## Workflow 7 - Authority Content Repurposer

### Outcome
Repurpose one input into multiple authority and conversion assets.

### Core Trigger
- voice note
- transcript
- webinar clip
- Loom
- article summary

### Mission Control Role
Mission Control may store:
- campaign metadata
- content requests
- attribution
But it should not become the primary content publishing product.

### Current Support
No meaningful support.

### Required Schema Additions
None required for core Mission Control.

### Required Automation
- generate posts
- generate hooks
- generate newsletter draft
- generate CTA variants

### Human Gate
Human reviews final branded content.

### Knowledge Dependencies
- `knowledge/notes/content/authority-post-patterns.md`
- `knowledge/notes/content/linkedin-hooks.md`
- `knowledge/templates/content-brief-template.md`

### Build Classification
- **Needs automation**
- **Should stay outside core Mission Control**
- suitable for adjacent Growth OS module

---

## Workflow 8 - Client Expansion + Renewal Agent

### Outcome
Increase retention and grow account value.

### Core Trigger
- day 14 / 30 / 60 review windows
- KPI improvements
- milestone completion
- approaching renewal date

### Mission Control Role
Mission Control should store:
- expansion opportunity
- renewal status
- success snapshots
- recommended next offers

### Current Support
Partially supported by Client, Engagement, and Finance.

### Required Schema Additions
- ExpansionOpportunity
- RenewalRecord
- optional KPI / success snapshot model

### Required Automation
- summarize wins
- identify expansion plays
- draft QBR deck summary
- draft renewal email
- draft upsell proposal

### Human Gate
Required before any external commercial send.

### Knowledge Dependencies
- `knowledge/self/offers.md`
- `knowledge/notes/delivery/deliverable-standards.md`
- `knowledge/notes/legal-ops/kpi-definitions.md`

### Build Classification
- **Needs schema change**
- **Needs automation**
- **Inside Mission Control, but phase 2 after core**

---

## Workflow 9 - Finance Ops Agent

### Outcome
Improve collections, forecast visibility, and target tracking.

### Core Trigger
- invoice sent
- invoice overdue
- payment recorded
- month-end / week-end reporting

### Mission Control Role
Mission Control should store:
- finance records
- payment status
- collections status
- target gap views
- account risk views

### Current Support
Partially supported by current invoice model.

### Required Schema Additions
- FinanceRecord as canonical model
- optional collection status fields
- optional client-level finance summaries via query layer

### Required Automation
- collections sequence
- at-risk account flagging
- weekly cash forecast
- pipeline forecast
- target gap reporting

### Human Gate
Finance communication tone and escalations may be reviewed by human.

### Knowledge Dependencies
- `knowledge/notes/legal-ops/kpi-definitions.md`
- `knowledge/notes/research/client-patterns.md`

### Build Classification
- **Needs schema change**
- **Needs automation**
- **Inside core Mission Control**

## 5. Recommended Build Order By Workflow

### Build First
1. Lead-to-Consult Qualification Router
2. Consult-to-Proposal Autopilot
3. Client Onboarding + Ticket Ops

### Build Second
4. QA + Risk Guardrails
5. Finance Ops
6. Client Expansion + Renewal

### Build Outside Core
7. Authority Content Repurposer

## 6. Engineering Summary

### Core Mission Control Workstreams
- operational core platform
- event and alert engine
- qualification and proposal engine
- onboarding and ticket engine
- QA and finance engine
- expansion support

### Adjacent Workstream
- Growth / Content Ops module

### Codex / Claude Code Guidance
Do not implement these as disconnected features.
Implement them as workflow modules that share:
- event logging
- dashboard visibility
- owner and next-step discipline
- human approval gates
- knowledge-file references
