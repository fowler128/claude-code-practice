# BizDeedz Workflow Architect Skill

A Claude Code skill for designing, auditing, and systematizing law firm operations using BizDeedz methodology.

## Triggers

Use this skill when the user asks about:
- Workflow design, process mapping, or SOPs
- Intake systems or automation plans (Make.com / n8n)
- Operational audits or stabilization sprints
- Rework reduction or client delivery scopes
- Productized offers or 7-step delivery plans
- Current/future state maps, SOP packs, automation specs, or KPI dashboards

## 7-Step Delivery Framework

| Step | Name | Gate |
|------|------|------|
| 1 | Intake + Qualification | Gate 0 — confirm fit + scope |
| 2 | Workflow Audit (Current-State) | — |
| 3 | Root Cause + Prioritization | — |
| 4 | Future-State Design (Blueprint) | — |
| 5 | Build + Systematize | SOPs, templates, automation specs |
| 6 | Implement + Change Adoption | Go-live with training + rollback |
| 7 | Optimize + Governance | KPI cadence, continuous improvement |

## Output Formats

- **A** — Client-facing proposal scope
- **B** — 7-step delivery plan
- **C** — Current-state + future-state process map
- **D** — SOP pack with QA checklists
- **E** — Automation spec (Make.com / n8n ready)
- **F** — KPI dashboard spec

## Pricing Tiers

| Tier | Scope | Range |
|------|-------|-------|
| Tier 1 — Audit Only | Steps 1–3 | $2,500–$5,000 |
| Tier 2 — Blueprint + Assets | Steps 1–5 | $7,500–$15,000 |
| Tier 3 — Build + Launch | Steps 1–7 | $15,000–$35,000 |
| Retainer | Monthly cadence | $1,500–$7,500/mo |

## File Layout

```
.claude/skills/bizdeedz-workflow/
├── skill.md     ← main skill prompt (loaded by Claude Code)
└── README.md    ← this file
```
