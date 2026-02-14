# BizDeedz Platform OS - API Documentation

## Base URL

Development: `http://localhost:3001/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-token-here>
```

Get your token by calling the `/auth/login` endpoint.

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Endpoints

### Health Check

#### GET /api/health

Check if API is running.

**Authentication:** Not required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-02-05T12:00:00.000Z"
}
```

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate user and receive JWT token.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "admin@bizdeedz.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@bizdeedz.com",
    "first_name": "System",
    "last_name": "Admin",
    "role": "admin",
    "is_active": true,
    "created_at": "2025-02-05T10:00:00.000Z",
    "updated_at": "2025-02-05T10:00:00.000Z"
  }
}
```

**Error (401):**
```json
{
  "error": "Invalid email or password"
}
```

---

### POST /api/auth/register

Register a new user.

**Authentication:** Not required (in development)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "paralegal"
}
```

**Valid roles:**
- `admin`
- `attorney`
- `paralegal`
- `intake_specialist`
- `billing_specialist`
- `ops_lead`

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "...",
    "email": "newuser@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "paralegal",
    "is_active": true,
    "created_at": "2025-02-05T12:00:00.000Z",
    "updated_at": "2025-02-05T12:00:00.000Z"
  }
}
```

---

### GET /api/auth/me

Get current authenticated user's information.

**Authentication:** Required

