## name: bizdeedz-ai-readiness-offer
## description: >
## BizDeedz AI Readiness Offer skill. Use whenever Turea/BizDeedz needs to sell, scope,
## price, or deliver the AI Readiness Assessment (Scorecard) for a law firm.
## Trigger when the user asks for: AI readiness, assessment scope, deliverables, pricing,
## proposal language, close scripts, objection handling, or "what do I say on the call."
## This skill standardizes the offer so we never freestyle.

# BizDeedz AI Readiness Offer

## Purpose

Productize the AI Readiness Assessment into a consistent, premium, repeatable offer that:
- sells cleanly in 20–30 minutes
- scopes tightly (no scope creep)
- produces standardized deliverables
- sets up the Phase 2 implementation upsell

---

## Positioning (Non-Negotiable)

- Foundation before tools: standardize first, automate second.
- The deliverable is clarity, prioritization, and execution readiness.
- Outcome language: reduce rework, stabilize deadlines, accelerate cycle time, increase throughput.
- Compliance-aware: auditability and governance are part of readiness.

---

## Ideal Buyer

- Small-to-mid law firms who want AI but have operational friction (handoffs, templates, deadlines, intake chaos).
- Workflow owners: managing partner, ops lead, senior paralegal lead, practice manager.

---

## Disqualifiers (No-Fit)

- "We want AI to replace legal judgment" or "we want guaranteed outcomes."
- No willingness to document workflow steps or share non-PII process detail.
- Wants tool purchasing only, no operational discipline.

---

## Required Inputs (Ask only if missing; otherwise proceed with labeled assumptions)

1. Practice area(s) and primary workflow target
2. Tool stack (case mgmt/CRM, MS365/Google, forms, e-sign, billing)
3. Volume (matters/month) + team size
4. Pain points (rework, missed deadlines, intake, slow turnaround, client comms)
5. Desired outcomes (targets + timeline)
6. Constraints (compliance gates, court deadlines, approval rules)

---

## Offer Structure (Core Product)

### Offer Name
AI Readiness Assessment (Scorecard + Stabilization Roadmap)

### Standard Timeline
5–7 business days from kickoff to delivery.

### Standard Deliverables (What They Get)

1. Readiness Scorecard (maturity scoring across key dimensions)
2. Current-state workflow map (one critical workflow end-to-end)
3. Pain heatmap + risk register (severity × frequency + compliance impact)
4. "Do this first" prioritized backlog (ROI × risk)
5. 30/60/90 stabilization roadmap (what to standardize, what to automate, what to ignore)
6. Automation opportunity brief (Make/n8n candidates + guardrails)
7. Governance starter kit:
   - SLA targets
   - Escalation rules
   - Ownership (RACI)
   - Audit logging requirements (where it matters)

### What This Is NOT (Scope Guardrails)

- Not legal advice.
- Not implementation of tools/automations (that is Phase 2).
- Not a full-firm process overhaul (we focus on 1–2 workflows max in the assessment).

---

## Scoring Dimensions (Default)

Use these unless the user specifies different categories:

- Workflow integrity (handoffs, clarity, exception handling)
- Data quality (intake completeness, required fields, templates)
- Tool utilization (stack alignment, duplication, shadow systems)
- Risk + compliance controls (deadlines, approvals, audit trail)
- Knowledge management (SOPs, checklists, training)
- Reporting + metrics (KPIs, visibility, bottlenecks)
- Automation readiness (trigger stability, standardization level)

---

## Pricing + Packaging (Default)

### Tier A: Assessment (Core)
- Scope: 1 workflow (most critical)
- Price anchor: $2,500–$5,000

### Tier B: Assessment Plus (Executive Version)
- Scope: 2 workflows + deeper governance kit + KPI spec
- Price anchor: $5,000–$8,500

### Tier C: Assessment + Phase 2 Credit (Growth Path)
- Scope: Tier B + apply a defined credit toward implementation sprint if they sign within X days
- Price anchor: $7,500–$12,500

---

## Close Language (Use verbatim when helpful)

### Two-Option Close
"Based on what you shared, we have two clean paths.
Option 1 is the AI Readiness Assessment so we stop guessing and build a 30/60/90 plan.
Option 2 is we jump straight into implementation, but that's higher risk if the workflow is not stabilized.
My recommendation is Option 1 so we don't automate chaos. Want to lock that in?"

### Timeline Close
"If we kickoff this week, you'll have the roadmap next week and you can start executing immediately."

### Next Step Close
"I'll send the agreement and invoice today. Once paid, you get the kickoff checklist and we start."

---

## Objection Handling (Battle-tested scripts)

### "We don't have time."
"That's exactly why this exists. The assessment reduces decision friction and prevents wasted build time. We keep scope tight and deliver a prioritized plan you can actually execute."

### "We already bought tools."
"Perfect. Tools are not the problem. Readiness tells us whether your workflows can produce ROI with the tools you already own."

### "AI is risky / security concerns."
"We are not pushing sensitive client data into anything. We start with workflow integrity, data minimization, and governance. Readiness includes guardrails and audit logging requirements."

### "It's too expensive."
"The cost of rework and missed deadlines is already in your P&L. This is a controlled diagnostic that prevents expensive failed implementations."

---

## Output Formats (Pick based on request)

| Format | When to Use |
|--------|-------------|
| A) One-page offer sheet | Quick leave-behind or async send |
| B) Proposal scope + tier recommendation | Formal proposal or client deck |
| C) Sales call script + discovery questions | Pre-call prep or training |
| D) Statement of Work outline | Contract / engagement start |
| E) Delivery plan + checklist (5–7 day timeline) | Internal execution reference |

---

## Handoff to Delivery

After close, trigger the `bizdeedz-workflow` skill for execution artifacts:
- Intake checklist
- Current/future state map
- Prioritized backlog
- 30/60/90 stabilization roadmap
- Governance starter pack
