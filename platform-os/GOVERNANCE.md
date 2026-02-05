# BizDeedz Platform OS - Governance Framework

Comprehensive governance system for AI agent operations, ensuring compliance, safety, and quality control.

## Overview

The Governance Framework enforces rules across all agent executions, preventing unauthorized actions, protecting sensitive data, and maintaining brand consistency.

**Core Principles:**
1. **Safety First**: Block harmful or unauthorized actions
2. **Human Oversight**: Require approval for high-risk operations
3. **Audit Everything**: Complete, immutable audit trail
4. **Fail Secure**: Block on errors, don't allow through
5. **Explainable**: Clear reasoning for all governance decisions

## Governance Rule Types

### 1. Approval Gates

Require human approval before execution or external delivery.

**Use Cases:**
- Client-facing content (emails, proposals, letters)
- Public content (blog posts, social media)
- High-value transactions (>$50k proposals)
- Legal/financial advice

**Configuration:**
```json
{
  "rule_type": "approval_gate",
  "applies_to_agent_types": ["content_generator", "proposal_writer"],
  "applies_to_output_types": ["client_facing", "public"],
  "rule_config": {
    "requires_roles": ["attorney", "partner"],
    "timeout_hours": 24,
    "escalate_if_overdue": true
  },
  "on_violation": "block"
}
```

**Workflow:**
1. Agent generates output
2. Governance check detects "client_facing" output
3. Work order status → `awaiting_approval`
4. Notification sent to attorney/partner
5. Human reviews and approves/rejects
6. If approved, work order → `completed`, external send allowed
7. If rejected, work order → `rejected` with reason

### 2. Content Filters

Scan outputs for prohibited content.

**Filtered Content:**
- **PII**: SSN, credit cards, bank accounts (redact or block)
- **Profanity**: Inappropriate language
- **Sensitive Data**: Internal metrics, confidential information
- **Legal Disclaimers**: Missing required disclaimers

**Configuration:**
```json
{
  "rule_type": "content_filter",
  "applies_to_agent_types": ["*"],
  "applies_to_output_types": ["external", "public", "client_facing"],
  "rule_config": {
    "patterns": ["ssn", "credit_card", "bank_account"],
    "action": "redact_or_block",
    "strict_mode": true
  },
  "severity": "critical",
  "on_violation": "block"
}
```

**Actions:**
- `redact`: Replace with [REDACTED]
- `flag`: Log violation, allow through
- `block`: Prevent execution entirely

### 3. Compliance Checks

Enforce legal and regulatory requirements.

**Check Types:**
- **Legal Accuracy**: No unsupported legal claims
- **Financial Disclaimers**: Required disclaimers present
- **GDPR/CCPA**: Data privacy compliance
- **Accessibility**: ADA compliance for public content

**Configuration:**
```json
{
  "rule_type": "compliance_check",
  "applies_to_agent_types": ["legal_content_generator"],
  "applies_to_output_types": ["client_facing", "public"],
  "rule_config": {
    "requires_citation": true,
    "disclaimer_required": true,
    "max_certainty_language": "may"
  },
  "severity": "critical",
  "on_violation": "require_approval"
}
```

**Validations:**
- Check for required disclaimers
- Verify citations for legal claims
- Ensure appropriate hedging language ("may", "could")
- No absolute guarantees ("will", "guaranteed")

### 4. Rate Limits

Prevent runaway executions and API quota exhaustion.

**Limits:**
- Per agent: Max runs per hour/day
- Per user: Max agent executions
- Per API: External API call limits

**Configuration:**
```json
{
  "rule_type": "rate_limit",
  "applies_to_agent_types": ["*"],
  "rule_config": {
    "max_per_hour": 100,
    "max_per_day": 500,
    "cooldown_seconds": 5,
    "burst_allowance": 10
  },
  "on_violation": "block"
}
```

**Actions on Limit:**
- Block execution
- Queue for later (if cooldown)
- Notify ops lead

## Default Governance Rules (Seeded)

### 1. Client-Facing Content Approval
- **Applies To**: Content generators, email composers, proposal writers
- **Action**: Require attorney/partner approval
- **Timeout**: 24 hours
- **Severity**: HIGH

