# BizDeedz Platform OS

**Law Firm Workflow Management System with AI Governance**

A practice-agnostic workflow standardization platform for law firms that combines matter lifecycle management, AI governance, and operational intelligence.

## Overview

BizDeedz Platform OS is a comprehensive system that helps law firms:

- **Standardize workflows** across practice areas with customizable playbooks
- **Manage matters** end-to-end from intake to closeout
- **Govern AI usage** with risk-based approval workflows and audit trails
- **Track performance** with operational analytics and health scores
- **Improve quality** through QC gates and defect tracking

## Core Features

### Sprint 1 (Completed) ✅
- **Authentication & RBAC**: Role-based access control with JWT
- **Matter Management**: Full CRUD operations for client matters
- **Task System**: Task creation, assignment, and tracking
- **Events Audit Log**: Complete audit trail for all system activities
- **Database Schema**: PostgreSQL with comprehensive data model

### Sprint 2 (In Progress)
- **Playbook Templates**: 4 seed playbooks (Bankruptcy, Family Law, Immigration, Probate/Estate)
- **Smart Work Queues**: Lane-based views with role filtering
- **Automation Rules**: Status-based triggers and task generation

### Sprint 3 (Planned)
- **CSV/Sheet Import**: Bulk data import functionality
- **Storage Integration**: Google Drive and SharePoint link integration

### Sprint 4 (Planned)
- **AI OS**: Prompt library with versioning
- **AI Action Runner**: Risk-classified AI operations
- **Approval Workflows**: Human-in-the-loop for medium/high risk outputs
- **RAG System**: Retrieval-Augmented Generation against firm SOPs

### Sprint 5 (Planned)
- **Matter Health Score**: 0-100 scoring with explainable drivers
- **Analytics Dashboard**: Cycle time, SLA compliance, throughput metrics
- **Ops Briefs**: Weekly operational and AI quality reports

## Tech Stack

### Backend
- **Node.js** + **TypeScript**
- **Express** - RESTful API framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Routing
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **React Hook Form** - Form management

## Data Model

### Core Tables
- **USERS**: Authentication and role management
- **MATTERS**: Client matters with status, lane, and health metrics
- **TASKS**: Work items with assignments and dependencies
- **ARTIFACTS**: Document tracking with QC status
- **AI_RUNS**: Complete audit log of AI operations
- **EVENTS**: System-wide audit trail
- **BILLING_EVENTS**: Billing and payment tracking

### Controlled Lists
- Practice Areas
- Matter Types
- Artifact Types
- Defect Reasons

### Templates
- **PLAYBOOK_TEMPLATES**: Workflow definitions (JSON)
- **AUTOMATION_RULES**: Trigger-action rules
- **SLA_RULES**: Service level agreements
- **PROMPT_LIBRARY**: Versioned AI prompts

## Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd BizDeedz-Platform-OS
```

2. **Set up the database**
```bash
# Create PostgreSQL database
createdb bizdeedz_platform_os

# Or using psql
psql -U postgres
CREATE DATABASE bizdeedz_platform_os;
\q
```

3. **Backend setup**
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations and seed data
npm run db:migrate

# Start development server
npm run dev
```

4. **Frontend setup**
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

### Default Credentials
```
Email: admin@bizdeedz.com
Password: admin123
```

**⚠️ Change these credentials in production!**

## Project Structure

```
BizDeedz-Platform-OS/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── db/              # Database connection and migrations
│   │   ├── middleware/      # Auth and other middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── server.ts        # Express server
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── stores/          # State management
│   │   ├── App.tsx          # Root component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── shared/
│   └── types/               # Shared TypeScript types
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Matters
- `GET /api/matters` - List matters (with filtering)
- `GET /api/matters/:id` - Get matter details
- `POST /api/matters` - Create matter
- `PUT /api/matters/:id` - Update matter
- `DELETE /api/matters/:id` - Close matter

### Tasks
- `GET /api/tasks/my` - Get my tasks
- `GET /api/matters/:id/tasks` - Get tasks for matter
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Controlled Lists
- `GET /api/practice-areas` - Get practice areas
- `GET /api/matter-types` - Get matter types
- `GET /api/artifact-types` - Get artifact types
- `GET /api/defect-reasons` - Get defect reasons

### Events
- `GET /api/events` - Get recent events
- `GET /api/events?matter_id=<id>` - Get events for matter

## User Roles

- **admin**: Full system access
- **attorney**: Matter management, approval authority
- **paralegal**: Task execution, document management
- **intake_specialist**: New matter intake
- **billing_specialist**: Billing and payment management
- **ops_lead**: Operations oversight and analytics

## Matter Lifecycle

1. **Intake & Triage**: Lead capture, data collection
2. **Engagement & Conflicts**: Conflicts check, engagement letter
3. **Document Collection**: Client document gathering
4. **Drafting / Case Prep**: Work product creation
5. **Attorney Review / Approval**: QC and sign-off
6. **Filing / Submission**: Court or agency submission
7. **Post-Filing / Case Management**: Ongoing matter management
8. **Billing & Closeout**: Final billing and closing

## Playbooks

### Bankruptcy (Consumer)
- 26 controlled statuses across 8 lanes
- Required artifacts: intake form, engagement, payment, financial docs, filing packet
- QC gates: intake completeness, conflicts, pre-submission
- SLAs: configurable by status

### Family Law (Divorce/Custody)
- 30 controlled statuses
- Required artifacts: intake, engagement, marriage cert, financials, pleadings
- Focus on service, hearings, and settlement

### Immigration
- 29 controlled statuses
- Required artifacts: identity docs, forms, evidence, translations
- Handles RFEs and agency notices

### Probate / Estate Planning
- Two modes: Estate Planning (21 statuses) + Probate (28 statuses)
- Required artifacts vary by mode
- Execution and administration tracking

## Environment Variables

### Backend (.env)
```
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bizdeedz_platform_os
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

### Frontend
```
VITE_API_BASE_URL=/api
```

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## Security Considerations

1. **Change default credentials** immediately in production
2. **Use strong JWT secret** (generate with `openssl rand -base64 32`)
3. **Enable HTTPS** in production
4. **Configure CORS** appropriately
5. **Review database permissions**
6. **Enable rate limiting** for API endpoints
7. **Implement backup strategy** for database

## Roadmap

- [ ] Complete Sprint 2: Playbook templates and automation
- [ ] Complete Sprint 3: Import and storage integration
- [ ] Complete Sprint 4: AI OS with RAG
- [ ] Complete Sprint 5: Analytics and briefs
- [ ] Mobile app support
- [ ] Integration marketplace (QuickBooks, Clio, etc.)
- [ ] Advanced reporting and BI
- [ ] Multi-tenant support

## Contributing

This is a practice project. For production use, conduct thorough security review and testing.

## License

Proprietary - BizDeedz Platform OS

## Support

For questions or issues, contact the development team.

---

**Built with ❤️ for law firms seeking operational excellence**
