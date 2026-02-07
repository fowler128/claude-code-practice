# BizDeedz Platform OS - MVP+ Build

**Version:** 1.0.0
**Build Date:** 2026-02-05
**Target:** Production-ready MVP with full automation, reporting, and AI governance

---

## 🎯 Overview

The BizDeedz Platform OS MVP+ is a comprehensive legal practice management system with:

- **4 Playbook Templates** (Bankruptcy, Family Law, Immigration, Probate/Estate Planning)
- **Matter Health Scoring** with explainable risk assessment
- **Automation Engine** with lifecycle hooks
- **Smart Queue** with role-based task prioritization
- **4 Operational Reports** (<300ms performance)
- **OpenClaw Integration** for lead import and scoring
- **AI Agent Layer** with governance framework
- **Real-time SLA monitoring** and breach alerts

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Acceptance Criteria](#-acceptance-criteria)
- [Performance Requirements](#-performance-requirements)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🚀 Quick Start

### Prerequisites

- **PostgreSQL 14+** installed and running
- **Node.js 18+** installed
- **Git** for version control

### One-Command Setup

```bash
cd platform-os
./setup.sh
```

This will:
1. ✅ Create database `bizdeedz_platform`
2. ✅ Run all migrations (30+ tables)
3. ✅ Load seed data (practice areas, matter types, defect reasons, artifacts)
4. ✅ Install npm dependencies
5. ✅ Load playbook templates from `/templates`
6. ✅ Create `.env` configuration file

### Start the Server

```bash
cd backend
npm run dev
```

Server runs at: `http://localhost:3000`

### Verify Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-05T...",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 🏗 Architecture

### Core Services

```
backend/services/
├── automationEngine.js    # Event-driven automation rules
├── agentOrchestrator.js   # AI agent execution with governance
├── reportsService.js      # 4 operational reports (<300ms)
├── templateLoader.js      # Playbook template management
├── matterLifecycle.js     # Matter lifecycle hooks
└── matterHealthScore.js   # Health scoring algorithm
```

### API Routes

```
backend/routes/
├── agentRoutes.js         # Agent execution and work orders
├── smartQueueRoutes.js    # Role-based task queue
└── openClawRoutes.js      # Lead import integration
```

### Database

```
database/
├── complete-migration.sql # Single migration file (Postgres 14+)
└── seed-data.sql          # Reference data
```

### Playbook Templates

```
templates/
├── bankruptcy-consumer.json
├── family-law-divorce.json
├── immigration-petition.json
└── probate-estate-planning.json
```

---

## 🗄 Database Schema

### Core Tables (30+)

**Matter Management:**
- `matters` - Core matter records with health scoring
- `practice_areas` - BK, FL, IM, PE
- `matter_types` - Specific case types per practice area
- `playbook_templates` - Versioned workflow templates
- `statuses` - Workflow statuses per playbook
- `tasks` - Actionable work items
- `artifacts` - Documents and evidence

**Automation & Events:**
- `events` - Audit trail of all matter changes
- `automation_rules` - Trigger-action rules
- `automation_rule_history` - Execution log

**Agent Layer:**
- `agent_directory` - AI agent catalog
- `sub_agent_directory` - Hierarchical sub-agents
- `work_orders` - Agent execution requests
- `agent_run_logs` - Detailed execution logs
- `prompt_packs` - Versioned AI prompts
- `governance_rules` - AI safety guardrails

**Leads & CRM:**
- `leads` - Incoming lead capture
- `lead_scoring_history` - AI scoring audit trail

**Defect Tracking:**
- `defects` - Matter quality issues
- `defect_reasons` - Standardized defect taxonomy

---

## 🔌 API Endpoints

### Health & Status

```http
GET /health
```

Returns server health and database connectivity.

---

### Matter Management

#### Create Matter

```http
POST /api/matters
Content-Type: application/json

{
  "practice_area_id": "uuid",
  "matter_type_id": "uuid",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "555-1234",
  "assigned_to": "paralegal@example.com",
  "assigned_role": "paralegal"
}
```

**Lifecycle Hooks Triggered:**
- ✅ Loads playbook template
- ✅ Creates initial status
- ✅ Creates initial tasks
- ✅ Calculates health score
- ✅ Logs matter_created event

#### Update Matter Status

```http
PATCH /api/matters/:id/status
Content-Type: application/json

{
  "new_status": "docs_received",
  "user_id": "user@example.com"
}
```

**Lifecycle Hooks Triggered:**
- ✅ Updates matter status
- ✅ Triggers automation rules
- ✅ Recalculates health score
- ✅ Checks SLA breach
- ✅ Creates next tasks
- ✅ Logs status_change event

---

### Smart Queue (Role-Based Task List)

#### Get Role-Based Queue

```http
GET /api/smart-queue?role=paralegal&limit=50
```

**Smart Prioritization:**
1. Urgent priority tasks first
2. Overdue tasks
3. High-risk matters
4. SLA breach matters
5. Due date proximity

**Response:**
```json
{
  "tasks": [...],
  "tasksByRole": {
    "paralegal": [...]
  },
  "summary": {
    "total": 25,
    "overdue": 3,
    "dueToday": 5,
    "urgent": 2,
    "highRiskMatters": 4,
    "slaBreaches": 1
  }
}
```

#### Get Daily Checklist

```http
GET /api/smart-queue/checklist/paralegal?assigned_to=user@example.com
```

**Response Groups:**
- `overdue` - Past due tasks
- `today` - Due today
- `this_week` - Due in next 7 days
- `future` - Beyond 7 days

---

### Operational Reports (<300ms)

#### Queue Pressure Report

```http
GET /api/reports/queue
```

**Metrics:**
- Tasks by role (overdue, due today, due next 7 days)
- Matters by risk tier (high/medium/low)
- SLA breach count and risk
- Oldest open matter age

#### Cycle Time Report

```http
GET /api/reports/cycle-time
```

**Metrics:**
- Average hours in each status
- Total matter duration (intake → closed)
- Bottleneck identification

#### Defects/Rework Report

```http
GET /api/reports/defects
```

**Metrics:**
- Defects by reason (missing docs, incomplete forms, etc.)
- Corrections required per matter type
- Rework rate trends

#### Lead Funnel Report

```http
GET /api/reports/leads
```

**Metrics:**
- Leads by status (new, qualified, converted, lost)
- Conversion rates by source
- Average time to conversion

#### All Reports Combined

```http
GET /api/reports/all
```

Returns all 4 reports in a single response.

#### Performance Check

```http
GET /api/reports/performance
```

Tests all reports and validates <300ms requirement.

---

### OpenClaw Integration

#### Import Single Lead

```http
POST /api/openclaw/import
Content-Type: application/json

{
  "contact_name": "Jane Smith",
  "contact_email": "jane@example.com",
  "contact_phone": "555-5678",
  "company_name": "Acme Corp",
  "industry": "Technology",
  "source": "Website Form",
  "auto_score": true
}
```

**Workflow:**
1. ✅ Validates required fields
2. ✅ Checks for duplicates
3. ✅ Creates lead record
4. ✅ Optionally triggers Lead Scoring Agent
5. ✅ Returns lead with score

#### Bulk Import

```http
POST /api/openclaw/bulk-import
Content-Type: application/json

{
  "leads": [...]
}
```

#### Integration Status

```http
GET /api/openclaw/status
```

Returns integration health and statistics.

---

### Agent Execution

#### Execute Agent

```http
POST /api/agents/execute
Content-Type: application/json

{
  "agent_id": "uuid",
  "matter_id": "uuid",
  "input_data": {
    "matter_number": "BK-26-0015",
    "client_name": "John Doe",
    ...
  }
}
```

**With Governance:**
- ✅ Applies approval gates
- ✅ Runs content filters
- ✅ Checks compliance rules
- ✅ Enforces rate limits

---

### Template Management

#### Load All Templates

```http
POST /api/templates/load
```

Loads all playbook templates from `/templates` directory.

#### Get Template

```http
GET /api/templates/:templateId
```

Returns specific playbook template.

---

### SLA Management

#### Run SLA Sweep

```http
POST /api/sla/sweep
```

Checks all open matters for SLA breaches and triggers alerts.

---

## ✅ Acceptance Criteria

### 1. Database Migrations Apply Cleanly ✓

```bash
cd backend
npm run db:setup
```

**Validation:**
- ✅ All 30+ tables created
- ✅ All indexes created
- ✅ All foreign keys established
- ✅ Seed data loaded (4 practice areas, 7 matter types, 10 defect reasons, 11 artifact types)

**Verify:**
```bash
psql -d bizdeedz_platform -c "\dt"  # List tables
psql -d bizdeedz_platform -c "SELECT * FROM practice_areas;"
```

---

### 2. Playbook Templates Load from /templates ✓

```bash
cd backend
npm run templates:load
```

**Expected Output:**
```
✓ Loaded: 4 templates
  - Consumer Bankruptcy Chapter 7 (v1.0.0) → Bankruptcy/BK-CONSUMER
  - Divorce & Dissolution (v1.0.0) → Family Law/FL-DIVORCE
  - Family-Based Immigration Petition (v1.0.0) → Immigration/IM-PETITION
  - Estate Planning Package (v1.0.0) → Probate/PE-ESTATE
```

**Verify:**
```bash
psql -d bizdeedz_platform -c "SELECT template_id, name, version FROM playbook_templates;"
```

---

### 3. Automation Engine Wired into Matter Lifecycle ✓

**Test: Create Matter**
```bash
curl -X POST http://localhost:3000/api/matters \
  -H "Content-Type: application/json" \
  -d '{
    "practice_area_id": "<BK_UUID>",
    "matter_type_id": "<BK_CONSUMER_UUID>",
    "client_name": "Test Client",
    "client_email": "test@example.com"
  }'
```

**Expected:**
- ✅ Matter created with `matter_number` (e.g., BK-26-0001)
- ✅ Initial status set (`new`)
- ✅ Initial tasks created
- ✅ Health score calculated (should be 100)
- ✅ `matter_created` event logged

**Test: Update Status**
```bash
curl -X PATCH http://localhost:3000/api/matters/<MATTER_ID>/status \
  -H "Content-Type: application/json" \
  -d '{
    "new_status": "docs_requested",
    "user_id": "test@example.com"
  }'
```

**Expected:**
- ✅ Status updated
- ✅ Health score recalculated
- ✅ `status_change` event logged
- ✅ Next tasks created

---

### 4. Health Scoring Wired into Lifecycle ✓

**Verify Health Score Updates:**

```bash
psql -d bizdeedz_platform -c "
  SELECT matter_number, health_score, health_risk_tier, health_drivers
  FROM matters
  WHERE matter_number = 'BK-26-0001';
"
```

**Expected:**
- ✅ `health_score` between 0-100
- ✅ `health_risk_tier` is 'low', 'medium', or 'high'
- ✅ `health_drivers` is JSONB with top 3 drivers

---

### 5. Smart Queue with Role-Based Filtering ✓

**Test: Paralegal Queue**
```bash
curl "http://localhost:3000/api/smart-queue?role=paralegal&limit=20"
```

**Expected:**
- ✅ Tasks filtered by `assigned_role = 'paralegal'`
- ✅ Tasks sorted by urgency (overdue first, then by priority)
- ✅ Summary includes overdue, due today, urgent counts

**Test: Daily Checklist**
```bash
curl "http://localhost:3000/api/smart-queue/checklist/paralegal"
```

**Expected:**
- ✅ Tasks grouped into: `overdue`, `today`, `this_week`, `future`
- ✅ Completion stats included

---

### 6. Four Operational Reports (<300ms) ✓

**Test Performance:**
```bash
cd backend
npm run test:reports
```

**Expected Output:**
```
✓ Queue Pressure Report: 45ms ✅ PASS
✓ Cycle Time Report: 78ms ✅ PASS
✓ Defects/Rework Report: 52ms ✅ PASS
✓ Lead Funnel Report: 38ms ✅ PASS
✓ All Reports Combined: 142ms ✅ PASS

✅ All reports meet performance requirements!
```

**Manual Test:**
```bash
curl http://localhost:3000/api/reports/performance
```

---

### 7. OpenClaw Import Endpoint ✓

**Test: Import Lead**
```bash
curl -X POST http://localhost:3000/api/openclaw/import \
  -H "Content-Type: application/json" \
  -d '{
    "contact_name": "Test Lead",
    "contact_email": "lead@example.com",
    "contact_phone": "555-1234",
    "company_name": "Test Company",
    "industry": "Legal Services",
    "source": "Website",
    "auto_score": true
  }'
```

**Expected:**
- ✅ Lead created with `lead_number` (e.g., LD-26-0001)
- ✅ Lead scored via AI agent (if `auto_score: true`)
- ✅ Work order created for scoring
- ✅ Lead returned with scores (`fit_score`, `engagement_score`, `intent_score`)

**Test: Duplicate Detection**
```bash
# Submit same lead again
curl -X POST http://localhost:3000/api/openclaw/import \
  -H "Content-Type: application/json" \
  -d '{ "contact_email": "lead@example.com", ... }'
```

**Expected:**
- ⚠️ Returns 409 Conflict with existing lead details

---

## ⚡ Performance Requirements

### Report Performance (<300ms)

All 4 operational reports must complete in under 300ms:

- ✅ Queue Pressure Report
- ✅ Cycle Time Report
- ✅ Defects/Rework Report
- ✅ Lead Funnel Report

**Optimizations:**
- Indexed foreign keys
- Indexed date columns (`due_date`, `created_at`)
- Indexed status columns
- Materialized summary tables (if needed at scale)

**Test at Scale:**
```sql
-- Performance should hold with 100k tasks
SELECT COUNT(*) FROM tasks;  -- Target: 100,000+
```

---

## 🧪 Development

### Project Structure

```
platform-os/
├── backend/
│   ├── server-integrated.js       # Main server (MVP+)
│   ├── services/                  # Core business logic
│   ├── routes/                    # API route handlers
│   ├── scripts/                   # Utility scripts
│   └── package.json               # Dependencies & scripts
├── database/
│   ├── complete-migration.sql     # Single migration file
│   └── seed-data.sql              # Reference data
├── templates/                     # Playbook templates
│   ├── bankruptcy-consumer.json
│   ├── family-law-divorce.json
│   ├── immigration-petition.json
│   └── probate-estate-planning.json
├── prompt-packs/                  # AI prompt templates
├── frontend/                      # React UI (separate)
├── setup.sh                       # One-command setup
└── MVP-PLUS-README.md             # This file
```

### npm Scripts

```bash
npm run db:create       # Create database
npm run db:migrate      # Run migrations
npm run db:seed         # Load seed data
npm run db:setup        # All DB setup (create + migrate + seed)
npm run templates:load  # Load playbook templates
npm run setup           # Complete setup (DB + templates)
npm run dev             # Start dev server (nodemon)
npm run start           # Start production server
npm run test:reports    # Test report performance
```

### Environment Variables

Create `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bizdeedz_platform
DB_USER=postgres
DB_PASSWORD=postgres

# Server
PORT=3000
NODE_ENV=development

# OpenAI (optional)
OPENAI_API_KEY=your_key_here
```

---

## 🚀 Deployment

### Production Checklist

- [ ] PostgreSQL 14+ provisioned
- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] Playbook templates loaded
- [ ] Environment variables configured
- [ ] SSL/TLS enabled
- [ ] Database backups scheduled
- [ ] Monitoring enabled
- [ ] Error tracking configured
- [ ] Rate limiting enabled

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production

COPY backend/ ./
EXPOSE 3000

CMD ["node", "server-integrated.js"]
```

### Database Migrations

```bash
# Production migration
psql -h <production-host> -U <user> -d bizdeedz_platform \
  -f database/complete-migration.sql

# Verify
psql -h <production-host> -U <user> -d bizdeedz_platform \
  -c "SELECT COUNT(*) FROM playbook_templates;"
```

---

## 📚 Additional Documentation

- **AGENTS.md** - AI Agent Layer architecture and governance
- **GOVERNANCE.md** - AI governance framework and safety rules
- **templates/README.md** - Playbook template specifications
- **prompt-packs/README.md** - AI prompt pack system

---

## 🎯 Success Criteria Summary

| Criteria | Status | Verification |
|----------|--------|--------------|
| DB migrations apply cleanly (Postgres 14+) | ✅ | `npm run db:setup` |
| Playbooks load from /templates | ✅ | `npm run templates:load` |
| Automation engine wired to lifecycle | ✅ | POST /api/matters |
| Health scoring wired to lifecycle | ✅ | Check `health_score` column |
| Smart Queue with role filtering | ✅ | GET /api/smart-queue?role=paralegal |
| 4 reports < 300ms | ✅ | `npm run test:reports` |
| OpenClaw import endpoint | ✅ | POST /api/openclaw/import |

---

## 🤝 Support

For questions or issues:
- Review this README
- Check AGENTS.md and GOVERNANCE.md
- Review API endpoint documentation above
- Check server logs: `tail -f backend/logs/server.log`

---

**Built with ❤️ by the BizDeedz Platform Team**
**Version:** 1.0.0 MVP+
**Last Updated:** 2026-02-05
