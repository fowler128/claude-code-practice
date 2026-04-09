# BizDeedz Platform OS - Testing Guide

## Overview

This guide provides comprehensive testing procedures for Sprint 1 features.

## Testing Checklist

### ✅ Setup Verification
- [ ] Backend server running on port 3001
- [ ] Frontend server running on port 3000
- [ ] Database connection successful
- [ ] Seed data loaded

### ✅ Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Logout functionality
- [ ] Token persistence (refresh page while logged in)
- [ ] Protected routes redirect when not authenticated

### ✅ Matter Management
- [ ] Create new matter
- [ ] View matters list
- [ ] Filter matters by practice area
- [ ] Search matters by number/client name
- [ ] View matter details
- [ ] Update matter
- [ ] Delete/close matter

### ✅ Task Management
- [ ] Create task
- [ ] View tasks for a matter
- [ ] View my assigned tasks
- [ ] Update task status (todo → in_progress → done)
- [ ] Mark task as blocked
- [ ] Delete task

### ✅ Events & Audit Log
- [ ] Events logged for matter creation
- [ ] Events logged for status changes
- [ ] Events logged for task updates
- [ ] View events on dashboard
- [ ] View events on matter detail page

### ✅ UI/UX
- [ ] Dashboard loads properly
- [ ] Navigation works
- [ ] Modals open and close
- [ ] Forms validate correctly
- [ ] Loading states display
- [ ] Error messages display
- [ ] Responsive on mobile
- [ ] No console errors

## Detailed Test Scenarios

### 1. User Authentication Flow

#### Test 1.1: Successful Login
1. Navigate to http://localhost:3000
2. Enter email: `admin@bizdeedz.com`
3. Enter password: `admin123`
4. Click "Sign In"
5. **Expected:** Redirected to dashboard, user info shown in nav

#### Test 1.2: Invalid Login
1. Enter email: `test@test.com`
2. Enter password: `wrongpassword`
3. Click "Sign In"
4. **Expected:** Error message: "Invalid email or password"

#### Test 1.3: Token Persistence
1. Login successfully
2. Refresh the page (F5)
3. **Expected:** Still logged in, dashboard loads

#### Test 1.4: Logout
1. Click "Logout" button in nav
2. **Expected:** Redirected to login page, can't access protected routes

#### Test 1.5: Protected Routes
1. Logout if logged in
2. Try to navigate to http://localhost:3000/matters
3. **Expected:** Redirected to login page

### 2. Matter Management Flow

#### Test 2.1: Create Bankruptcy Matter
1. Login as admin
2. Click "Matters" in navigation
3. Click "New Matter" button
4. Fill in form:
   - Client Name: `John Doe`
   - Practice Area: `Bankruptcy`
   - Matter Type: `Consumer Bankruptcy (General)`
   - Priority: `High`
   - Billing Type: `Fixed Fee`
5. Click "Create Matter"
6. **Expected:** Matter created, redirected to matters list, new matter visible

#### Test 2.2: Create Family Law Matter
1. Click "New Matter"
2. Fill in form:
   - Client Name: `Jane Smith`
   - Practice Area: `Family Law`
   - Matter Type: `Divorce`
   - Priority: `Medium`
3. Click "Create Matter"
4. **Expected:** Matter created successfully

#### Test 2.3: Search Matters
1. In matters list, type `John` in search box
2. **Expected:** Only John Doe matter shows
3. Clear search, type `Jane`
4. **Expected:** Only Jane Smith matter shows

#### Test 2.4: Filter by Practice Area
1. Select "Bankruptcy" from Practice Area dropdown
2. **Expected:** Only bankruptcy matters show
3. Select "Family Law"
4. **Expected:** Only family law matters show

#### Test 2.5: View Matter Details
1. Click on a matter number link
2. **Expected:** Matter detail page loads with:
   - Matter info cards
   - Tasks section (empty initially)
   - Activity timeline showing creation event

#### Test 2.6: Update Matter Status
1. On matter detail page, note current status
2. (This requires API call - see API testing section)

### 3. Task Management Flow

#### Test 3.1: Create Task via API
Since there's no UI for task creation yet, use API:

