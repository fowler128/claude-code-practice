# Sprint 1 Test Checklist

Use this checklist to verify Sprint 1 functionality. Mark items as you test them.

**Date:** ___________
**Tester:** ___________

---

## Setup & Environment

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed
- [ ] Database created: `bizdeedz_platform_os`
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend `.env` configured with database credentials
- [ ] Database migrations run successfully
- [ ] Seed data loaded (4 users, 4 practice areas, 7 matter types)

---

## Backend Tests

### Server Health
- [ ] Backend starts without errors (`npm run dev`)
- [ ] Health endpoint responds: http://localhost:3001/api/health
- [ ] Console shows: "✓ Database connection established"
- [ ] Console shows: "✓ Server running on port 3001"

### Database Connection
- [ ] Can connect to database via psql
- [ ] All tables created (run: `\dt` in psql)
- [ ] Seed data present (run: `SELECT * FROM users;`)

---

## Frontend Tests

### Server Health
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] App loads at http://localhost:3000
- [ ] No console errors in browser DevTools
- [ ] Login page displays correctly

---

## Authentication Tests

### Login Flow
- [ ] Can login with: `admin@bizdeedz.com` / `admin123`
- [ ] Dashboard loads after successful login
- [ ] User name shows in navigation: "System Admin (admin)"
- [ ] Token stored in localStorage (check DevTools → Application → Local Storage)

### Invalid Login
- [ ] Wrong email shows error: "Invalid email or password"
- [ ] Wrong password shows error: "Invalid email or password"
- [ ] Empty fields show validation errors

### Token Persistence
- [ ] After login, refresh page (F5)
- [ ] Still logged in (not redirected to login)
- [ ] Dashboard loads correctly

### Logout
- [ ] Click "Logout" button
- [ ] Redirected to login page
- [ ] Cannot access /matters without logging in again

### Protected Routes
- [ ] When logged out, visiting /matters redirects to /login
- [ ] When logged out, visiting /my-tasks redirects to /login

---

## Matter Management Tests

### Create Matter - Bankruptcy
- [ ] Click "Matters" → "New Matter"
- [ ] Modal opens
- [ ] Select Practice Area: "Bankruptcy"
- [ ] Matter Type dropdown shows: "Consumer Bankruptcy (General)"
- [ ] Fill in:
  - Client Name: `John Doe`
  - Practice Area: `Bankruptcy`
  - Matter Type: `Consumer Bankruptcy (General)`
  - Priority: `High`
  - Billing Type: `Fixed Fee`
- [ ] Click "Create Matter"
- [ ] Modal closes
- [ ] New matter appears in list
- [ ] Matter number is: `2025-0001` (or sequential)

### Create Matter - Family Law
- [ ] Click "New Matter"
- [ ] Select Practice Area: "Family Law"
- [ ] Matter Type dropdown updates to show: "Divorce", "Custody/Modification"
- [ ] Fill in:
  - Client Name: `Jane Smith`
  - Practice Area: `Family Law`
  - Matter Type: `Divorce`
  - Priority: `Medium`
- [ ] Create successfully
- [ ] Matter number is sequential (e.g., `2025-0002`)

### Create Matter - Immigration
- [ ] Create matter with Practice Area: "Immigration"
- [ ] Verify matter types show immigration options

### Create Matter - Probate/Estate
- [ ] Create matter with Practice Area: "Probate / Estate Planning"
- [ ] Verify matter types show probate options

### View Matters List
- [ ] Matters page shows all created matters
- [ ] Table displays correctly with columns:
  - Matter #
  - Client
  - Practice Area
  - Status
  - Priority
  - Opened
  - Actions
- [ ] Can see all 4 matters created above

### Search Matters
- [ ] Type "John" in search box
- [ ] Only John Doe matter shows
- [ ] Type "Jane" in search box
- [ ] Only Jane Smith matter shows
- [ ] Clear search
- [ ] All matters show again

### Filter by Practice Area
- [ ] Select "Bankruptcy" from Practice Area dropdown
- [ ] Only bankruptcy matters show
- [ ] Select "Family Law"
- [ ] Only family law matters show
- [ ] Select "All Practice Areas"
- [ ] All matters show

### View Matter Detail
- [ ] Click on a matter number link
- [ ] Matter detail page loads
- [ ] Shows matter information cards:
  - Practice Area card
  - Status card
  - Opened date card
- [ ] Shows Tasks section (empty initially)
- [ ] Shows Activity Timeline with creation event

---

## Task Management Tests

### Create Task via API
Since there's no UI for task creation in Sprint 1, test via API:

- [ ] Open browser DevTools → Console
- [ ] Copy token from Local Storage
- [ ] Open Terminal
- [ ] Run command:
```bash
TOKEN="your-token-here"
MATTER_ID="your-matter-id-here"  # Get from matters list

curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"matter_id\": \"$MATTER_ID\",
    \"task_type\": \"document_request\",
    \"title\": \"Request client financial documents\",
    \"description\": \"Need bank statements for last 6 months\",
    \"due_date\": \"2025-02-20T00:00:00Z\"
  }"
```
- [ ] Task created successfully (returns task object)

### View Task on Matter Detail
- [ ] Refresh matter detail page
- [ ] Task appears in Tasks section
- [ ] Task shows:
  - Title: "Request client financial documents"
  - Status badge: "todo"
  - Description

### View My Tasks
- [ ] Click "My Tasks" in navigation
- [ ] Task appears in list (if assigned to you)
- [ ] Shows stats: 1 in "To Do"

