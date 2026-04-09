# BizDeedz Platform OS

A comprehensive legal practice management system with playbook-driven workflows, matter health scoring, and AI governance.

## Features

### Core Capabilities

- **Playbook Templates**: Versioned JSON templates for 4 practice areas (Bankruptcy, Family Law, Immigration, Probate/Estate Planning)
- **Matter Health Score**: Rules-based scoring (0-100) with explainable top 3 drivers and risk tiers (Low/Medium/High)
- **Automation Engine**: Event-driven workflows with trigger-action rules
- **AI Governance**: Approval workflows for medium/high risk AI actions with external send blocking
- **Smart Queue**: Role-based matter queue sorted by priority and health score
- **Analytics Dashboard**: Cycle time, defect rates, SLA compliance tracking
- **Weekly Ops Brief**: Executive summary with wins, concerns, and action items

### Practice Areas & Matter Types

**Bankruptcy**
- Consumer (General)

**Family Law**
- Divorce
- Custody/Modification

**Immigration**
- Petition/Application (General)
- RFE Response

**Probate/Estate Planning**
- Estate Planning Package
- Probate Administration

### Controlled Lists

**Defect Reasons**: Missing artifacts, incorrect names, jurisdiction issues, signatures, incomplete fields, wrong template, inconsistent facts, deadline risks, payment issues

**Artifact Types**: Intake questionnaires, engagement letters, payment confirmations, identity docs, financial docs, evidence packets, draft/final filings, court notices, final orders

### Automation Rules (MVP)

1. **Matter Creation**: Generate starter tasks (conflicts, engagement, payment), set initial status
2. **Docs Requested**: Create doc-request task + reminder schedule (Day 2, 5, 10)
3. **SLA Breach + Missing Artifacts**: Escalate to Ops Lead, add MHS driver
4. **Returned for Corrections**: Require defect reason + note, increment defect_count, create correction task
5. **AI Run (Medium/High Risk)**: Require approval, block external sends until approved

### Matter Health Score Rules

Base score: 100

**Penalties**:
- -20: Conflicts not cleared after Intake Complete
- -15: Engagement not signed
- -15: Payment/retainer not received
- -10 per missing required artifact (cap at -40)
- -10: Current status aging exceeds SLA
- -15: Defect count ≥ 2
- -25: In issue/rejected/returned status

**Risk Tiers**:
- 80-100: Low
- 60-79: Medium
- 0-59: High/Critical

## Architecture

### Technology Stack

**Backend**:
- Node.js + Express
- PostgreSQL 14+
- REST API

**Frontend**:
- React 18
- React Router
- TanStack Query (React Query)
- Recharts (analytics)
- Tailwind CSS

### Data Model

**Core Tables**:
- `matters` - Legal matters/cases with status, health score, SLA tracking
- `tasks` - Action items with assignment and automation tracking
- `artifacts` - Documents with validation and version control
- `ai_runs` - AI actions with risk levels and approval workflows
- `events` - Complete audit trail and timeline
- `playbook_templates` - Versioned JSON workflow definitions

**Supporting Tables**:
- `practice_areas`, `matter_types`, `defect_reasons`, `artifact_types`
- `automation_rules`, `users`, `billing_events` (optional)

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

1. **Clone the repository**
```bash
cd platform-os
```

2. **Setup Database**
```bash
createdb bizdeedz_platform
psql -U postgres -d bizdeedz_platform -f database/schema.sql
```

3. **Backend Setup**
```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your database credentials
npm run dev
```

4. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

5. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Project Structure

```
platform-os/
├── database/
│   └── schema.sql                 # Complete database schema
├── templates/
│   ├── bankruptcy-consumer.json   # Bankruptcy playbook
│   ├── family-law-divorce.json    # Family Law playbook
│   ├── immigration-petition.json  # Immigration playbook
│   └── probate-estate-planning.json # Probate playbook
├── backend/
│   ├── server.js                  # Express API server
│   ├── services/
│   │   ├── matterHealthScore.js   # Health score calculator
│   │   └── automationEngine.js    # Automation engine
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main app component
│   │   ├── components/
│   │   │   └── Layout.jsx        # App layout & navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── SmartQueue.jsx    # Role-based queue
│   │   │   ├── MatterDetail.jsx  # Matter detail view
│   │   │   ├── Analytics.jsx     # Analytics dashboard
│   │   │   └── WeeklyOpsBrief.jsx # Ops brief
│   │   └── services/
│   │       └── api.js            # API client
│   └── package.json
├── .env.example
└── README.md
```