```bash
# Get your auth token first (from browser DevTools → Application → Local Storage)
TOKEN="your-token-here"

# Create a task (replace MATTER_ID with actual ID from your matter)
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matter_id": "MATTER_ID_HERE",
    "task_type": "document_request",
    "title": "Request client financial documents",
    "description": "Need bank statements for last 6 months",
    "due_date": "2025-02-15T00:00:00Z"
  }'
```

#### Test 3.2: View Tasks on Matter Detail
1. Navigate to matter detail page
2. **Expected:** New task appears in Tasks section with "todo" status

#### Test 3.3: View My Tasks
1. Click "My Tasks" in navigation
2. **Expected:** Task appears in list (if assigned to you)

#### Test 3.4: Update Task Status
1. On "My Tasks" page, find a task with "todo" status
2. Click "Start" button
3. **Expected:** Status changes to "in_progress", button changes to "Complete"
4. Click "Complete" button
5. **Expected:** Status changes to "done", task shows as completed

#### Test 3.5: Block Task
1. Find a task with "in_progress" status
2. Click "Block" button
3. **Expected:** Status changes to "blocked", button shows "Unblock"

### 4. Dashboard Verification

#### Test 4.1: Dashboard Stats
1. Navigate to dashboard
2. **Expected:** Stats cards show:
   - Active Matters: (count of matters you created)
   - My Open Tasks: (count of tasks not done)
   - Urgent Matters: (count of high/urgent priority matters)
   - Recent Activity: (count of events)

#### Test 4.2: Recent Matters Widget
1. Check "Recent Matters" section
2. **Expected:** Shows up to 5 most recent matters
3. Click "View all →"
4. **Expected:** Navigates to matters page

#### Test 4.3: Recent Activity Widget
1. Check "Recent Activity" section
2. **Expected:** Shows events with:
   - Description
   - Matter number (if applicable)
   - Actor name
   - Timestamp

### 5. Data Integrity Tests

#### Test 5.1: Matter Number Generation
1. Create 3 matters
2. **Expected:** Matter numbers are sequential (e.g., 2025-0001, 2025-0002, 2025-0003)
3. Check they're unique

#### Test 5.2: Audit Trail
1. Create a matter
2. Update the matter
3. View events for that matter
4. **Expected:** Events show:
   - Matter created
   - Matter updated
   - Correct timestamps
   - Correct actor

#### Test 5.3: Controlled Lists
1. Check practice areas dropdown loads 4 options:
   - Bankruptcy
   - Family Law
   - Immigration
   - Probate / Estate Planning
2. Select each practice area
3. **Expected:** Matter types update to show only types for that practice area

## API Testing

### Using cURL

#### 1. Login (Get Token)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bizdeedz.com",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "...",
    "email": "admin@bizdeedz.com",
    "first_name": "System",
    "last_name": "Admin",
    "role": "admin",
    "is_active": true
  }
}
```

Save the token for subsequent requests.

#### 2. Get All Matters
```bash
curl http://localhost:3001/api/matters \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. Create Matter
```bash
curl -X POST http://localhost:3001/api/matters \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test Client",
    "practice_area_id": "bankruptcy",
    "matter_type_id": "bk_consumer",
    "priority": "medium"
  }'
```

#### 4. Get Matter by ID
```bash
curl http://localhost:3001/api/matters/MATTER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5. Update Matter
```bash
curl -X PUT http://localhost:3001/api/matters/MATTER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "priority": "high"
  }'
```

#### 6. Create Task
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "matter_id": "MATTER_ID_HERE",
    "task_type": "document_request",
    "title": "Request client documents",
    "description": "Need tax returns and bank statements",
    "due_date": "2025-02-20T00:00:00Z"
  }'
```

#### 7. Get My Tasks
```bash
curl http://localhost:3001/api/tasks/my \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 8. Update Task Status
```bash
curl -X PUT http://localhost:3001/api/tasks/TASK_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

