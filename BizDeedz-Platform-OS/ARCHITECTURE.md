# BizDeedz Platform OS - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ Matters  │  │  Tasks   │  │  Admin   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         TanStack Query (Data Fetching)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Zustand (State Management)             │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST + JWT
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Routes                         │  │
│  │  /auth  /matters  /tasks  /events  /controlled-lists│  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │                  Controllers                         │  │
│  │  authController  matterController  taskController    │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │                   Services                           │  │
│  │  eventService  automationService  healthScoreService │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │              Database Connection (pg)                │  │
│  └───────────────────────┬──────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   PostgreSQL Database                       │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ MATTERS  │ │  TASKS   │ │ARTIFACTS │ │ AI_RUNS  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  EVENTS  │ │  USERS   │ │ BILLING_ │ │ PROMPT_  │      │
│  │          │ │          │ │  EVENTS  │ │ LIBRARY  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Controlled Lists & Templates               │  │
│  │  practice_areas  matter_types  playbook_templates    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router** - Navigation
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **date-fns** - Date formatting

### Backend
- **Node.js** - JavaScript runtime
- **TypeScript** - Type safety
- **Express** - Web framework
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **CORS** - Cross-origin requests
- **dotenv** - Environment variables
- **Zod** - Schema validation

## Data Flow

### 1. Authentication Flow

```
User Login → Frontend Form
    ↓
POST /api/auth/login (email, password)
    ↓
Backend validates credentials
    ↓
Generate JWT token
    ↓
Return token + user data
    ↓
Frontend stores token in localStorage
    ↓
Include token in all subsequent requests
```

### 2. Matter Creation Flow

```
User clicks "New Matter" → Open Modal
    ↓
Fill form (client, practice area, matter type)
    ↓
POST /api/matters + JWT token
    ↓
Backend validates data
    ↓
Generate unique matter_number (YYYY-####)
    ↓
Insert into MATTERS table
    ↓
Log event to EVENTS table
    ↓
(Future: Generate tasks from playbook)
    ↓
Return new matter
    ↓
Frontend updates UI & closes modal
```

### 3. Task Status Update Flow

```
User clicks "Start" on task
    ↓
PUT /api/tasks/:id { status: "in_progress" }
    ↓
Backend validates task exists
    ↓
Update TASKS table
    ↓
Log event to EVENTS table
    ↓
Return updated task
    ↓
Frontend updates UI
    ↓
React Query invalidates cache
    ↓
Dashboard stats refresh automatically
```

### 4. Audit Trail Flow

```
Any data mutation (create/update/delete)
    ↓
EventService.logEvent() called
    ↓
Insert into EVENTS table with:
  - event_type
  - event_category
  - actor (user/system/automation/ai)
  - description
  - metadata
  - timestamp
    ↓
Event available in:
  - Matter detail timeline
  - Dashboard activity feed
  - Analytics reports
```

## Database Schema Overview

### Core Entities

**MATTERS** (Client matters)
- Primary entity for all work
- Tracks status, lane, priority
- Links to practice area and matter type
- Has health score and risk tier

**TASKS** (Work items)
- Belong to matters
- Can be assigned to users or roles
- Track status and dependencies
- Support SLA tracking

**ARTIFACTS** (Documents)
- Belong to matters
- Track required vs received
- Have QC status
- Point to external storage

**EVENTS** (Audit log)
- Log all system activities
- Link to matters, tasks, etc.
- Track actor and timestamp
- Store metadata as JSON

**AI_RUNS** (AI actions)
- Log every AI operation
- Track model, prompt, inputs, outputs
- Require approvals for high-risk
- Store citations and confidence

**USERS** (System users)
- Authentication credentials
- Role-based permissions
- Profile information

### Relationships