### 2. Public Content Brand QA
- **Applies To**: Content generators, social media composers
- **Action**: Require brand QA pass (score ≥80) OR manual approval
- **Severity**: HIGH

### 3. High-Value Lead Approval
- **Applies To**: Proposal writers, lead scorers
- **Trigger**: Lead value >$50k
- **Action**: Require partner approval
- **Severity**: HIGH

### 4. PII Detection
- **Applies To**: All agents
- **Patterns**: SSN, credit card, bank account
- **Action**: Block and redact
- **Severity**: CRITICAL

### 5. Profanity Filter
- **Applies To**: Content generators, email composers
- **Action**: Flag (allow through but notify)
- **Severity**: MEDIUM

### 6. Legal Accuracy Review
- **Applies To**: Legal content generators
- **Requirements**: Citations, disclaimers
- **Action**: Require attorney approval
- **Severity**: CRITICAL

### 7. Financial Accuracy
- **Applies To**: Financial analyzers, proposal writers
- **Requirements**: Disclaimers, hedged language
- **Action**: Require partner approval
- **Severity**: HIGH

### 8. Agent Execution Rate Limit
- **Applies To**: All agents
- **Limit**: 100/hour, 500/day per agent
- **Action**: Block, notify ops lead
- **Severity**: MEDIUM

### 9. External API Rate Limit
- **Applies To**: Web researchers, data enrichers
- **Limit**: 20/minute, 200/hour
- **Action**: Block
- **Severity**: MEDIUM

## Governance Workflow

### Standard Agent Execution

```
1. Work order created
2. Agent execution triggered
3. Governance check runs:
   ├─ Load applicable rules
   ├─ Check agent risk tier
   ├─ Check output type
   ├─ Apply content filters
   ├─ Check rate limits
   └─ Check compliance
4. If PASS:
   ├─ Execute agent
   ├─ Log run
   └─ Complete work order
5. If FAIL (block/require_approval):
   ├─ Log violation
   ├─ Set status → awaiting_approval
   ├─ Notify required roles
   └─ Wait for human decision
6. Human approves/rejects
7. If approved:
   ├─ Mark work order approved
   ├─ Allow external send (if applicable)
   └─ Complete
8. If rejected:
   ├─ Mark work order rejected
   ├─ Log rejection reason
   └─ Close
```

### Approval Escalation

```
Approval Request Created
↓
Notify required roles (attorney, partner)
↓
24 hours elapse with no action
↓
Escalate to ops_lead
↓
48 hours elapse with no action
↓
Escalate to managing_partner
↓
Auto-reject after 72 hours
```

## Risk Tiers

All agents are assigned a risk tier that determines approval requirements.

### Low Risk (Score: 80-100)
- **Characteristics**: Read-only, internal, data analysis
- **Examples**: Summarization, data enrichment, sentiment analysis
- **Approval**: Not required (unless specific rule triggered)
- **Audit**: Full logging

### Medium Risk (Score: 60-79)
- **Characteristics**: Content generation, recommendations, internal docs
- **Examples**: Internal reports, draft content, lead scoring
- **Approval**: Required for external/client-facing outputs
- **Audit**: Full logging + governance details

### High Risk (Score: 0-59)
- **Characteristics**: Client-facing, public, legal/financial, external send
- **Examples**: Legal advice, proposals, public posts, financial projections
- **Approval**: Always required
- **Audit**: Full logging + approval trail + violation details

## Output Types

Classify outputs to determine governance level.

### Internal
- Reports for internal team use
- Analysis and insights
- Draft content for review
- **Governance**: Low (basic logging)

### Draft
- Content not yet reviewed
- Preliminary recommendations
- Initial proposals
- **Governance**: Medium (content filters)

### Client-Facing
- Emails to clients
- Proposals and engagement letters
- Client communications
- **Governance**: High (approval required)

### Public
- Blog posts
- Social media
- Website content
- Marketing materials
- **Governance**: Critical (brand QA + approval)

### External
- Any content sent outside organization
- Includes client-facing and public
- **Governance**: Critical (strict filtering + approval)

## Audit Trail Requirements

Every agent run MUST create an entry in `agent_run_logs`.

