## name: bizdeedz-ai-readiness-campaign
## description: >
## BizDeedz AI Readiness Campaign skill. Use whenever Turea/BizDeedz needs to generate
## pipeline for AI Readiness via outbound, follow-ups, content prompts, and KPI tracking.
## Trigger when the user asks for: campaign plan, outreach sequences, follow-up cadence,
## LinkedIn content prompts, pipeline stages, weekly reporting, lead magnets, or automation.

# BizDeedz AI Readiness Campaign Engine

## Purpose

Create a repeatable pipeline machine that consistently books consults for AI Readiness:
- outreach sequences that do not feel spammy
- follow-ups with SLA discipline
- content that converts (LinkedIn-first)
- reporting that forces operational truth

---

## Default Campaign Architecture (90-day, can be compressed)

- **Wave 1:** Build list + validate ICP (Weeks 1–2)
- **Wave 2:** Book consults (Weeks 2–6)
- **Wave 3:** Close + deliver assessments (Weeks 3–10)
- **Wave 4:** Upsell Phase 2 (ongoing)

---

## Required Inputs (Ask only if missing; proceed with assumptions otherwise)

1. Target segment (bankruptcy, immigration, PI, family, etc.)
2. Lane: managing partner vs ops lead vs senior paralegal lead
3. Channels allowed: email, LinkedIn, SMS (default: email + LinkedIn)
4. Tooling: CRM/Sheet + automation tool (default: n8n-ready)
5. Offer tier + price anchor
6. Weekly capacity (how many assessments can be delivered)

---

## Pipeline Stages (Standard)

| Stage | Definition |
|-------|------------|
| Prospect Identified | In list, not yet contacted |
| Qualified | Fit confirmed (segment, size, pain signals) |
| Contacted | First touch sent |
| Engaged | Reply or measurable interaction |
| Booked | Consult scheduled |
| Proposal Sent | Assessment scope + price delivered |
| Won | Signed + paid |
| Nurture | No engagement yet; drip continues |
| Closed Lost | No-go after qualification or proposal |
| Opt-Out | Hard stop — remove from all sequences |

---

## KPI Definitions (Weekly scoreboard)

| KPI | Definition |
|-----|------------|
| New prospects added | Net-new ICP contacts this week |
| % qualified | Qualified ÷ total prospects |
| Touches sent | Emails + LinkedIn messages |
| Reply rate | Replies ÷ touches sent |
| Booking rate | Booked ÷ engaged |
| Show rate | Showed ÷ booked |
| Proposal-to-win conversion | Won ÷ proposals sent |
| Time-to-close | Median days from first touch to Won |
| Opt-out rate | Opt-outs ÷ touches (health metric — flag if >2%) |

---

## Outreach Sequences (Defaults)

### Sequence A: Direct ROI (for ops pain contacts)

5 touches over 12 days:

1. **Email 1 (Day 1):** "Where rework is hiding" — pain + stat
2. **LinkedIn connect (Day 3):** brief note, no pitch
3. **Email 2 (Day 5):** "Foundation before tools" — positioning
4. **Email 3 (Day 8):** "Quick 15-min triage" — direct ask
5. **Breakup (Day 12):** "Should I close the loop?"

### Sequence B: Executive (for managing partners)

4 touches over 10 days:

1. **Email 1 (Day 1):** "AI investment failure pattern" — credibility
2. **Email 2 (Day 4):** "What readiness prevents" — ROI framing
3. **LinkedIn connect (Day 7):** note referencing email
4. **Breakup (Day 10)**

### Sequence C: Value Asset (low-intent / content-engaged leads)

3 touches over 14 days:

1. **Email 1 (Day 1):** Send 1-page checklist/lead magnet
2. **Email 2 (Day 7):** "Want the template?" — follow-up offer
3. **Breakup (Day 14)**

---

## Content Prompts (LinkedIn, conversion-focused)

Publish minimum 2 posts/week. Rotate these angles:

1. **"Automation amplifies chaos"** — story + specific example of bad automation on bad process
2. **"Tool failure post-mortem"** — why legal tech doesn't stick (no process baseline)
3. **"Before/after workflow"** — screenshot or text description (redacted/anonymized)
4. **"3 KPIs every firm should track"** — rework %, cycle time, SLA hit rate
5. **"AI readiness myth-busting"** — "AI is not a magic intern"
6. **"Ops cadence"** — simple weekly rhythm that prevents drift

---

## Lead Magnet Defaults (Choose one per campaign)

- **AI Readiness Checklist** (8–12 bullets across readiness dimensions)
- **Deadline Integrity Audit** (mini checklist: do you have these 7 controls?)
- **"Stop Buying Tools First"** (1-page playbook: standardize → automate → optimize)

---

## Non-Negotiables (Compliance + Deliverability)

- Always include an opt-out path in every email sequence.
- Stop rules: after 5 touches with zero engagement, move to Nurture.
- No misleading claims or outcome guarantees in any copy.
- Avoid client PII in all outreach messages and campaign systems.
- Flag reply-rate drops below 2% — sequence copy or ICP needs review.

---

## Automation Hooks (n8n-ready specs)

Provide specs for these modules when requested:

| Module | Trigger | Action |
|--------|---------|--------|
| List ingest + dedupe | New row in sheet/CRM | Check duplicate, add if clean |
| Stage transitions | Reply detected or stage updated | Timestamp + notify owner |
| Follow-up scheduler | next_touch_at field | Enqueue message at scheduled time |
| Reply classification | Email/LinkedIn reply received | Route: positive → Booked, neutral → continue, negative/opt-out → stop |
| Weekly KPI report | Every Monday 8AM | Pull metrics, format report, deliver to owner |

---

## Output Formats

| Format | When to Use |
|--------|-------------|
| A) Campaign plan (2–6 weeks or 90 days) | Full pipeline build |
| B) 3 outreach sequences + follow-up calendar | Ready-to-send sequences |
| C) LinkedIn content prompts (30-day pack) | Content pipeline |
| D) KPI dashboard spec + weekly ops report template | Tracking cadence |
| E) n8n workflow specs | Automation build specs |
