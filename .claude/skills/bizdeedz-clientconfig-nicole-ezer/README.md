# ClientConfig: Nicole Ezer Skill

Client-specific configuration overlay for Nicole Ezer's employer-lane immigration law lead generation agent. Layer this on top of `bizdeedz-leadgen-agent-core` to lock in ICP, CTA, tone, compliance boundaries, and escalation rules.

## Triggers

Use this skill when working on Nicole Ezer's agent specifically and you need:
- ICP definition or company targeting parameters
- CTA language or booking flow configuration
- Tone and voice guardrails
- Scoring overrides or routing adjustments
- Attorney approval escalation rules
- Pre-call question templates
- Pilot success metrics

## Skill Dependency Map

```
bizdeedz-clientconfig-nicole-ezer   ← THIS FILE (client overrides)
        ↓
bizdeedz-leadgen-agent-core         ← engine (scoring, sequences, n8n modules)
        ↓
bizdeedz-ai-readiness-offer         ← offer context (scope + pricing)
        ↓
bizdeedz-ai-readiness-campaign      ← pipeline ops (sequences, LinkedIn, KPIs)
```

## Quick Reference

| Setting | Value |
|---------|-------|
| Lane | Employer (B2B) |
| Primary ICP | HR Director, GC, VP People, COO |
| CTA | 15-min employer immigration triage |
| Geography | Texas-first |
| Company size | 50–500 primary; 500–5,000 secondary |
| Tone | Professional, compliance-forward, no hype |
| Seq A threshold | 80+ (decision-maker confirmed) |
| Seq B threshold | 60–79 |
| Nurture | <60 |

## Escalation Rule (Attorney Gate)

Agent must pause for Nicole approval if:
- Lead asks a substantive legal question
- Lead requests written guidance
- Message contains legal conclusions
- Lead is high-profile or sensitive

## File Layout

```
.claude/skills/bizdeedz-clientconfig-nicole-ezer/
├── skill.md     ← main skill prompt (loaded by Claude Code)
└── README.md    ← this file
```
