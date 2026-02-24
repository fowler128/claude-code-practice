## name: bizdeedz-leadgen-agent-core
## description: >
## BizDeedz LeadGen Agent Core. Use when building or running a lead generation agent for a law firm.
## Trigger when the user requests: lead sourcing, enrichment, dedupe, scoring, outreach automation,
## booking flows, call briefs, pipeline reporting, or n8n implementation. Defaults can be overridden
## by a clientconfig skill (e.g., Nicole Ezer).

# BizDeedz LeadGen Agent Core (Reusable Engine)

## Objective

Operationalize a full-funnel agent:

**Source → Enrich → Score → Outreach → Book → Pre-Qualify → Report**

---

## Default Configuration (can be overridden by client config skill)

| Setting | Default |
|---------|---------|
| Tooling | n8n |
| Channels | Email-first, LinkedIn-support |
| Cadence | 5 touches / 12 days for high-fit leads |
| Stop rules | Hard stop on opt-out; stop after max touches with no engagement |

---

## Required Inputs (Ask only if missing; proceed with assumptions otherwise)

1. Client lane: Employer OR Individual/Referral (default: Employer if unspecified)
2. Target geography + service constraints
3. Offer CTA (book consult / triage / audit)
4. Channels allowed and sending volume limits
5. Source of leads (Sheet/CRM, LinkedIn list, existing database)
6. Compliance constraints and brand boundaries

---

## Data Model (Single Source of Truth)

Minimum required fields:

| Field | Type | Notes |
|-------|------|-------|
| lead_id | string | Unique identifier |
| company_name | string | |
| website | string | |
| industry | string | |
| location | string | |
| employee_range | string | e.g., "50–200" |
| contact_name | string | |
| title | string | |
| email | string | Validated |
| linkedin_url | string | |
| stage | enum | See pipeline stages |
| source | string | Origin of lead |
| last_touch_at | datetime | |
| next_touch_at | datetime | Scheduler key |
| touch_count | integer | |
| fit_score | 0–50 | |
| intent_score | 0–30 | |
| timing_score | 0–20 | |
| total_score | 0–100 | Sum of above |
| sequence_id | string | A, B, or Nurture |
| opt_out | boolean | Hard stop flag |
| reply_summary | string | Classification |
| booked_datetime | datetime | |
| call_brief | text | Generated pre-call |

---

## Scoring Model (Default 0–100)

### Fit (0–50)
- Role match (decision leverage: partner, ops lead, managing attorney)
- Industry/practice area match
- Company size alignment
- Geography fit
- Contact accessibility

### Intent (0–30)
- Hiring signals
- Global mobility / sponsorship keywords in job postings
- Practice area expansion indicators
- Content engagement signals

### Timing (0–20)
- Near-term hiring activity
- Operational trigger events (new office, new practice, staff change)
- Responsiveness to prior touch

### Routing Rules

| Score | Action |
|-------|--------|
| 80–100 | Sequence A (direct book) |
| 60–79 | Sequence B (value-first) |
| <60 | Nurture only |

---

## Outreach Engine (Standard Sequences)

### Sequence A — High Fit (80–100)

5 touches over 12 days:

1. **Day 1:** Direct pain + ROI hook
2. **Day 3:** LinkedIn connect (short note, no pitch)
3. **Day 5:** Value asset or social proof
4. **Day 8:** Direct ask — 15-min triage/consult
5. **Day 12:** Breakup — "Should I close the loop?"

### Sequence B — Mid Fit (60–79)

5 touches over 14 days:

1. **Day 1:** Lead magnet / value asset
2. **Day 4:** Follow-up on asset + light ask
3. **Day 7:** LinkedIn connect
4. **Day 10:** Social proof + ask
5. **Day 14:** Breakup

### Nurture — Low Fit (<60)

- Monthly touch or quarterly check-in
- Content-driven (no hard CTA)

### Sequence Requirements (All sequences)

- Clear CTA in every touch
- Opt-out line in every email
- No outcome guarantees in copy
- Stop rules enforced (opt-out or touch limit reached)

---

## Booking + Pre-Qualification

When a positive reply is detected:

1. Send booking link (Calendly or equivalent)
2. Collect 5 pre-call questions (customize per client):
   - Current situation summary
   - Primary need / urgency
   - Decision timeline
   - Budget or investment range
   - How they heard about the firm
3. Generate **call brief** for the attorney/team:
   - Company snapshot (size, industry, location)
   - Why now (trigger identified)
   - Hypothesized pain point
   - Recommended talk track
   - Recommended next step (consult vs. retained engagement)

---

## Reporting Cadence (Weekly Dashboard)

| Metric | Definition |
|--------|------------|
| New leads | Net-new prospects ingested this week |
| Qualified % | Qualified ÷ total new leads |
| Messages sent | All email + LinkedIn touches |
| Reply rate | Replies ÷ messages sent |
| Booking rate | Booked ÷ engaged (positive reply) |
| Show rate | Showed ÷ booked |
| Pipeline by stage | Count per stage |
| Top failure reasons | Missing email, low fit, no response — flag and action |

---

## n8n Workflow Specifications (Module-by-Module)

### Module 1: Ingest + Normalize

- **Trigger:** Cron schedule or webhook (new row in sheet/CRM)
- **Actions:** Parse input, normalize fields, deduplicate, validate required fields, log errors

### Module 2: Enrich (Optional)

- **Trigger:** After ingest
- **Actions:** Append employee size, industry tags, hiring activity notes if available via API

### Module 3: Score + Route

- **Trigger:** After ingest/enrich
- **Actions:** Calculate fit/intent/timing scores, compute total_score, assign sequence_id, set stage=Queued, set next_touch_at

### Module 4: Send Outreach

- **Trigger:** next_touch_at reached
- **Actions:** Send email (SMTP/API) or create LinkedIn task, log touch_count, advance stage, schedule next follow-up or set stage=Max Touches

### Module 5: Reply Handler

- **Trigger:** Inbound email webhook or polling
- **Actions:** Detect reply, classify intent (positive / neutral / negative / opt-out), update stage, set opt_out=true if opt-out detected, halt sequence, notify owner if positive

### Module 6: Booking + Call Brief

- **Trigger:** Stage = Booked (calendar confirmation received)
- **Actions:** Collect pre-call form answers, generate call brief using template + lead data, deliver brief to attorney/ops via email or Slack

### Module 7: KPI Report

- **Trigger:** Monday 8AM cron
- **Actions:** Pull weekly metrics, format dashboard report, flag anomalies, deliver to owner via email or Slack

---

## Guardrails (Non-Negotiables)

- Do not store client PII; business contact data only.
- Do not provide legal advice in any automated message.
- Enforce opt-out immediately and permanently — no re-add without explicit consent.
- Enforce stop rules at max touch count.
- All claims in outreach copy must be factual and conservative; avoid "guaranteed results."
- Audit logging required on all stage transitions.
