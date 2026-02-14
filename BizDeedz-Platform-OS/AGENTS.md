# Agent Layer Documentation

## Overview

The Agent Layer is a first-class infrastructure module in BizDeedz Platform OS that provides orchestration, governance, and audit capabilities for AI-powered automation. It enables law firms to leverage AI agents safely and efficiently while maintaining control, transparency, and compliance.

## Architecture

### Core Components

1. **Agent Directory** - Registry of all available parent agents
2. **Sub-Agent Directory** - Specialized sub-agents invoked by parent agents
3. **Work Orders** - Tasks and jobs assigned to agents
4. **Agent Run Logs** - Complete audit trail of all agent executions
5. **Prompt Packs** - Reusable, versioned prompt templates
6. **Governance Rules** - Controls that enforce approval gates, cost limits, and safety checks

### Data Flow

```
User Request → Work Order Created → Governance Check →
→ Agent Execution → Run Log Created → Output Generated →
→ Approval Gate (if required) → Completion
```

## Default Agents

### 1. Lead Enrichment Agent
- **Type**: `data_enrichment`
- **Risk Level**: Low
- **Capabilities**: Web research, data extraction, lead scoring, validation
- **Auto-Approval**: Yes
- **Sub-Agents**:
  - `lead_scorer` - Scores leads 0-100 based on fit criteria
  - `firm_profiler` - Builds comprehensive firm profiles
  - `next_action_recommender` - Suggests next best actions

**Use Cases**:
- Enrich incoming leads with firmographics
- Score lead quality automatically
- Recommend outreach strategies

### 2. Content Generator Agent
- **Type**: `content_generator`
- **Risk Level**: High
- **Capabilities**: Copywriting, email drafting, social posts, blog outlines
- **Auto-Approval**: **No** - Requires attorney/ops lead review
- **Sub-Agents**:
  - `email_drafter` - Generates personalized outreach emails
  - `social_post_creator` - Creates LinkedIn/Twitter content
  - `brand_qa_checker` - Reviews content for brand compliance

**Use Cases**:
- Draft personalized outbound emails
- Generate social media content
- Create marketing copy

### 3. Matter QA Agent
- **Type**: `qa_reviewer`
- **Risk Level**: Medium
- **Capabilities**: Document review, checklist validation, compliance checking
- **Auto-Approval**: Yes (for low-risk items)
- **Sub-Agents**:
  - `document_completeness_checker` - Validates required artifacts
  - `defect_classifier` - Categorizes and prioritizes defects

**Use Cases**:
- Review matter completeness before filing
- Identify missing documents or data
- Classify and track defects

### 4. Task Automation Agent
- **Type**: `task_executor`
- **Risk Level**: Low
- **Capabilities**: Task creation, status tracking, notifications, scheduling
- **Auto-Approval**: Yes
- **Sub-Agents**:
  - `reminder_generator` - Creates automated reminders
  - `status_updater` - Generates status summaries

**Use Cases**:
- Send automated reminders for overdue tasks
- Generate status update summaries
- Create follow-up tasks

### 5. Analytics & Reporting Agent
- **Type**: `analyst`
- **Risk Level**: Low
- **Capabilities**: Data analysis, report generation, trend detection, KPI tracking
- **Auto-Approval**: Yes
- **Sub-Agents**:
  - `trend_analyzer` - Identifies patterns and anomalies
  - `kpi_reporter` - Generates KPI dashboards

**Use Cases**:
- Daily operations briefs
- Trend analysis and insights
- Performance reporting

### 6. Outreach Orchestrator Agent
- **Type**: `orchestrator`
- **Risk Level**: High
- **Capabilities**: Campaign planning, sequence management, approval routing
- **Auto-Approval**: **No** - Requires attorney/admin approval
- **Sub-Agents**: (coordinates multiple other agents)

**Use Cases**:
- Multi-step outreach campaigns
- Lead nurturing sequences
- Complex workflow orchestration

## Work Orders

### Work Order Lifecycle

```
Queued → In Progress → Completed → [Needs Review] → [Approved/Rejected]
```

### Work Order Statuses

- **queued** - Waiting to be processed
- **in_progress** - Currently being executed
- **completed** - Execution finished successfully
- **failed** - Execution failed with errors
- **cancelled** - Manually cancelled
- **needs_review** - Requires human approval (high-risk agents)
- **approved** - Reviewed and approved by authorized user
- **rejected** - Reviewed and rejected

### Creating a Work Order

```typescript
POST /api/work-orders
{
  "agent_id": "lead_enrichment_agent",
  "order_type": "lead_scoring",
  "priority": "medium",
  "matter_id": "uuid-here", // Optional
  "input_data": {
    "firm_name": "ABC Law Firm",
    "website": "https://abclaw.com",
    "practice_areas": ["bankruptcy", "litigation"]
  },
  "estimated_cost": 1.50
}
```

### Monitoring Work Orders

```typescript
GET /api/work-orders?status=needs_review&agent_id=content_generator_agent
```

## Agent Run Logs

Every agent execution creates a detailed audit log with:

- Input and output snapshots
- Token usage and cost tracking
- Duration and performance metrics
- Error details (if any)
- Approval status and reviewer information

### Run Log Fields

| Field | Description |
|-------|-------------|
| `run_log_id` | Unique identifier |
| `work_order_id` | Associated work order |
| `agent_id` | Parent agent |
| `sub_agent_id` | Sub-agent (if any) |
| `status` | started, completed, failed, timeout, cancelled |
| `tokens_total` | Total tokens consumed |
| `cost_usd` | Cost in USD |
| `model_used` | AI model (e.g., "gpt-4", "claude-3-opus") |
| `requires_human_review` | Boolean flag |
| `review_status` | pending, approved, rejected, modified |

