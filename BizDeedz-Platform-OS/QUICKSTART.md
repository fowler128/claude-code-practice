# BizDeedz Platform OS - Quick Start

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git

## Setup Steps

### 1. Create Database

```bash
createdb bizdeedz_platform_os
```

### 2. Backend Setup

```bash
cd BizDeedz-Platform-OS/backend
npm install
cp .env.example .env
# Edit .env - set your PostgreSQL password
npm run db:migrate
npm run dev
```

### 3. Frontend Setup (new terminal)

```bash
cd BizDeedz-Platform-OS/frontend
npm install
npm run dev
```

### 4. Login

Open: http://localhost:3000

```
Email: admin@bizdeedz.com
Password: admin123
```

## Test It Works

1. **Create a Matter:**
   - Click "Matters" → "New Matter"
   - Fill in: Client Name, Practice Area, Matter Type
   - Click "Create Matter"

2. **View Dashboard:**
   - Click "Dashboard"
   - See your new matter in stats and recent matters

3. **Create a Task via API:**
   ```bash
   # Get token from browser DevTools → Application → Local Storage
   TOKEN="your-token-here"

   # Get matter ID from matters list
   MATTER_ID="your-matter-id"

   curl -X POST http://localhost:3001/api/tasks \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "{
       \"matter_id\": \"$MATTER_ID\",
       \"task_type\": \"test\",
       \"title\": \"My first task\"
     }"
   ```

4. **View Task:**
   - Click "My Tasks"
   - See your task
   - Click "Start" → "Complete"

## What's Included

✅ **4 Practice Areas:**
- Bankruptcy
- Family Law
- Immigration
- Probate / Estate Planning

✅ **User Roles:**
- Admin
- Attorney
- Paralegal
- Intake Specialist
- Billing Specialist
- Ops Lead

✅ **Core Features:**
- Matter management
- Task tracking
- Audit logging
- Dashboard & analytics
- Role-based access

## Need More Help?

- **Full Setup Guide:** [SETUP.md](./SETUP.md)
- **Testing Guide:** [TESTING.md](./TESTING.md)
- **API Docs:** [API.md](./API.md)
- **Project Overview:** [README.md](./README.md)

## Common Issues

### Backend won't start
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -U postgres -l | grep bizdeedz

# Check .env credentials are correct
cat backend/.env
```

### Frontend won't start
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Can't login
```bash
# Verify seed data
psql -U postgres -d bizdeedz_platform_os -c "SELECT email FROM users;"
```

## Next Steps

1. ✅ Read [TESTING.md](./TESTING.md) to test all features
2. ✅ Review [API.md](./API.md) for API documentation
3. ✅ Check [README.md](./README.md) for full project info
4. ✅ Ready for Sprint 2? Start building playbooks!

---

**Happy Building!** 🚀
