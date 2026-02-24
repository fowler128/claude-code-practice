# BizDeedz AI Readiness Campaign Skill

Builds and runs the pipeline machine for AI Readiness Assessment consult bookings — outbound sequences, LinkedIn content, KPI tracking, and n8n automation specs.

## Triggers

Use this skill when the user asks about:
- Campaign plan or outreach sequences
- Follow-up cadence or SLA discipline for pipeline
- LinkedIn content prompts (conversion-focused)
- Pipeline stages or CRM setup
- Weekly KPI reporting
- Lead magnets
- Automation specs for campaign ops (n8n/Make.com)

## Campaign Architecture

| Wave | Goal | Timeline |
|------|------|----------|
| 1 | Build list + validate ICP | Weeks 1–2 |
| 2 | Book consults | Weeks 2–6 |
| 3 | Close + deliver assessments | Weeks 3–10 |
| 4 | Upsell Phase 2 | Ongoing |

## Sequences

| Sequence | Audience | Touches | Duration |
|----------|----------|---------|----------|
| A — Direct ROI | Ops leads / paralegals | 5 | 12 days |
| B — Executive | Managing partners | 4 | 10 days |
| C — Value Asset | Low-intent / content leads | 3 | 14 days |

## Key KPIs

Reply rate · Booking rate · Show rate · Proposal-to-win conversion · Time-to-close · Opt-out rate

## Output Formats

- **A** — Campaign plan (2–6 weeks or 90 days)
- **B** — 3 outreach sequences + follow-up calendar
- **C** — LinkedIn content prompts (30-day pack)
- **D** — KPI dashboard spec + weekly report template
- **E** — n8n workflow specs (ingest, send, reply, report)

## File Layout

```
.claude/skills/bizdeedz-ai-readiness-campaign/
├── skill.md     ← main skill prompt (loaded by Claude Code)
└── README.md    ← this file
```