### Cost Analytics

```typescript
GET /api/agent-run-logs/cost-analytics?timeframe=week
```

Returns cost breakdowns by agent and by day.

## Prompt Packs

Prompt packs are reusable, versioned templates for common agent tasks.

### Structure

```json
{
  "prompt_pack_id": "lead_scoring_v1",
  "pack_name": "Lead Scoring Pack",
  "pack_version": "1.0",
  "category": "lead_enrichment",
  "system_prompt": "You are an expert at evaluating law firm leads...",
  "user_prompt_template": "Analyze this law firm: {{firm_data}}...",
  "input_schema": { /* JSON Schema */ },
  "output_schema": { /* JSON Schema */ },
  "recommended_model": "gpt-4",
  "recommended_temperature": 0.3,
  "recommended_max_tokens": 500
}
```

### Variable Interpolation

Prompt templates support Mustache-style variables:
- `{{firm_name}}` - Simple variable
- `{{#if condition}}...{{/if}}` - Conditionals
- `{{#each items}}...{{/each}}` - Loops

## Integration with Existing Modules

### Matters Module

Fields added to `matters` table:
- `lead_score` - Automatically calculated by Lead Enrichment Agent (0-100)
- `next_best_action` - Recommended next step from agent
- `automation_candidate` - Boolean flag for automation eligibility
- `last_ai_action_at` - Timestamp of last AI interaction

### Tasks Module

Fields added to `tasks` table:
- `ai_generated` - Boolean indicating AI-generated task
- `ai_confidence_score` - Confidence level (0.0-1.0)

### Events Module

All agent actions are logged as events:
- `work_order_created`
- `work_order_status_changed`
- `agent_run_completed`
- `agent_approval_required`

## API Endpoints

### Agent Directory

```
GET    /api/agents                           # List all agents
GET    /api/agents/:agent_id                 # Get agent details with sub-agents
GET    /api/sub-agents                       # List sub-agents
GET    /api/sub-agents?parent_agent_id=...   # Filter by parent
```

### Work Orders

```
POST   /api/work-orders                      # Create work order
GET    /api/work-orders                      # List with filters
GET    /api/work-orders/stats                # Statistics
GET    /api/work-orders/:id                  # Get details with run logs
PUT    /api/work-orders/:id/status           # Update status
```

### Agent Run Logs

```
POST   /api/agent-run-logs                   # Create run log
GET    /api/agent-run-logs                   # List with filters
GET    /api/agent-run-logs/stats             # Statistics
GET    /api/agent-run-logs/cost-analytics    # Cost breakdowns
PUT    /api/agent-run-logs/:id/complete      # Mark complete
PUT    /api/agent-run-logs/:id/review        # Submit review (requires role)
```

### Prompt Packs

```
GET    /api/prompt-packs                     # List all packs
GET    /api/prompt-packs/:id                 # Get specific pack
GET    /api/prompt-packs?category=...        # Filter by category
```

### Governance Rules

```
GET    /api/governance-rules                 # List all rules
GET    /api/governance-rules?rule_type=...   # Filter by type
```

## Best Practices

### 1. Always Use Appropriate Risk Levels

- **Low**: Data enrichment, read-only analysis, internal summaries
- **Medium**: QA tasks, document validation, non-client-facing content
- **High**: Outbound communications, client-facing content, legal advice drafts
- **Critical**: Filings, contracts, binding agreements

### 2. Enable Approval Gates for High-Risk Actions

All outbound, client-facing, or high-risk content should go through human review:

```typescript
{
  "requires_approval": true,
  "approval_roles": ["attorney", "ops_lead"]
}
```

### 3. Set Cost Caps

Prevent runaway costs with governance rules:

```json
{
  "rule_type": "cost_limit",
  "rule_config": {
    "max_per_run": 10.00,
    "max_daily_total": 100.00
  }
}
```

### 4. Monitor Run Logs Regularly

- Review failed runs for patterns
- Check approval queues daily
- Analyze cost trends weekly

### 5. Version Your Prompt Packs

Always increment version numbers when modifying prompts:
- `v1.0` → Initial version
- `v1.1` → Minor improvements
- `v2.0` → Major restructuring

## Security Considerations

1. **Least Privilege**: Agents run with minimal necessary permissions
2. **Audit Trail**: Every execution is logged immutably
3. **Approval Gates**: High-risk actions require human approval
4. **Cost Controls**: Budget caps prevent overspending
5. **Content Filtering**: Block sensitive keywords and PII leaks
6. **Access Control**: Role-based permissions for agent management

## Troubleshooting

### Work Order Stuck in "Queued"

Check:
1. Is the agent active? (`is_active = true`)
2. Are there governance rules blocking execution?
3. Is there a rate limit in effect?

### High Costs

Review:
1. `/api/agent-run-logs/cost-analytics` for cost breakdown
2. Check for inefficient prompt templates
3. Verify model selection (use smaller models when possible)

### Failed Runs

Examine:
1. `error_details` in run log
2. Input data validity
3. Model availability and quotas

## Future Enhancements

- **Agent Scheduling**: Cron-based scheduled runs
- **Batch Processing**: Process multiple work orders in parallel
- **A/B Testing**: Compare prompt pack performance
- **Cost Optimization**: Automatic model selection based on task complexity
- **Custom Agents**: User-defined agents with drag-and-drop workflow builder

## Support

For questions or issues:
- Check run logs: `/api/agent-run-logs`
- Review governance rules: `/api/governance-rules`
- Contact: ops team

---

**Version**: 1.0
**Last Updated**: 2026-02-07
**Maintained By**: BizDeedz Engineering Team