### Update Task Status
- [ ] On "My Tasks" page, find the task
- [ ] Task shows "todo" status with "Start" button
- [ ] Click "Start"
- [ ] Status changes to "in_progress"
- [ ] Button changes to "Complete" and "Block"
- [ ] Stats update: 1 in "In Progress"

### Complete Task
- [ ] Click "Complete" button
- [ ] Status changes to "done"
- [ ] Stats update: 1 in "Done"
- [ ] Task shows completion badge

### Block/Unblock Task
- [ ] Create another task (via API)
- [ ] Start the task
- [ ] Click "Block" button
- [ ] Status changes to "blocked"
- [ ] Stats update: 1 in "Blocked"
- [ ] Button shows "Unblock"
- [ ] Click "Unblock"
- [ ] Status returns to "in_progress"

---

## Dashboard Tests

### Stats Cards
- [ ] Dashboard shows 4 stat cards:
  - Active Matters (shows correct count)
  - My Open Tasks (shows correct count)
  - Urgent Matters (shows high/urgent priority count)
  - Recent Activity (shows event count)
- [ ] Numbers match actual data

### Recent Matters Widget
- [ ] Shows up to 5 most recent matters
- [ ] Each matter shows:
  - Matter number
  - Client name
  - Practice area badge
  - Priority badge
- [ ] "View all →" link works

### My Tasks Widget
- [ ] Shows up to 5 tasks
- [ ] Each task shows:
  - Title
  - Matter info
  - Due date (if set)
  - Status badge
- [ ] "View all →" link works

### Recent Activity Widget
- [ ] Shows recent events
- [ ] Events show:
  - Description
  - Matter number
  - Actor name
  - Timestamp
- [ ] Events are in reverse chronological order

---

## Data Integrity Tests

### Matter Numbers
- [ ] Create 3 new matters
- [ ] Verify matter numbers are sequential
- [ ] No duplicate matter numbers
- [ ] Format is: YYYY-#### (e.g., 2025-0001)

### Audit Trail
- [ ] Create a matter
- [ ] View matter detail
- [ ] Event shows: "Matter [number] created for [client]"
- [ ] Update matter status (via API)
- [ ] New event logged
- [ ] Events show correct timestamp
- [ ] Events show correct actor (your name)

### Controlled Lists
- [ ] Practice areas dropdown shows exactly 4 options:
  1. Bankruptcy
  2. Family Law
  3. Immigration
  4. Probate / Estate Planning
- [ ] Each practice area has correct matter types
- [ ] Matter types filter correctly by practice area

---

## API Tests (via cURL)

### Health Check
```bash
curl http://localhost:3001/api/health
```
- [ ] Returns: `{"status":"ok","timestamp":"..."}`

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bizdeedz.com","password":"admin123"}'
```
- [ ] Returns token and user object
- [ ] Token starts with "eyJ"

### Get Matters (Authenticated)
```bash
curl http://localhost:3001/api/matters \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns matters array
- [ ] Includes pagination object

### Get Practice Areas
```bash
curl http://localhost:3001/api/practice-areas \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 4 practice areas

### Get Matter Types
```bash
curl http://localhost:3001/api/matter-types \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 7 matter types

### Get Events
```bash
curl http://localhost:3001/api/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns events array

---

## UI/UX Tests

### Responsive Design
- [ ] Resize browser to mobile width (375px)
- [ ] Mobile menu appears (hamburger icon)
- [ ] Navigation works on mobile
- [ ] Tables scroll horizontally or stack
- [ ] Forms work on mobile

### Navigation
- [ ] All nav links work (Dashboard, Matters, My Tasks)
- [ ] Active page highlighted in nav
- [ ] Back button works from matter detail

### Forms
- [ ] Required fields show validation
- [ ] Error messages display correctly
- [ ] Success messages display
- [ ] Modals open and close properly

### Loading States
- [ ] Spinners show while loading data
- [ ] "Loading..." text displays appropriately
- [ ] No flash of empty state

### Error Handling
- [ ] Invalid API responses show error messages
- [ ] Network errors handled gracefully
- [ ] User sees helpful error messages

### Browser Console
- [ ] Open DevTools → Console
- [ ] No errors in console
- [ ] No warnings (or only known safe warnings)

---

## Security Tests

### Authentication
- [ ] Cannot access API without token
- [ ] Invalid token returns 401
- [ ] Expired token returns 401 (test after 24+ hours)

### Password Security
- [ ] Check database: `SELECT password_hash FROM users LIMIT 1;`
- [ ] Password is hashed (starts with $2b$)
- [ ] Plaintext password NOT stored

### CORS
- [ ] API accessible from frontend origin
- [ ] Proper CORS headers in responses

---

## Performance Tests

### Load Time
- [ ] Dashboard loads in < 2 seconds
- [ ] Matters list loads in < 2 seconds
- [ ] Matter detail loads in < 1 second

### Concurrent Users
- [ ] Open app in 2 different browsers
- [ ] Both can login and work simultaneously
- [ ] No conflicts

---

## Issues Found

Document any bugs or issues here:

### Issue 1
- **Description:**
- **Steps to Reproduce:**
- **Expected:**
- **Actual:**
- **Severity:** Critical / High / Medium / Low

### Issue 2
- **Description:**
- **Steps to Reproduce:**
- **Expected:**
- **Actual:**
- **Severity:** Critical / High / Medium / Low

---

## Summary

**Total Tests:** ~100
**Tests Passed:** _____
**Tests Failed:** _____
**Pass Rate:** _____%

**Critical Issues:** _____
**High Issues:** _____
**Medium Issues:** _____
**Low Issues:** _____

**Ready for Sprint 2:** YES / NO

**Notes:**


---

**Sign-off:**

Name: _______________
Date: _______________
Signature: _______________