**Required Fields:**
- `work_order_id`: Associated work order
- `agent_id` / `sub_agent_id`: What was executed
- `input_data`: What was provided
- `output_data`: What was generated
- `execution_status`: started/completed/failed
- `user_id`: Who initiated
- `governance_check_passed`: Pass/fail
- `governance_violations`: Array of violations
- `human_approval_required`: Yes/no

**Immutability:**
- No updates to existing logs
- No deletions
- Only inserts

**Retention:**
- Minimum 7 years (legal requirements)
- Compressed after 1 year
- Archived after 3 years

## Monitoring & Alerts

### Real-Time Alerts

**Critical:**
- PII detected in external output → Block + notify compliance
- Legal advice without approval → Block + notify attorney
- Rate limit breach → Block + notify ops

**High:**
- Multiple governance violations (>3/hour) → Notify ops
- High-risk agent executed without approval → Notify compliance
- Approval timeout (>24hrs) → Notify escalation chain

**Medium:**
- Content filter triggered → Log + notify content team
- Brand QA failed → Require approval + notify marketing

### Weekly Reports

- Total agent runs by type
- Governance violations by rule
- Approval queue metrics (avg time, backlog)
- Most frequently violated rules
- Agent performance (success rates, execution times)
- Cost analysis (tokens, API calls)

## Role-Based Permissions

### Ops Lead
- View all work orders and run logs
- Override rate limits (with justification)
- Pause/resume agents
- Adjust governance rules (non-critical)

### Attorney / Partner
- Approve client-facing content
- Approve legal advice
- Approve high-value proposals
- View governance violations

### Compliance Lead
- View all governance violations
- Adjust compliance rules
- Export audit logs
- Investigate incidents

### Managing Partner
- Approve critical rule changes
- Final escalation for approvals
- Strategic governance decisions

## Incident Response

### Governance Violation Detected

1. **Block immediately** (if severity = critical/high)
2. **Log violation** to agent_run_logs
3. **Notify responsible roles** via email/Slack
4. **Create incident ticket** in work order system
5. **Investigate root cause**:
   - Agent prompt issue?
   - Training data problem?
   - Rule too strict/loose?
6. **Remediate**:
   - Update agent configuration
   - Refine governance rule
   - Retrain model (if needed)
7. **Document resolution** in incident log
8. **Adjust rules** to prevent recurrence

### PII Leak

1. **Block immediately**
2. **Redact from logs**
3. **Notify compliance team**
4. **Investigate source**:
   - Input data contained PII?
   - Model generated PII?
   - Extraction failure?
5. **Breach notification** (if required by law)
6. **Enhance filters**
7. **Audit all recent runs** for similar issues

## Testing & Validation

### Pre-Production Testing

All agents MUST pass:
1. **Unit tests**: Sub-agent logic
2. **Integration tests**: Full agent + sub-agents
3. **Governance tests**: All rules enforced
4. **Adversarial tests**: Attempt to bypass rules
5. **Load tests**: Performance under volume

### Continuous Monitoring

- Real-time governance violation tracking
- Agent performance degradation detection
- Approval queue SLA monitoring
- Cost anomaly detection

## Best Practices

### For Developers

1. **Set conservative risk tiers** (default to high, lower after testing)
2. **Test governance rules** before production
3. **Document agent capabilities** clearly
4. **Use prompt packs** for consistency
5. **Log everything** (better too much than too little)

### For Operators

1. **Review approvals promptly** (<4 hours for high-priority)
2. **Monitor governance dashboard** daily
3. **Investigate violations** (don't just dismiss)
4. **Adjust rules iteratively** (data-driven)
5. **Train team on approval criteria**

### For Compliance

1. **Audit logs regularly** (weekly spot checks)
2. **Review rule effectiveness** (monthly)
3. **Update rules for new regulations**
4. **Export logs for external audits**
5. **Document all rule changes**

## Future Enhancements

- [ ] Machine learning-based anomaly detection
- [ ] Automated content redaction (PII)
- [ ] Dynamic risk scoring based on context
- [ ] Advanced approval routing (decision trees)
- [ ] Integration with SIEM tools
- [ ] Blockchain-based audit log (immutability proof)

---

**Last Updated**: 2026-02-05
**Version**: 1.0.0
**Compliance**: SOC 2, GDPR, CCPA ready
