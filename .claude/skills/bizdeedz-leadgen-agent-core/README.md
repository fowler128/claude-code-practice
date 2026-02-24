# BizDeedz LeadGen Agent Core Skill

Reusable full-funnel lead generation engine for law firms: Source → Enrich → Score → Outreach → Book → Pre-Qualify → Report. Defaults can be overridden by a client-specific config skill.

## Triggers

Use this skill when the user asks about:
- Lead sourcing, enrichment, or deduplication
- Lead scoring logic or routing rules
- Outreach sequences or follow-up cadence
- Booking flows or pre-call brief generation
- Pipeline reporting or weekly KPI dashboards
- n8n workflow implementation for any part of the funnel

## Funnel Stages

```
Source → Enrich → Score → Route → Outreach → Reply → Book → Brief → Report
```

## Scoring Model

| Component | Weight | Key Signals |
|-----------|--------|-------------|
| Fit | 0–50 | Role, industry, size, geography |
| Intent | 0–30 | Hiring signals, practice expansion, content engagement |
| Timing | 0–20 | Near-term triggers, responsiveness |

| Score | Sequence |
|-------|----------|
| 80–100 | A — Direct book (5 touches / 12 days) |
| 60–79 | B — Value-first (5 touches / 14 days) |
| <60 | Nurture (monthly/quarterly) |

## n8n Modules

| Module | Trigger |
|--------|---------|
| 1 Ingest + Normalize | Cron / webhook |
| 2 Enrich | After ingest |
| 3 Score + Route | After enrich |
| 4 Send Outreach | next_touch_at reached |
| 5 Reply Handler | Inbound reply |
| 6 Booking + Call Brief | Stage = Booked |
| 7 KPI Report | Monday 8AM |

## Output Formats

- **A** — Full agent spec (all 7 modules)
- **B** — Scoring model + routing rules
- **C** — Outreach sequences (ready-to-send copy)
- **D** — Call brief template
- **E** — KPI dashboard spec + weekly report template
- **F** — n8n module spec (individual module)

## File Layout

```
.claude/skills/bizdeedz-leadgen-agent-core/
├── skill.md     ← main skill prompt (loaded by Claude Code)
└── README.md    ← this file
```