#### 9. Get Events
```bash
# All recent events
curl http://localhost:3001/api/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Events for specific matter
curl "http://localhost:3001/api/events?matter_id=MATTER_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 10. Get Practice Areas
```bash
curl http://localhost:3001/api/practice-areas \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 11. Get Matter Types
```bash
# All matter types
curl http://localhost:3001/api/matter-types \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Matter types for specific practice area
curl "http://localhost:3001/api/matter-types?practice_area_id=bankruptcy" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Browser DevTools

1. Login to the application
2. Open DevTools (F12)
3. Go to Console tab
4. Run API calls using fetch:

```javascript
// Get all matters
fetch('/api/matters', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log);

// Create matter
fetch('/api/matters', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    client_name: 'Browser Test Client',
    practice_area_id: 'family_law',
    matter_type_id: 'fl_divorce',
    priority: 'medium'
  })
})
.then(r => r.json())
.then(console.log);
```

## Database Verification

### Check Seed Data

```sql
-- Connect to database
psql -U postgres -d bizdeedz_platform_os

-- Check users
SELECT user_id, email, first_name, last_name, role FROM users;

-- Check practice areas
SELECT * FROM practice_areas;

-- Check matter types
SELECT mt.*, pa.name as practice_area_name
FROM matter_types mt
JOIN practice_areas pa ON mt.practice_area_id = pa.practice_area_id;

-- Check created matters
SELECT matter_id, matter_number, client_name, practice_area_id, status, opened_at
FROM matters
ORDER BY opened_at DESC;

-- Check tasks
SELECT t.task_id, t.title, t.status, m.matter_number, m.client_name
FROM tasks t
JOIN matters m ON t.matter_id = m.matter_id;

-- Check events
SELECT e.event_type, e.description, e.created_at, u.email
FROM events e
LEFT JOIN users u ON e.actor_user_id = u.user_id
ORDER BY e.created_at DESC
LIMIT 20;
```

## Performance Testing

### Load Testing (Simple)

Create multiple matters quickly:

```bash
TOKEN="your-token-here"

for i in {1..10}; do
  curl -X POST http://localhost:3001/api/matters \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"client_name\": \"Test Client $i\",
      \"practice_area_id\": \"bankruptcy\",
      \"matter_type_id\": \"bk_consumer\",
      \"priority\": \"medium\"
    }"
  echo "Created matter $i"
done
```

Check that:
- All 10 matters created successfully
- Matter numbers are sequential and unique
- Dashboard stats updated correctly
- No database errors in backend logs

## Common Issues & Solutions

### Issue: CORS errors in browser
**Solution:** Backend CORS is configured for all origins in development. If you see CORS errors, check that backend is running.

### Issue: Token expired
**Solution:** Logout and login again. Default expiry is 24 hours.

### Issue: "Matter not found" after creation
**Solution:** Check that events were logged. Query the database to verify matter was actually created.

### Issue: Tasks not showing
**Solution:** Make sure you're assigned to the task, or check that the matter_id is correct.

### Issue: Stats not updating
**Solution:** Refresh the page. React Query caches data for a short time.

## Test Results Template

Use this template to record your test results:

```
## Sprint 1 Test Results

Date: ___________
Tester: ___________
Environment: Development

### Setup
- [ ] Backend running: YES / NO
- [ ] Frontend running: YES / NO
- [ ] Database connected: YES / NO

### Authentication (Pass/Fail)
- [ ] Login with valid credentials: ___
- [ ] Login with invalid credentials: ___
- [ ] Logout: ___
- [ ] Token persistence: ___

### Matter Management (Pass/Fail)
- [ ] Create matter: ___
- [ ] View matters list: ___
- [ ] Filter matters: ___
- [ ] Search matters: ___
- [ ] View matter details: ___

### Task Management (Pass/Fail)
- [ ] Create task: ___
- [ ] View tasks: ___
- [ ] Update task status: ___
- [ ] Block/unblock task: ___

### Overall Assessment
- Critical bugs found: ___
- Minor bugs found: ___
- Ready for Sprint 2: YES / NO

### Notes:
[Add any observations or issues here]
```

## Next Steps After Testing

Once testing is complete:

1. ✅ Document any bugs found
2. ✅ Fix critical issues
3. ✅ Update this testing guide with any new scenarios
4. ✅ Proceed to Sprint 2 development

---

**Happy Testing!** 🧪
