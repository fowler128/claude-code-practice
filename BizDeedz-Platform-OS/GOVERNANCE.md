# Agent Governance Framework

## Purpose

This governance framework ensures that AI agents in BizDeedz Platform OS operate safely, transparently, and within acceptable risk boundaries. It defines rules, controls, and approval processes that maintain operational quality while enabling automation at scale.

## Core Principles

### 1. **Human-in-the-Loop for High-Risk Actions**

All outbound communications, client-facing content, and high-risk decisions require human review and approval before execution.

**Examples**:
- Outbound emails to prospects or clients
- Social media posts
- Blog content for publication
- Legal advice drafts
- Contract or filing content

### 2. **Least Privilege Access**

Agents operate with the minimum permissions necessary to perform their function. Credentials and access are compartmentalized by agent and task type.

### 3. **Complete Audit Trail**

Every agent execution is logged with:
- Input and output snapshots
- Token usage and cost
- Model and parameters used
- Approval status and reviewer
- Execution duration and status

Logs are immutable and retained for compliance.

### 4. **Cost Controls**

Budget caps prevent silent cost overruns:
- Per-run limits
- Daily aggregate limits
- Monthly aggregate limits
- Anomaly detection alerts

### 5. **Fail-Safe Defaults**

When in doubt, the system defaults to the safest option:
- Require approval rather than auto-execute
- Block rather than allow
- Notify rather than silently proceed

## Governance Rule Types

### 1. Approval Gates

Requires human approval before execution or publication.

**Rule Configuration**:
```json
{
  "rule_type": "approval_gate",
  "applies_to_agent_id": "content_generator_agent",
  "rule_config": {
    "content_types": ["outbound_email", "social_post", "blog_post"],
    "requires_roles": ["attorney", "ops_lead"],
    "reason": "All outbound content requires human review"
  },
  "violation_action": "block"
}
```

**When Triggered**:
- Work order status changes to `needs_review`
- Authorized users can approve/reject via `/api/work-orders/:id/status`

**Authorized Reviewers**:
- Attorneys
- Operations Leads
- Admins

### 2. Cost Limits

Prevents runaway spending by enforcing budget caps.

**Rule Configuration**:
```json
{
  "rule_type": "cost_limit",
  "rule_config": {
    "max_per_run": 10.00,
    "max_daily_total": 100.00,
    "max_monthly_total": 2000.00,
    "warning_threshold": 0.80  // Alert at 80%
  },
  "violation_action": "block",
  "notify_roles": ["admin", "ops_lead"]
}
```

**Enforcement**:
- Per-run cost checked before execution
- Daily/monthly aggregates checked hourly
- Alerts sent when thresholds reached
- Hard blocks when limits exceeded

### 3. Rate Limits

Controls execution frequency to prevent abuse and manage load.

**Rule Configuration**:
```json
{
  "rule_type": "rate_limit",
  "applies_to_agent_id": "lead_enrichment_agent",
  "rule_config": {
    "max_runs_per_hour": 20,
    "max_runs_per_day": 150,
    "burst_allowance": 5  // Allow brief spikes
  },
  "violation_action": "block"
}
```

**Use Cases**:
- Prevent API quota exhaustion
- Control costs during high-volume periods
- Enforce fair usage across agents

### 4. Content Filters

Blocks or flags content with sensitive keywords, PII, or policy violations.

**Rule Configuration**:
```json
{
  "rule_type": "content_filter",
  "applies_to_agent_id": "content_generator_agent",
  "rule_config": {
    "blocked_keywords": [
      "guarantee",
      "lawsuit pending",
      "legal advice",
      "urgent action required"
    ],
    "check_for_pii": true,
    "check_for_legal_claims": true,
    "check_for_misleading_statements": true
  },
  "violation_action": "block",
  "notify_roles": ["attorney", "ops_lead"]
}
```

**Detection Types**:
- **Keyword Matching**: Block specific terms/phrases
- **PII Detection**: SSNs, credit cards, bank accounts
- **Legal Claims**: Unverified legal assertions
- **Brand Violations**: Off-brand language or tone

### 5. Access Control

Restricts agent usage to authorized users and roles.

**Rule Configuration**:
```json
{
  "rule_type": "access_control",
  "applies_to_agent_id": "outreach_orchestrator",
  "rule_config": {
    "allowed_roles": ["attorney", "admin", "ops_lead"],
    "require_2fa": true,
    "allowed_ip_ranges": ["internal_network"],
    "business_hours_only": true
  },
  "violation_action": "block"
}
```

## Default Governance Rules

The system ships with the following default rules:

### Rule 1: Outbound Content Approval Gate

