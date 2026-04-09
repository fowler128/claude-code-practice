## AGENTS.md
# BizDeedz Platform OS - Agent Layer

Comprehensive agent orchestration system with governance, audit trails, and multi-module integration.

## Overview

The Agent Layer provides first-class support for AI agent orchestration, enabling:
- **Hierarchical agent execution** (orchestrators → specialists → sub-agents)
- **Work order management** with Kanban-style tracking
- **Complete audit trails** for all agent runs
- **Governance enforcement** with approval gates and content filters
- **Cross-module integration** (Legal, CRM, Content, SOPs)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent Orchestrator                       │
│  • Execution coordination                                    │
│  • Sub-agent dependency management                           │
│  • Governance checking                                       │
│  • Performance tracking                                      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐       ┌──────▼──────┐     ┌─────▼─────┐
   │ Agent   │       │  Work Order │     │ Run Logs  │
   │Directory│       │  Management │     │ (Audit)   │
   └─────────┘       └─────────────┘     └───────────┘
        │                   │                   │
   ┌────▼────┐       ┌──────▼──────┐     ┌─────▼─────┐
   │Sub-Agent│       │ Governance  │     │ Prompt    │
   │Registry │       │   Rules     │     │ Packs     │
   └─────────┘       └─────────────┘     └───────────┘
```

## Core Components

### 1. Agent Directory

Registry of all agents with capabilities, configurations, and governance settings.

**Agent Types:**
- **Orchestrator**: Coordinates multi-step workflows across agents
- **Specialist**: Performs specific tasks (content generation, QA, scoring)
- **Analyst**: Analyzes data and provides insights
- **Reviewer**: Reviews outputs for compliance and quality

**Key Fields:**
- `capabilities`: Array of capability tags
- `risk_tier`: low/medium/high (determines approval requirements)
- `requires_human_approval`: Force approval regardless of risk
- `can_trigger_sub_agents`: Allowed to execute sub-agents
- `can_send_external`: Allowed to send content externally (after approval)

### 2. Sub-Agent Directory

Specialized sub-agents that decompose complex tasks.

**Features:**
- **Sequential execution**: Execute in order (execution_order)
- **Parallel execution**: Run concurrently (is_parallel = true)
- **Dependencies**: Specify sub-agents that must complete first
- **Retry logic**: Auto-retry on failure (max_retries)

**Task Types:**
- `research`: Information gathering
- `analysis`: Data analysis and scoring
- `generation`: Content creation
- `validation`: QA and compliance checking
- `qa`: Quality assurance

### 3. Work Orders

Trackable work items assigned to agents or humans.

**Workflow States:**
```
pending → assigned → in_progress → agent_processing →
awaiting_approval → approved/rejected → completed/failed
```

**Key Features:**
- Priority-based sorting (urgent, high, medium, low)
- Related entity linking (lead, matter, content, sop)
- Input/output data tracking
- Approval workflow integration
- Automation candidate flagging

### 4. Agent Run Logs (Audit Trail)

Complete audit trail of every agent execution.

**Logged Data:**
- Input/output data
- Prompt used
- Model name and token usage
- Execution time
- Governance check results
- Approval status
- Error messages

**Compliance:**
- Immutable log (no updates, only inserts)
- User tracking (who initiated)
- Session tracking (context preservation)

### 5. Governance Rules

Enforced rules for approval gates, content filters, compliance, and rate limits.

**Rule Types:**
- **approval_gate**: Require human approval for high-risk actions
- **content_filter**: Block PII, profanity, or sensitive content
- **compliance_check**: Enforce legal/financial accuracy
- **rate_limit**: Prevent runaway executions

**Enforcement Actions:**
- `flag`: Log but allow
- `require_approval`: Force approval workflow
- `block`: Prevent execution
- `notify`: Alert specified roles

## Default Agents (Seeded)

### Legal Agents
1. **Legal Matter Analyst** → Health scoring, risk assessment
2. **Document QA Specialist** → Completeness, accuracy, compliance checks
3. **Legal Research Assistant** → Case law, statutes, precedents

### CRM Agents
4. **Lead Scoring Agent** → Fit, engagement, intent scoring
5. **Next Best Action Recommender** → Optimal next steps
6. **Proposal Generator** → Custom proposals and engagement letters

### Content Agents
7. **Content Generator** → Blog posts, social, emails
8. **Brand QA Agent** → Brand guideline compliance
9. **SEO Optimizer** → SEO analysis and optimization

### SOP Agents
10. **SOP Automation Analyzer** → Feasibility, ROI, blocker analysis
11. **Workflow Orchestrator** → Multi-step workflow coordination

### General Agents
12. **Data Enricher** → Company, contact, social data
13. **Summarization Agent** → Document and email summaries
14. **Sentiment Analyzer** → Sentiment and tone analysis

## Sub-Agent Examples

### Legal Matter Analyst Sub-Agents
1. **Health Score Calculator**: Calculate 0-100 score
2. **Risk Identifier**: Flag SLA breaches, missing docs
3. **Next Action Recommender**: Suggest top 3 actions

### Lead Scoring Sub-Agents (Parallel)
1. **Fit Score Calculator**: Industry, size, budget fit
2. **Engagement Score Calculator**: Interaction history
3. **Intent Score Calculator**: Buying signals
4. **Score Aggregator**: Weighted final score

### Content Generator Sub-Agents (Sequential)
1. **Content Outliner**: Structure and outline
2. **Content Writer**: Full content generation
3. **Content Polisher**: Refinement and brand voice

## Integration with Modules

### Legal Module (Matters)
- **Field**: `next_best_action` (AI-suggested action)
- **Agent**: Legal Matter Analyst
- **Trigger**: Status change, SLA breach, artifact upload

### CRM Module (Leads)
- **Fields**: `lead_score`, `lead_score_factors`, `next_best_action`
- **Agent**: Lead Scoring Agent
- **Trigger**: Lead creation, engagement activity

### Content Module (Content Calendar)
- **Fields**: `brand_qa_status`, `brand_qa_issues`, `seo_score`, `sentiment_score`
- **Agents**: Content Generator, Brand QA Agent, SEO Optimizer
- **Trigger**: Content draft, pre-publication

### SOP Module (SOP Library)
- **Fields**: `automation_candidate`, `automation_score`, `automation_blockers`
- **Agent**: SOP Automation Analyzer
- **Trigger**: SOP creation, manual request

## API Endpoints

### Work Orders
- `GET /api/work-orders` - List work orders (with filters)
- `GET /api/work-orders/:id` - Get work order details
- `POST /api/work-orders` - Create work order
- `POST /api/work-orders/:id/execute` - Execute with agent
- `POST /api/work-orders/:id/approve` - Approve work order
- `POST /api/work-orders/:id/reject` - Reject work order

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent with sub-agents
- `GET /api/agent-run-logs` - Agent execution audit trail

### Leads
- `GET /api/leads` - List leads (with AI scoring)
- `POST /api/leads` - Create lead (triggers scoring)

### Content
- `GET /api/content` - Content calendar with QA status

### SOPs
- `GET /api/sops` - SOPs with automation scoring

### Governance
- `GET /api/governance/rules` - Active governance rules

## Prompt Packs

Pre-built prompt templates with examples and validation.

**Included Packs:**
1. **Legal Matter Health Analysis** - Matter health scoring
2. **Lead Scoring & Qualification** - Lead evaluation
3. **Content Brand QA** - Brand compliance review
4. **SOP Automation Assessment** - Automation feasibility

**Structure:**
```json
{
  "pack_name": "Legal Matter Health Analysis",
  "version": "1.0.0",
  "system_prompt": "...",
  "user_prompt_template": "Analyze this matter: {{matter_data}}...",
  "prompt_variables": {"matter_data": "object"},
  "recommended_model": "gpt-4"
}
```

## Usage Examples

### Execute Legal Matter Analysis

```javascript
// Create work order
POST /api/work-orders
{
  "agent_id": "<legal-matter-analyst-id>",
  "title": "Analyze Matter Health",
  "work_type": "legal_analysis",
  "priority": "high",
  "related_entity_type": "matter",
  "related_entity_id": "<matter-id>",
  "input_data": {
    "matter_number": "BK-26-0001",
    "current_status": "docs_requested",
    "days_in_status": 15,
    "missing_artifacts": ["FINANCIAL_DOCS"],
    "defect_count": 0
  }
}

