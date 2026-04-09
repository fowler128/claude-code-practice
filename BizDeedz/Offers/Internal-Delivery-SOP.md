# AI Readiness Accelerator: Internal Delivery SOP

**Version:** 1.0
**Last Updated:** February 2026
**Owner:** Delivery Lead

---

## Table of Contents

1. [Engagement Checklist](#1-engagement-checklist)
2. [Phase A: Demand Capture](#2-phase-a-demand-capture)
3. [Phase B: Intake & Data Room](#3-phase-b-intake--data-room)
4. [Phase C: Readiness Assessment](#4-phase-c-readiness-assessment)
5. [Phase D: Use-Case Portfolio](#5-phase-d-use-case-portfolio)
6. [Phase E: Roadmap & Governance](#6-phase-e-roadmap--governance)
7. [Templates & Checklists](#7-templates--checklists)
8. [Automation Runbook](#8-automation-runbook)

---

## 1. Engagement Checklist

### Pre-Kickoff Checklist

- [ ] Discovery call completed
- [ ] Client qualifies (see fit criteria below)
- [ ] SOW sent and signed
- [ ] Initial payment received (50%)
- [ ] Kickoff meeting scheduled
- [ ] Client contact info captured in CRM
- [ ] Pre-call questionnaire sent

### Qualification Criteria (Must Have 4/5)

| Criterion | Indicator |
|-----------|-----------|
| Practice area fit | Bankruptcy, family, estate, civil litigation |
| Firm size | 5-50 attorneys |
| Has practice management | Clio, MyCase, PracticePanther, etc. |
| Has support staff | At least 1 paralegal or intake coordinator |
| Clear pain point | Intake, drafting, deadlines, or data chaos |

### Disqualification Triggers

- Solo practitioner with no staff
- No practice management system
- Active litigation hold affecting data access
- Budget below $4,000
- No decision-maker access within 14 days

---

## 2. Phase A: Demand Capture

### Objective
Convert attention into qualified, booked diagnostic call.

### Process Steps

| Step | Action | Owner | Automation |
|------|--------|-------|------------|
| A1 | Lead captured (form, LinkedIn, referral) | Marketing | Auto-log to CRM |
| A2 | Lead scored and routed | - | Auto-score based on form fields |
| A3 | Booking link sent | - | Auto-email with Calendly link |
| A4 | Confirmation + reminders | - | Auto-sequence (24hr, 1hr before) |
| A5 | Pre-call questionnaire sent | - | Auto-send on booking confirmation |
| A6 | Discovery call conducted | Delivery Lead | Manual |
| A7 | Scope locked, SOW sent | Delivery Lead | Manual (template-based) |
| A8 | Payment processed | - | Stripe/ACH |
| A9 | Kickoff scheduled | - | Auto-calendar on payment |

### Pre-Call Questionnaire Fields

```
1. Firm name
2. Primary practice area(s)
3. Number of attorneys
4. Number of support staff (paralegals, intake, admin)
5. Practice management software
6. Document management system
7. Biggest operational pain point (select top 2):
   - Intake bottlenecks
   - Drafting takes too long
   - Missed deadlines
   - Data chaos / can't find things
   - Client communication gaps
   - Rework / quality issues
   - Other: ___
8. Have you tried AI tools before? (Y/N)
9. If yes, what happened?
10. Who will be the decision-maker for this engagement?
11. What does success look like in 90 days?
```

---

## 3. Phase B: Intake & Data Room

### Objective
Collect all artifacts within 48 hours of kickoff.

### Data Room Structure

```
[CLIENT NAME] - AI Readiness/
├── 00-Admin/
│   ├── SOW-Signed.pdf
│   ├── Contacts.md
│   └── Timeline.md
├── 01-Org-and-Roles/
│   ├── org-chart.pdf
│   └── role-list.csv
├── 02-Tool-Stack/
│   ├── tools-inventory.csv
│   └── screenshots/
├── 03-Sample-Matters/
│   └── [10-20 redacted matter files]
├── 04-SOPs-Templates/
│   ├── intake-scripts/
│   ├── checklists/
│   ├── pleadings-templates/
│   └── email-templates/
├── 05-KPI-Exports/
│   ├── leads.csv
│   ├── consults.csv
│   ├── retainers.csv
│   └── cycle-times.csv
└── 06-Deliverables/
    └── [Output files go here]
```

### Artifact Checklist (Send to Client)

```markdown
## Required Artifacts for AI Readiness Assessment

Please upload the following to your secure data room by [DATE]:

### Organization (Folder: 01-Org-and-Roles)
- [ ] Org chart or team structure diagram
- [ ] List of roles that touch intake, drafting, filing, and client comms

### Technology (Folder: 02-Tool-Stack)
- [ ] List of software tools used (practice mgmt, email, DMS, billing, e-sign)
- [ ] Screenshots of main dashboards (optional but helpful)

### Sample Work (Folder: 03-Sample-Matters)
- [ ] 10-20 sample matters (redact client PII as needed)
- [ ] Mix of: new intake, in-progress, and closed matters

### Processes (Folder: 04-SOPs-Templates)
- [ ] Intake scripts or call guides
- [ ] Checklists used for case setup or filing
- [ ] Pleading or document templates
- [ ] Email templates for client communication

### Metrics (Folder: 05-KPI-Exports)
- [ ] Lead/intake volume (last 6-12 months)
- [ ] Consultation-to-retainer conversion data
- [ ] Filing cycle times (if tracked)
- [ ] Any rework or rejection tracking

---

Questions? Reply to this email or message [CONTACT].

Upload link: [DATA ROOM URL]
```

### Auto-Chase Sequence

| Day | Action |
|-----|--------|
| Day 0 | Initial artifact request |
| Day 1 | Status check ("anything blocking you?") |
| Day 2 | Escalation ("we need X to stay on schedule") |
| Day 3 | Call if incomplete |

---

## 4. Phase C: Readiness Assessment

### Objective
Score the firm across 6 pillars that predict AI success.

### Assessment Interview Guide

**Interview 1: Intake Coordinator (45-60 min)**

```
1. Walk me through what happens when a new lead calls or fills out a form.
2. How do you determine if someone is a good fit?
3. What information do you collect at first contact?
4. Where does that information get recorded?
5. How do you hand off to the attorney or paralegal?
6. What are the most common reasons a lead doesn't become a client?
7. What do you wish was easier or faster?
```

**Interview 2: Paralegal (60 min)**

```
1. Walk me through a typical new matter setup.
2. Where do you get the client information from?
3. What documents do you typically draft first?
4. Where do templates live? How current are they?
5. How do you track deadlines and filings?
6. What causes the most rework or delays?
7. How do you communicate status to clients?
8. What tools do you use daily? What's frustrating about them?
```

**Interview 3: Attorney (45-60 min)**

```
1. What's your biggest bottleneck right now?
2. How do you review paralegal work before filing?
3. What types of errors do you catch most often?
4. How confident are you in your current data/reporting?
5. What's your appetite for AI? Concerns?
6. Who would champion a new system? Who would resist?
7. What does success look like in 6 months?
```

### Assessment Scoring Rubric

**Score each pillar 0-5:**

| Score | Definition |
|-------|------------|
| 0 | Non-existent |
| 1 | Ad-hoc, inconsistent |
| 2 | Defined but not followed |
| 3 | Followed with exceptions |
| 4 | Consistent, measured |
| 5 | Optimized, continuously improving |

#### Pillar 1: Process Maturity

| Indicator | 0-1 | 2-3 | 4-5 |
|-----------|-----|-----|-----|
| Intake flow | No standard process | Written SOP exists | SOP followed, measured |
| Case setup | Different every time | Template exists | Automated checklist |
| Drafting | Start from scratch | Templates used | Version-controlled library |
| Filing | Manual, error-prone | Checklist exists | Tracked with SLAs |

#### Pillar 2: Data Quality

| Indicator | 0-1 | 2-3 | 4-5 |
|-----------|-----|-----|-----|
| Field consistency | Free-text chaos | Some dropdowns | Enforced taxonomy |
| Duplicate rate | >10% | 5-10% | <5% |
| Null/missing | >20% critical fields | 10-20% | <10% |
| Naming conventions | None | Informal | Enforced |

#### Pillar 3: Knowledge System

| Indicator | 0-1 | 2-3 | 4-5 |
|-----------|-----|-----|-----|
| Template location | Scattered, unknown | Central folder | Versioned library |
| SOPs | In people's heads | Written, outdated | Current, accessible |
| FAQ/playbooks | None | Informal | Documented, searchable |

#### Pillar 4: Tooling & Integrations

| Indicator | 0-1 | 2-3 | 4-5 |
|-----------|-----|-----|-----|
| Practice mgmt | Spreadsheets/paper | Basic PM tool | Mature PM with integrations |
| Document mgmt | Local drives | Shared drive | DMS with version control |
| Integrations | Copy-paste between | Some manual sync | API connections |

#### Pillar 5: Risk & Governance

| Indicator | 0-1 | 2-3 | 4-5 |
|-----------|-----|-----|-----|
| Data access | No controls | Role-based folders | Permissioned DMS |
| AI policy | None | Informal guidance | Written policy |
| Audit trail | None | Some logging | Complete audit trail |
| Retention | Ad-hoc | Written policy | Automated enforcement |

#### Pillar 6: Change Capacity

| Indicator | 0-1 | 2-3 | 4-5 |
|-----------|-----|-----|-----|
| Training history | No formal training | Occasional | Regular, documented |
| Adoption track record | Changes fail | Mixed results | Changes stick |
| Role clarity | Unclear ownership | Defined roles | Accountable owners |
| Executive support | Skeptical | Interested | Active sponsor |

### Data Profiling Checklist

Run on each CSV export:

```
- [ ] Row count
- [ ] Column inventory
- [ ] Null rate per column
- [ ] Duplicate detection (by key field)
- [ ] Date format consistency
- [ ] Outlier detection (numeric fields)
- [ ] Taxonomy analysis (categorical fields)
```

### Assessment Output

Internal workbook with:
- Pillar scores (0-5)
- Evidence notes for each score
- Direct quotes from interviews
- Data quality findings
- Key risks identified

---

## 5. Phase D: Use-Case Portfolio

### Objective
Select 3-5 AI opportunities that are feasible AND worth it.

### Use-Case Scoring Matrix

Score each candidate 1-5:

| Criterion | Weight | Definition |
|-----------|--------|------------|
| Volume | 25% | How often does this happen? |
| Repetitiveness | 20% | Same process each time? |
| Data availability | 20% | Is input data clean and accessible? |
| Impact | 20% | Time saved, errors reduced, revenue captured |
| Risk | 15% | What's the blast radius if AI fails? |

**Scoring:**
- Volume: 1=monthly, 3=weekly, 5=daily+
- Repetitive: 1=unique each time, 5=identical process
- Data: 1=unstructured chaos, 5=clean structured fields
- Impact: 1=minor convenience, 5=major capacity unlock
- Risk: 1=high (client-facing legal), 5=low (internal admin)

### Standard Use-Case Library

| Use Case | Typical Volume | Complexity | Risk |
|----------|----------------|------------|------|
| Intake triage + routing | High | Low | Medium |
| Document classification + filing | High | Low | Low |
| Deadline extraction + task creation | High | Medium | Medium |
| Template-based drafting assist | Medium | Medium | High |
| Client status updates | High | Low | Low |
| Missing document requests | Medium | Low | Low |
| Conflict check assistance | Medium | Medium | High |

### Use-Case One-Pager Template

```markdown
## [USE CASE NAME]

### Problem
[What pain does this solve? Current state.]

### Workflow
1. Trigger: [What kicks this off?]
2. Input: [What data/documents are needed?]
3. Process: [What does the automation do?]
4. Output: [What gets created/updated?]
5. Human checkpoint: [Where does a person review?]

### Controls
- [ ] Confidence threshold for escalation
- [ ] Human review before client-facing output
- [ ] Audit logging
- [ ] Exception handling

### Success Metrics
- Cycle time: [Before] → [After]
- Error rate: [Before] → [After]
- Volume capacity: [Before] → [After]

### Effort Estimate
- Implementation: [S/M/L]
- Change management: [S/M/L]
- Risk: [Low/Medium/High]

### ROI Projection
| Metric | Assumption | Value |
|--------|------------|-------|
| Hours saved/week | X tasks × Y min each | Z hours |
| Hourly value | Staff cost or billable | $XX |
| Annual value | (Hours × Rate × 50 weeks) | $XX,XXX |
| Implementation cost | Sprint(s) required | $XX,XXX |
| Payback period | Months | X months |
```

---

## 6. Phase E: Roadmap & Governance

### Objective
Deliver board-ready plan with clear next steps.

### Deliverables Checklist

- [ ] AI Readiness Scorecard (PDF)
- [ ] Risk Register (spreadsheet)
- [ ] Prioritized Roadmap (PDF + task board)
- [ ] Data Cleanup Plan (document)
- [ ] Use-Case Portfolio (PDF + one-pagers)
- [ ] Governance Starter Kit (document bundle)

### Scorecard Template Structure

```
Page 1: Executive Summary
- Overall readiness score (average of pillars)
- Top 3 strengths
- Top 3 gaps
- Recommended first move

Page 2: Pillar Scores
- Spider chart visualization
- Score breakdown by pillar
- Benchmark comparison (if available)

Pages 3-8: Pillar Details
- Score + rationale
- Key findings
- Recommendations

Page 9: Use-Case Portfolio Summary
- Ranked list with effort/impact/risk
- Recommended sequence

Page 10: Roadmap Overview
- 30/60/90 day milestones
- Dependencies
- Resource requirements

Page 11: Governance Summary
- Key policies needed
- Risk controls
- Next steps

Page 12: Appendix
- Data quality findings
- Interview summary
- Assumptions
```

### Risk Register Template

| Risk ID | Category | Description | Likelihood | Impact | Controls | Owner | Status |
|---------|----------|-------------|------------|--------|----------|-------|--------|
| R001 | Data | Inconsistent matter taxonomy | High | Medium | Standardize fields | Ops | Open |
| R002 | Compliance | No AI usage policy | High | High | Draft policy | Partner | Open |
| R003 | Adoption | Staff resistance | Medium | High | Training plan | Mgr | Open |

### Governance Starter Kit Contents

**Document 1: AI Acceptable Use Policy (2-3 pages)**

```markdown
## Purpose
This policy governs the use of AI tools at [FIRM NAME].

## Scope
Applies to all attorneys, paralegals, and staff.

## Approved Uses
- Document classification and filing
- Deadline extraction and task creation
- Drafting assistance using approved templates
- Internal research and summarization
- Client communication drafts (with human review)

## Prohibited Uses
- Legal advice to clients without attorney review
- Submission of AI output without human verification
- Use of client data in public AI tools (ChatGPT, etc.)
- Creating final work product without attorney sign-off

## Human Review Requirements
- All client-facing output requires attorney review
- All legal analysis requires attorney verification
- All filings require human quality check

## Data Protection
- Client data may only be used with approved, secure AI tools
- No client PII in prompts to public models
- All AI interactions must be logged

## Compliance
Violations subject to disciplinary action.
```

**Document 2: Access & Permissions Model**

```markdown
## Role-Based Access

| Role | Practice Mgmt | DMS | AI Tools | Client Data |
|------|---------------|-----|----------|-------------|
| Partner | Full | Full | Full | Full |
| Associate | Full | Full | Full | Assigned |
| Paralegal | Edit | Edit | Supervised | Assigned |
| Intake | Create | Read | None | Limited |
| Admin | Read | Read | None | None |
```

**Document 3: Human-in-the-Loop Rules**

```markdown
## Escalation Triggers

AI output requires human review when:
- Confidence score < 85%
- New matter type not in training set
- Client-facing communication
- Filing or court submission
- Any fee-related calculation
- Conflict check results

## Exception Handling

When AI fails or flags uncertainty:
1. Route to designated human reviewer
2. Log exception with context
3. Complete task manually
4. Flag for model improvement review
```

---

## 7. Templates & Checklists

### Discovery Call Script

```
"Thanks for taking the time today. I'd like to understand your
current situation, your goals around AI, and whether we're a
good fit to help.

1. Tell me about your firm—practice areas, size, structure.

2. What's driving your interest in AI right now?

3. What's your biggest operational pain point today?

4. What tools are you currently using for practice management,
   documents, and client communication?

5. Have you tried any AI tools? What happened?

6. If we could wave a magic wand, what would be different in
   90 days?

7. Who else would be involved in a decision like this?

8. What questions do you have for me?

---

[If qualified]

Here's what I'm thinking: Our AI Readiness Accelerator is a
10-14 day engagement where we assess your operations, identify
the 3-5 AI opportunities that are actually worth pursuing, and
give you a roadmap with the governance controls to do it safely.

It's $4,500 fixed-fee. If you're interested, I can send over a
scope of work today and we could kick off as early as [DATE].

What questions do you have?"
```

### Executive Readout Agenda (90 min)

```
1. Welcome + context (5 min)
2. Scorecard walkthrough (20 min)
3. Risk register highlights (10 min)
4. Use-case portfolio deep dive (20 min)
5. Roadmap presentation (15 min)
6. Governance overview (10 min)
7. Discussion + Q&A (10 min)
8. Next steps + close (5 min)
```

### Post-Engagement Handoff Checklist

- [ ] All deliverables uploaded to client data room
- [ ] Client execution board created (Notion/Planner)
- [ ] Final invoice sent
- [ ] Feedback request sent (NPS + testimonial ask)
- [ ] CRM updated with outcome
- [ ] Implementation proposal sent (if requested)
- [ ] 30-day follow-up scheduled

---

## 8. Automation Runbook

### What to Automate

| Process | Tool | Trigger | Action |
|---------|------|---------|--------|
| Lead capture → CRM | Make/Zapier | Form submit | Create CRM record + tag |
| Lead scoring | Make | CRM record created | Calculate score, route |
| Booking confirmation | Calendly | Event booked | Send confirmation + pre-call form |
| Reminder sequence | Make | Event -24h, -1h | Send reminder emails |
| Data room creation | Make | SOW signed | Create folder structure in Drive |
| Artifact checklist | Make | Data room created | Send checklist email + create tasks |
| Chase sequence | Make | Day 1, 2, 3 | Send follow-up if incomplete |
| Report generation | Google Docs | Assessment complete | Populate template from data |
| Invoice creation | Stripe/QBO | Milestone reached | Generate and send invoice |
| Follow-up scheduling | Make | Engagement complete | Create 30-day task |

### Make.com Scenario Outlines

**Scenario 1: Lead → CRM → Booking**

```
Trigger: Typeform/Webflow form submission
→ Parse form fields
→ Create Notion/Airtable record
→ Calculate lead score (weighted fields)
→ If score >= threshold:
   → Send Calendly link email
   → Tag as "Qualified"
→ Else:
   → Send "not a fit" email
   → Tag as "Disqualified"
```

**Scenario 2: Booking → Pre-Call Prep**

```
Trigger: Calendly event created
→ Create CRM deal/opportunity
→ Send pre-call questionnaire (Typeform)
→ Schedule reminder emails (-24h, -1h)
→ Create prep task for delivery lead
```

**Scenario 3: Payment → Kickoff**

```
Trigger: Stripe payment received
→ Update CRM status
→ Create Google Drive folder structure
→ Add client to shared Drive
→ Send welcome email with data room link
→ Send artifact checklist
→ Create intake task with Day 2 deadline
```

**Scenario 4: Artifact Chase**

```
Trigger: Daily at 9am
→ Check data room for required files
→ For each client with incomplete room:
   → If Day 1: Send "anything blocking you?"
   → If Day 2: Send "we need X to stay on schedule"
   → If Day 3: Create escalation task + Slack alert
```

---

## Appendix: File Naming Conventions

```
[CLIENT]-[DOC TYPE]-[VERSION]-[DATE].ext

Examples:
- AcmeLaw-Scorecard-v1-2026-02-15.pdf
- AcmeLaw-UseCase-IntakeRouting-v1.md
- AcmeLaw-Roadmap-v2-2026-02-20.pdf
```

---

*End of Internal Delivery SOP*