- **Priority**: 10 (highest)
- **Applies To**: Content Generator Agent
- **Action**: Block execution until human approves
- **Reviewers**: Attorney, Ops Lead

**Rationale**: All outbound/public content must be reviewed for brand, legal, and quality compliance.

### Rule 2: Agent Per-Run Cost Limit

- **Priority**: 20
- **Applies To**: All agents
- **Limit**: $10.00 per run
- **Action**: Block and notify

**Rationale**: No single execution should exceed reasonable cost expectations.

### Rule 3: Daily Cost Limit

- **Priority**: 20
- **Applies To**: All agents (system-wide)
- **Limit**: $100.00 per day
- **Warning**: At $80.00 (80%)
- **Action**: Notify at warning, block at limit

**Rationale**: Prevent budget overruns due to misconfiguration or abuse.

### Rule 4: Lead Enrichment Rate Limit

- **Priority**: 30
- **Applies To**: Lead Enrichment Agent
- **Limits**: 20/hour, 150/day
- **Action**: Block

**Rationale**: Prevent API quota exhaustion and manage costs.

### Rule 5: Outbound Content Safety Filter

- **Priority**: 15
- **Applies To**: Content Generator Agent
- **Blocked Keywords**: "guarantee", "lawsuit", "legal advice", "urgent action required"
- **Checks**: PII, legal claims, misleading statements
- **Action**: Block and notify

**Rationale**: Prevent legal/brand risk from automated content.

### Rule 6: High-Risk Agent Approval Requirement

- **Priority**: 5 (very high)
- **Applies To**: All agents with risk_level = 'high' or 'critical'
- **Reviewers**: Attorney, Admin
- **Action**: Require approval

**Rationale**: High-risk agents should always have oversight.

## Approval Workflows

### Workflow 1: Outbound Email Review

```
1. User creates work order for email draft
2. Governance check: Approval gate triggered
3. Work order status → needs_review
4. Agent generates draft → saved in output_data
5. Notification sent to attorney/ops lead
6. Reviewer examines draft in UI
7. Reviewer approves or rejects:
   - APPROVED → status = approved, email can be sent
   - REJECTED → status = rejected, draft discarded
   - MODIFIED → reviewer edits, re-submits for execution
```

### Workflow 2: Content QA Review

```
1. Agent completes content generation
2. Brand QA sub-agent runs automatically
3. QA flags issues:
   - Minor issues → Auto-approved with warnings
   - Major issues → Status = needs_review
4. If flagged, attorney reviews and decides
```

### Workflow 3: Cost Threshold Alert

```
1. System checks daily aggregate cost hourly
2. Cost reaches 80% of daily limit ($80)
3. Alert sent to admin and ops lead
4. Team reviews usage, identifies cause
5. Options:
   - Increase limit if justified
   - Pause non-critical agents
   - Investigate unexpected usage
```

## Monitoring and Compliance

### Daily Monitoring Checklist

- [ ] Review work orders in `needs_review` status
- [ ] Check cost analytics dashboard
- [ ] Review failed run logs
- [ ] Verify no governance rule violations
- [ ] Check approval queue for delays

### Weekly Review

- [ ] Analyze cost trends by agent
- [ ] Review approval turnaround times
- [ ] Audit high-cost runs for efficiency
- [ ] Update blocked keyword lists as needed
- [ ] Review and update governance rules

### Monthly Compliance Audit

- [ ] Generate complete audit report from run logs
- [ ] Verify all high-risk runs were approved
- [ ] Review PII detection effectiveness
- [ ] Assess governance rule coverage gaps
- [ ] Update documentation and training materials

## Role-Based Access Control

### Admin
- Full access to all agents and work orders
- Can create/modify governance rules
- Can approve all work orders
- Access to cost analytics and audit logs

### Attorney
- Can approve high-risk work orders
- Can review content for legal/brand compliance
- Read access to all run logs
- Access to cost analytics

### Operations Lead
- Can approve content work orders
- Can create work orders for all agents
- Read access to work orders and run logs
- Access to operational dashboards

### Paralegal
- Can create work orders for low/medium risk agents
- Read access to own work orders
- Limited run log access (own matters only)

### Billing Specialist
- Read-only access to cost analytics
- Can view run logs for billing purposes
- Cannot create or approve work orders

## Escalation Procedures

### Blocked Work Order

1. User attempts work order creation
2. Governance rule blocks it
3. User receives clear explanation of why
4. User options:
   - Modify input to comply
   - Request exception from authorized reviewer
   - Choose different agent/approach

### Failed Approval Review

1. Work order in `needs_review` > 24 hours
2. Automated reminder sent to reviewers
3. At 48 hours, escalate to ops lead
4. At 72 hours, escalate to admin
5. Document delay and reason

