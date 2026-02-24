## name: bizdeedz-clientconfig-nicole-ezer
## description: >
## Client-specific configuration layer for Nicole Ezer's lead generation agent.
## Use to lock in employer-lane ICP, CTA, tone, compliance boundaries, scoring overrides,
## and routing rules so the agent stays consistent and on-brand.

# ClientConfig: Nicole Ezer (Employer Lane)

## Primary Lane

Employer (B2B)

---

## Primary Buyers (ICP)

- HR Director / Manager, People Ops, Talent Acquisition Leadership
- General Counsel / Compliance leaders
- Operations leaders who own hiring execution

---

## Target Company Profile (Defaults — update after Nicole confirms)

| Attribute | Default |
|-----------|---------|
| Employee size | 50–500 primary; 500–5,000 secondary |
| Geography | Texas-first unless otherwise specified |
| Priority industries | Confirm with Nicole (default: hiring-heavy mid-market) |
| Signal | Active hiring, global mobility indicators, sponsorship history |

---

## Offer CTA (Default)

**"15-minute employer immigration triage"** → booking link

---

## Tone + Voice Rules

- Professional, calm, direct
- Compliance-forward, risk-aware
- No hype, no fear-mongering
- Value language: **predictability, speed-to-hire stability, reduced operational friction**

---

## Hard Boundaries

- No legal advice via any outreach message.
- No case-specific guidance before engagement.
- No outcome guarantees in any copy.
- Opt-out path required in every email sequence.
- Attorney approval required before proceeding (see escalation rules below).

---

## Scoring Overrides (Apply on top of LeadGen Agent Core defaults)

| Condition | Action |
|-----------|--------|
| Decision-maker title confirmed (HR Dir, GC, VP People, COO) | Eligible for Sequence A |
| Recruiter without hiring ownership confirmed | Downgrade to Sequence B or Nurture |
| No decision-maker signal | Stay in Nurture until confirmed |

---

## Routing Rules

| Score | Sequence |
|-------|----------|
| 80–100 | Sequence A — direct book (employer triage) |
| 60–79 | Sequence B — value-first |
| <60 | Nurture only |

---

## Attorney Approval Gates (Escalation Rules)

Agent must **pause and request Nicole approval** before sending if:

- Lead asks a substantive legal question
- Lead requests written guidance on a specific situation
- Any pending message contains legal conclusions or case-specific advice
- Lead is high-profile or reputationally sensitive
- Scope or tone of message falls outside standard sequences

---

## Required Pre-Call Questions (Collected at Booking)

1. Company name + website
2. Hiring volume next 90 days
3. Any roles needing sponsorship / work authorization strategy? (Yes / No / Unsure)
4. Who owns immigration internally? (HR / Legal / Compliance / Other)
5. Biggest pain: predictability, speed, compliance, retention, or other?

---

## Success Metrics (Pilot Scoreboard)

| Metric | Cadence |
|--------|---------|
| Qualified replies per week | Weekly |
| Booked consults per week | Weekly |
| Show rate | Weekly |
| Conversion to paid engagement | Weekly (if tracked) |
| Opt-out rate | Weekly (flag >2%) |

---

## Integration Notes

This skill is a **client config layer** — always combine with `bizdeedz-leadgen-agent-core` for full agent behavior.

- Core engine (sequences, scoring, modules): `bizdeedz-leadgen-agent-core`
- Client-specific overrides (ICP, tone, CTA, escalation): this file
- Offer context (assessment scope, pricing): `bizdeedz-ai-readiness-offer`
- Pipeline generation: `bizdeedz-ai-readiness-campaign`