```
USERS ──┬── owns ──→ MATTERS
        │
        └── assigned to ──→ TASKS

MATTERS ──┬── has many ──→ TASKS
          │
          ├── has many ──→ ARTIFACTS
          │
          ├── has many ──→ EVENTS
          │
          ├── has many ──→ AI_RUNS
          │
          ├── has many ──→ BILLING_EVENTS
          │
          ├── belongs to ──→ PRACTICE_AREAS
          │
          ├── belongs to ──→ MATTER_TYPES
          │
          └── uses ──→ PLAYBOOK_TEMPLATES (Sprint 2)

PLAYBOOK_TEMPLATES ──┬── has many ──→ AUTOMATION_RULES
                     │
                     └── has many ──→ SLA_RULES
```

## Security Architecture

### Authentication
1. User provides email + password
2. Backend hashes password with bcrypt
3. Compare with stored hash
4. Generate JWT token with payload: `{ user_id, email, role }`
5. Token expires after 24 hours (configurable)

### Authorization
1. Every protected route requires valid JWT
2. Middleware extracts and verifies token
3. User info attached to request object
4. Role-based checks using `requireRole()` middleware
5. Admin and attorney roles have elevated permissions

### Data Protection
- Passwords never stored in plain text (bcrypt with 10 rounds)
- JWT secret stored in environment variable
- Database credentials in .env file
- No sensitive data in client-side code
- CORS configured to restrict origins in production

## API Design Principles

### RESTful Conventions
- `GET` - Retrieve data
- `POST` - Create new resource
- `PUT` - Update existing resource
- `DELETE` - Remove resource

### Response Format
- Success: Return resource or `{ message, data }`
- Error: Return `{ error: "message" }`
- Lists: Return `{ items, pagination }`

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

## Performance Considerations

### Frontend
- React Query caching reduces unnecessary API calls
- Lazy loading for modals and large components
- Optimistic updates for better UX
- Debounced search inputs
- Virtualized lists for large datasets (future)

### Backend
- Database connection pooling (max 20 connections)
- Indexed columns for common queries
- Pagination for list endpoints
- Prepared statements prevent SQL injection
- Async/await throughout for non-blocking operations

### Database
- Indexes on foreign keys
- Indexes on frequently queried columns (status, lane, owner_id)
- Composite indexes for common filter combinations
- JSONB for flexible metadata
- Triggers for automatic timestamp updates

## Scalability Roadmap

### Current (Sprint 1)
- Single server deployment
- Direct database connections
- Session-less authentication (JWT)
- Suitable for: 10-100 concurrent users

### Near-term (Sprint 2-3)
- Redis for session caching
- Background job queue for automations
- File storage abstraction layer
- Suitable for: 100-500 concurrent users

### Long-term (Sprint 4-5)
- Microservices for AI operations
- Message queue for async processing
- Read replicas for analytics
- CDN for static assets
- Suitable for: 1000+ concurrent users

## Development Workflow

### Local Development
1. Backend runs on port 3001
2. Frontend runs on port 3000
3. Vite proxies `/api` requests to backend
4. Hot reload on both frontend and backend
5. PostgreSQL runs locally or via Docker

### Git Workflow
1. Feature branches from main
2. Descriptive commit messages
3. PR review before merge
4. CI/CD pipeline (future)

### Testing Strategy
1. Manual testing (current)
2. Unit tests (future)
3. Integration tests (future)
4. E2E tests (future)

## Monitoring & Observability

### Current
- Console logging
- HTTP request logging
- Database query logging (via pg)

### Planned
- Structured logging (Winston/Pino)
- Error tracking (Sentry)
- Performance monitoring (APM)
- Database query analytics
- User activity analytics

## Future Architecture Enhancements

### Sprint 2
- Automation engine for workflow rules
- Task queue for async operations
- Playbook template system

### Sprint 3
- File upload service
- External storage integration (S3, Google Drive)
- CSV import processor

### Sprint 4
- AI service layer
- RAG system for document search
- Prompt management system
- Approval workflow engine

### Sprint 5
- Analytics engine
- Report generation service
- Background job scheduler
- Email notification service

---

This architecture is designed to be:
- **Scalable** - Can grow from 10 to 10,000 users
- **Maintainable** - Clear separation of concerns
- **Secure** - Multiple layers of protection
- **Extensible** - Easy to add new features
- **Observable** - Can monitor and debug effectively