// Execute agent
POST /api/work-orders/<work-order-id>/execute
{
  "user_id": "attorney@firm.com"
}

// If high-risk, returns:
{
  "status": "awaiting_approval",
  "requires_approval": true,
  "run_log_id": "..."
}

// Approve
POST /api/work-orders/<work-order-id>/approve
{
  "approved_by": "partner@firm.com"
}
```

### Score a Lead

```javascript
POST /api/leads
{
  "company_name": "Acme Corp",
  "contact_name": "John Doe",
  "industry": "technology",
  "company_size": "mid_market",
  "budget_range": "$50k-100k",
  "source": "website"
}

// Automatically triggers Lead Scoring Agent
// Returns lead with:
{
  "lead_score": 87.5,
  "lead_score_factors": {
    "fit_score": 90,
    "engagement_score": 85,
    "intent_score": 88
  },
  "next_best_action": "Schedule discovery call within 24 hours"
}
```

### Generate Brand-Approved Content

```javascript
POST /api/work-orders
{
  "agent_id": "<content-generator-id>",
  "title": "Generate Blog Post",
  "work_type": "content_generation",
  "input_data": {
    "content_type": "blog_post",
    "topic": "Estate Planning Essentials",
    "target_audience": "adults_50+",
    "tone": "professional",
    "keywords": ["estate planning", "wills", "trusts"]
  }
}

// Agent generates content → Brand QA Agent reviews
// If brand issues found, returns awaiting_approval
// Requires partner approval before publication
```

## Performance Tracking

All agents track:
- `total_runs`: Total execution count
- `successful_runs`: Success count
- `failed_runs`: Failure count
- `avg_execution_time_ms`: Average duration

View in Agent Directory UI or via API.

## Best Practices

1. **Always use work orders** for agent execution (trackability)
2. **Set appropriate risk tiers** (determines approval flow)
3. **Define clear sub-agents** for complex tasks (decomposition)
4. **Use prompt packs** for consistency
5. **Review run logs** regularly (identify failures, optimize)
6. **Monitor governance violations** (adjust rules as needed)
7. **Track performance metrics** (optimize slow agents)

## Future Enhancements

- [ ] Human-in-the-loop approval UI
- [ ] Real-time agent execution monitoring
- [ ] Custom agent builder UI
- [ ] Advanced prompt engineering tools
- [ ] Agent performance benchmarking
- [ ] Cost tracking per agent/work order
- [ ] Multi-agent conversation support

---

**Last Updated**: 2026-02-05
**Version**: 1.0.0