**Response (200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@bizdeedz.com",
  "first_name": "System",
  "last_name": "Admin",
  "role": "admin",
  "is_active": true,
  "created_at": "2025-02-05T10:00:00.000Z",
  "updated_at": "2025-02-05T10:00:00.000Z"
}
```

---

## Matter Endpoints

### GET /api/matters

Get all matters with optional filtering and pagination.

**Authentication:** Required

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `status` (string) - Filter by status
- `lane` (string) - Filter by lane
- `practice_area_id` (string) - Filter by practice area
- `owner_user_id` (string) - Filter by owner
- `priority` (string) - Filter by priority (low, medium, high, urgent)

**Example Request:**
```
GET /api/matters?practice_area_id=bankruptcy&priority=high&limit=20
```

**Response (200):**
```json
{
  "matters": [
    {
      "matter_id": "550e8400-e29b-41d4-a716-446655440001",
      "matter_number": "2025-0001",
      "client_name": "John Doe",
      "client_entity": null,
      "practice_area_id": "bankruptcy",
      "practice_area_name": "Bankruptcy",
      "matter_type_id": "bk_consumer",
      "matter_type_name": "Consumer Bankruptcy (General)",
      "status": "new_lead",
      "lane": "intake",
      "priority": "high",
      "owner_user_id": "550e8400-e29b-41d4-a716-446655440000",
      "owner_first_name": "System",
      "owner_last_name": "Admin",
      "assigned_roles": [],
      "opened_at": "2025-02-05T10:00:00.000Z",
      "target_dates": null,
      "closed_at": null,
      "matter_health_score": null,
      "risk_tier": null,
      "last_defect_reason": null,
      "defect_count": 0,
      "billing_type": "fixed",
      "metadata_json": null,
      "playbook_id": null,
      "playbook_version": null,
      "created_at": "2025-02-05T10:00:00.000Z",
      "updated_at": "2025-02-05T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}
```

---

### GET /api/matters/:matter_id

Get a single matter by ID.

**Authentication:** Required

**Response (200):**
```json
{
  "matter_id": "550e8400-e29b-41d4-a716-446655440001",
  "matter_number": "2025-0001",
  "client_name": "John Doe",
  "practice_area_name": "Bankruptcy",
  "matter_type_name": "Consumer Bankruptcy (General)",
  "status": "new_lead",
  "lane": "intake",
  "priority": "high",
  "owner_first_name": "System",
  "owner_last_name": "Admin",
  "opened_at": "2025-02-05T10:00:00.000Z",
  ...
}
```

**Error (404):**
```json
{
  "error": "Matter not found"
}
```

---

### POST /api/matters

Create a new matter.

**Authentication:** Required

**Request Body:**
```json
{
  "client_name": "Jane Smith",
  "client_entity": "Smith Industries LLC",
  "practice_area_id": "family_law",
  "matter_type_id": "fl_divorce",
  "priority": "medium",
  "owner_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "billing_type": "hourly",
  "metadata_json": {
    "jurisdiction": "California",
    "court": "Superior Court",
    "notes": "High-net-worth divorce"
  },
  "playbook_id": "family_law_divorce_v1"
}
```

**Required fields:**
- `client_name`
- `practice_area_id`
- `matter_type_id`

**Optional fields:**
- `client_entity`
- `priority` (default: "medium")
- `owner_user_id` (defaults to current user)
- `billing_type`
- `metadata_json`
- `playbook_id`

**Response (201):**
```json
{
  "matter_id": "...",
  "matter_number": "2025-0002",
  "client_name": "Jane Smith",
  "status": "new_lead",
  "lane": "intake",
  ...
}
```

---

### PUT /api/matters/:matter_id

Update a matter.

**Authentication:** Required

**Request Body (all fields optional):**
```json
{
  "status": "active",
  "lane": "document_collection",
  "priority": "high",
  "matter_health_score": 85,
  "risk_tier": "low",
  "metadata_json": {
    "notes": "Updated notes here"
  }
}
```

**Updatable fields:**
- `client_name`
- `client_entity`
- `status`
- `lane`
- `priority`
- `owner_user_id`
- `assigned_roles`
- `target_dates`
- `closed_at`
- `matter_health_score`
- `risk_tier`
- `last_defect_reason`
- `defect_count`
- `billing_type`
- `metadata_json`

**Response (200):**
```json
{
  "matter_id": "...",
  "matter_number": "2025-0002",
  "status": "active",
  "lane": "document_collection",
  ...
}
```

---

### DELETE /api/matters/:matter_id

Close/delete a matter (soft delete).

**Authentication:** Required

**Required Role:** `admin` or `attorney`

**Response (200):**
```json
{
  "message": "Matter closed successfully",
  "matter": {
    "matter_id": "...",
    "closed_at": "2025-02-05T15:00:00.000Z",
    ...
  }
}
```

---

## Task Endpoints

### GET /api/tasks/my

Get tasks assigned to the current user.

**Authentication:** Required

**Query Parameters:**
- `status` (string) - Filter by status (todo, in_progress, done, blocked, cancelled)

**Response (200):**
```json
[
  {
    "task_id": "...",
    "matter_id": "...",
    "matter_number": "2025-0001",
    "client_name": "John Doe",
    "matter_status": "active",
    "matter_priority": "high",
    "task_type": "document_request",
    "title": "Request client financial documents",
    "description": "Need bank statements for last 6 months",
    "assigned_to": "...",
    "assigned_role": "paralegal",
    "due_date": "2025-02-15T00:00:00.000Z",
    "sla_minutes": null,
    "status": "todo",
    "depends_on": [],
    "created_by_type": "human",
    "created_by_id": "...",
    "creator_first_name": "System",
    "creator_last_name": "Admin",
    "completion_notes": null,
    "completed_at": null,
    "created_at": "2025-02-05T10:00:00.000Z",
    "updated_at": "2025-02-05T10:00:00.000Z"
  }
]
```

---

### GET /api/matters/:matter_id/tasks

Get all tasks for a specific matter.

**Authentication:** Required

**Query Parameters:**
- `status` (string) - Filter by status

**Response (200):**
```json
[
  {
    "task_id": "...",
    "matter_id": "...",
    "task_type": "document_request",
    "title": "Request client documents",
    "assigned_first_name": "John",
    "assigned_last_name": "Paralegal",
    "creator_first_name": "System",
    "creator_last_name": "Admin",
    ...
  }
]
```

---

### POST /api/tasks

Create a new task.

**Authentication:** Required

**Request Body:**
```json
{
  "matter_id": "550e8400-e29b-41d4-a716-446655440001",
  "task_type": "document_request",
  "title": "Request tax returns",
  "description": "Need last 2 years of tax returns",
  "assigned_to": "550e8400-e29b-41d4-a716-446655440002",
  "assigned_role": "paralegal",
  "due_date": "2025-02-20T00:00:00.000Z",
  "sla_minutes": 2880
}
```

**Required fields:**
- `matter_id`
- `task_type`
- `title`

**Optional fields:**
- `description`
- `assigned_to`
- `assigned_role`
- `due_date`
- `sla_minutes`

**Response (201):**
```json
{
  "task_id": "...",
  "matter_id": "...",
  "task_type": "document_request",
  "title": "Request tax returns",
  "status": "todo",
  "created_by_type": "human",
  ...
}
```

---

### PUT /api/tasks/:task_id

Update a task.

**Authentication:** Required

**Request Body (all fields optional):**
```json
{
  "status": "in_progress",
  "assigned_to": "...",
  "due_date": "2025-02-25T00:00:00.000Z",
  "completion_notes": "Received all documents"
}
```

**Updatable fields:**
- `title`
- `description`
- `assigned_to`
- `assigned_role`
- `due_date`
- `sla_minutes`
- `status`
- `completion_notes`

**Response (200):**
```json
{
  "task_id": "...",
  "status": "in_progress",
  ...
}
```

---

### DELETE /api/tasks/:task_id

Delete a task.

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

---

## Controlled Lists Endpoints

### GET /api/practice-areas

Get all active practice areas.

**Authentication:** Required

**Response (200):**
```json
[
  {
    "practice_area_id": "bankruptcy",
    "name": "Bankruptcy",
    "description": "Consumer and business bankruptcy cases",
    "is_active": true,
    "created_at": "2025-02-05T10:00:00.000Z"
  },
  {
    "practice_area_id": "family_law",
    "name": "Family Law",
    "description": "Divorce, custody, child support, and family matters",
    "is_active": true,
    "created_at": "2025-02-05T10:00:00.000Z"
  }
]
```

---

### GET /api/matter-types

Get all matter types, optionally filtered by practice area.

**Authentication:** Required

**Query Parameters:**
- `practice_area_id` (string) - Filter by practice area

**Response (200):**
```json
[
  {
    "matter_type_id": "bk_consumer",
    "practice_area_id": "bankruptcy",
    "name": "Consumer Bankruptcy (General)",
    "description": "Chapter 7 or Chapter 13 consumer bankruptcy",
    "is_active": true,
    "created_at": "2025-02-05T10:00:00.000Z"
  }
]
```

---

### GET /api/artifact-types

Get all artifact types.

**Authentication:** Required

**Response (200):**
```json
[
  {
    "artifact_type_id": "intake_form",
    "name": "Intake Questionnaire",
    "description": "Client intake form or questionnaire",
    "category": "intake",
    "is_active": true,
    "created_at": "2025-02-05T10:00:00.000Z"
  }
]
```

---

### GET /api/defect-reasons

Get all defect reasons.

**Authentication:** Required

**Response (200):**
```json
[
  {
    "defect_reason_id": "missing_artifact",
    "name": "Missing Required Artifact",
    "description": "Required document or artifact not provided",
    "category": "documentation",
    "is_active": true,
    "created_at": "2025-02-05T10:00:00.000Z"
  }
]
```

---

## Events Endpoints

### GET /api/events

Get recent events across all matters or for a specific matter.

**Authentication:** Required

**Query Parameters:**
- `matter_id` (string) - Filter by matter ID
- `limit` (number, default: 50) - Number of events to return

**Example Requests:**
```
GET /api/events?limit=10
GET /api/events?matter_id=550e8400-e29b-41d4-a716-446655440001&limit=25
```

**Response (200):**
```json
[
  {
    "event_id": "...",
    "matter_id": "...",
    "matter_number": "2025-0001",
    "client_name": "John Doe",
    "event_type": "matter_created",
    "event_category": "matter",
    "actor_type": "user",
    "actor_user_id": "...",
    "first_name": "System",
    "last_name": "Admin",
    "email": "admin@bizdeedz.com",
    "description": "Matter 2025-0001 created for John Doe",
    "metadata_json": {
      "matter_id": "..."
    },
    "reference_id": "...",
    "reference_type": "matter",
    "created_at": "2025-02-05T10:00:00.000Z"
  }
]
```

---

## Rate Limiting

Currently no rate limiting in development. Will be added in production.

## API Versioning

Current version: v1 (implicit in `/api` path)

Future versions will use: `/api/v2`, `/api/v3`, etc.

---

**Need help?** Check [TESTING.md](./TESTING.md) for example usage or [SETUP.md](./SETUP.md) for troubleshooting.