## API Endpoints

### Matters
- `GET /api/matters` - List matters with filters
- `GET /api/matters/:id` - Get matter details
- `POST /api/matters` - Create new matter
- `PATCH /api/matters/:id/status` - Update matter status
- `GET /api/matters/:id/timeline` - Get matter event timeline

### Tasks
- `GET /api/matters/:id/tasks` - Get matter tasks
- `POST /api/matters/:id/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task

### Artifacts
- `GET /api/matters/:id/artifacts` - Get matter artifacts
- `POST /api/matters/:id/artifacts` - Upload artifact
- `PATCH /api/artifacts/:id` - Update artifact

### AI Runs
- `GET /api/matters/:id/ai-runs` - Get AI runs for matter
- `POST /api/matters/:id/ai-runs` - Create AI run
- `POST /api/ai-runs/:id/approve` - Approve AI run
- `POST /api/ai-runs/:id/reject` - Reject AI run

### Analytics
- `GET /api/analytics` - Get analytics summary
- `GET /api/analytics/cycle-time` - Cycle time data
- `GET /api/analytics/defects` - Defect/rework data
- `GET /api/analytics/sla-compliance` - SLA compliance data
- `GET /api/analytics/ops-brief` - Weekly ops brief data

## Usage Examples

### Creating a New Matter

```javascript
POST /api/matters
{
  "practice_area_id": 1,
  "matter_type_id": 1,
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "555-0123",
  "assigned_to": "paralegal@firm.com",
  "assigned_role": "paralegal"
}
```

### Updating Matter Status

```javascript
PATCH /api/matters/:id/status
{
  "new_status": "returned_for_corrections",
  "defect_reason_id": 3,
  "defect_notes": "Missing signatures on pages 2 and 5",
  "user_id": "attorney@firm.com"
}
```

### Creating AI Run with Approval

```javascript
POST /api/matters/:id/ai-runs
{
  "action_type": "document_generation",
  "model_name": "gpt-4",
  "risk_level": "high",
  "input_data": {
    "template": "bankruptcy_petition",
    "client_data": {...}
  }
}
// Returns AI run with requires_approval: true, can_send_externally: false
```

## Development Roadmap

### Phase 1: MVP (Current)
- [x] Database schema
- [x] Playbook templates (4 practice areas)
- [x] Matter Health Score engine
- [x] Automation engine (5 core rules)
- [x] Basic API endpoints
- [x] Frontend UI (Dashboard, Queue, Detail, Analytics, Ops Brief)

### Phase 2: Enhancement
- [ ] Artifact file upload/storage (S3/local)
- [ ] AI run execution integration
- [ ] Email notifications
- [ ] Advanced search and filtering
- [ ] User authentication & authorization
- [ ] Admin UI for playbook editing

### Phase 3: Advanced Features
- [ ] Custom playbook builder
- [ ] Advanced analytics (predictive insights)
- [ ] Client portal
- [ ] Mobile app
- [ ] Integration marketplace (court e-filing, payment processors)

## Testing

```bash
# Backend tests (TBD)
cd backend
npm test

# Frontend tests (TBD)
cd frontend
npm test
```

## Deployment

### Production Considerations

1. **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
2. **Environment Variables**: Set production values in `.env`
3. **File Storage**: Configure S3 or similar for artifact storage
4. **SSL**: Enable HTTPS for API and frontend
5. **Monitoring**: Add logging and error tracking (Sentry, DataDog, etc.)
6. **Backups**: Automated database backups
7. **Rate Limiting**: Add API rate limiting
8. **Authentication**: Implement JWT-based auth

### Deployment Commands

```bash
# Backend
cd backend
npm run build  # If using TypeScript
npm start

# Frontend
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- Email: support@bizdeedz.com
- Documentation: https://docs.bizdeedz.com
- GitHub Issues: https://github.com/bizdeedz/platform-os/issues

---

**Built with ❤️ for legal professionals who deserve better tools**