### Cost Limit Breach

1. Agent run hits per-run cost limit
2. Execution blocked automatically
3. Alert sent to admin and ops lead immediately
4. Investigation required before resuming
5. Document cause and corrective action

### Security Incident

1. Detect suspicious pattern (e.g., unusual access, PII leak attempt)
2. Immediately block affected agent
3. Alert security team and admin
4. Conduct investigation
5. Implement corrective measures
6. Document incident and remediation

## Modifying Governance Rules

### Requesting Rule Changes

1. **Submit Request**: Document proposed change with justification
2. **Risk Assessment**: Evaluate security, cost, compliance impact
3. **Approval Required**: Must be approved by attorney + admin
4. **Testing**: Test in staging environment first
5. **Deployment**: Deploy to production with monitoring
6. **Documentation**: Update governance docs and notify team

### Rule Priority System

Rules are evaluated in priority order (lower number = higher priority):

- **1-10**: Critical safety and compliance rules
- **11-30**: Cost and rate controls
- **31-50**: Content quality and brand guidelines
- **51-100**: Operational efficiency rules

When multiple rules apply, the highest priority rule determines the action.

## Emergency Procedures

### Kill Switch

In case of runaway costs, abuse, or security incident:

```sql
-- Disable all agents immediately
UPDATE agent_directory SET is_active = false;

-- Cancel all queued work orders
UPDATE work_orders SET status = 'cancelled'
WHERE status = 'queued';
```

Access restricted to: Admin, CTO

### Audit Mode

Temporarily require approval for ALL agents:

```sql
-- Force approval for all agent types
INSERT INTO governance_rules (rule_name, rule_type, rule_config, violation_action, priority)
VALUES ('Emergency Audit Mode', 'approval_gate',
  '{"requires_roles": ["admin"], "reason": "Emergency audit in effect"}'::jsonb,
  'require_approval', 1);
```

## Best Practices

### For Content Creation

1. Always use approval gates for outbound content
2. Maintain updated blocked keyword lists
3. Run brand QA sub-agent automatically
4. Require attorney review for legal topics
5. Version prompts and track performance

### For Cost Management

1. Set conservative initial limits
2. Monitor daily cost trends
3. Use smaller models when sufficient
4. Batch similar requests
5. Review high-cost runs weekly

### For Security

1. Never expose API keys in logs
2. Sanitize PII from input/output snapshots
3. Rotate credentials regularly
4. Audit access logs monthly
5. Implement IP allowlisting for sensitive agents

### For Compliance

1. Retain all run logs for required period
2. Document approval decisions
3. Maintain governance rule change history
4. Conduct quarterly compliance reviews
5. Train staff on governance policies

## Governance Metrics

### Key Performance Indicators

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Approval Turnaround Time | < 4 hours | > 8 hours |
| Daily Cost | < $50 | > $80 |
| Failed Run Rate | < 5% | > 10% |
| Governance Violations | 0 | > 2 per week |
| Unapproved High-Risk Runs | 0 | > 0 |
| PII Leak Attempts | 0 | > 0 |

### Monthly Governance Report

Include:
- Total work orders created and completed
- Approval queue metrics (volume, turnaround time)
- Cost breakdown by agent
- Governance violations and resolutions
- Failed run analysis
- Top 10 most expensive runs
- Recommendations for rule updates

## Training and Onboarding

All users with agent access must complete:

1. **Governance Overview Training** (1 hour)
   - Why governance matters
   - How approval gates work
   - Cost management basics
   - Security best practices

2. **Role-Specific Training**
   - Attorneys: Legal compliance and content review
   - Ops Leads: Workflow approvals and monitoring
   - Admins: Rule management and incident response

3. **Quarterly Refresher**
   - New governance rules
   - Recent incidents and lessons learned
   - Best practice updates

## Appendix: Compliance Mapping

### SOC 2 Controls

- **CC6.1** (Logical Access): Role-based access control, approval gates
- **CC7.2** (Monitoring): Run logs, cost analytics, audit trails
- **CC8.1** (Risk Management): Governance rules, approval workflows

### Legal Ethics Rules

- **Competence**: Human review of legal advice and client communications
- **Confidentiality**: PII detection, access controls, audit logs
- **Supervision**: Approval gates for high-risk actions

### Data Privacy (GDPR/CCPA)

- **Data Minimization**: Agents access only necessary data
- **Purpose Limitation**: Work orders document legitimate purpose
- **Audit Trails**: Complete logs for data processing activities

---

**Version**: 1.0
**Last Updated**: 2026-02-07
**Maintained By**: BizDeedz Compliance Team
**Review Frequency**: Quarterly
