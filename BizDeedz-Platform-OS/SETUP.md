# BizDeedz Platform OS - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Git**

### Check your versions:
```bash
node --version   # Should be v18.x or higher
npm --version    # Should be 9.x or higher
psql --version   # Should be 14.x or higher
```

## Step-by-Step Setup

### 1. Database Setup

#### Option A: Using psql command line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE bizdeedz_platform_os;

# Verify it was created
\l

# Exit
\q
```

#### Option B: Using PostgreSQL GUI (pgAdmin, TablePlus, etc.)

1. Open your PostgreSQL client
2. Create new database: `bizdeedz_platform_os`
3. Set encoding to `UTF8`

### 2. Backend Setup

```bash
# Navigate to backend directory
cd BizDeedz-Platform-OS/backend

# Install dependencies (this may take a minute)
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your database credentials
# Use your favorite text editor (nano, vim, code, etc.)
nano .env
```

#### Configure your .env file:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bizdeedz_platform_os
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here  # <-- CHANGE THIS

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production  # <-- CHANGE THIS
JWT_EXPIRES_IN=24h
```

**Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password.

#### Run database migrations:

```bash
# This will create all tables and insert seed data
npm run db:migrate
```

You should see:
```
✓ Schema created successfully
✓ Seed data inserted successfully
Migration completed successfully!
```

#### Start the backend server:

```bash
npm run dev
```

You should see:
```
✓ Database connection established
✓ Server running on port 3001
✓ API available at http://localhost:3001/api
✓ Environment: development
```

**Leave this terminal running** and open a new terminal for the frontend.

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd BizDeedz-Platform-OS/frontend

# Install dependencies (this may take a minute)
npm install

# Start the development server
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### 4. Access the Application

Open your browser and go to: **http://localhost:3000**

#### Default Login Credentials:

```
Email: admin@bizdeedz.com
Password: admin123
```

**⚠️ Security Note:** These are demo credentials. Change them immediately in production!

## Verification Checklist

After setup, verify everything is working:

### Backend Health Check

Open: http://localhost:3001/api/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-02-05T..."
}
```

### Database Verification

```bash
# Connect to PostgreSQL
psql -U postgres -d bizdeedz_platform_os

# Check tables were created
\dt

# You should see:
# - users
# - matters
# - tasks
# - artifacts
# - ai_runs
# - events
# - billing_events
# - practice_areas
# - matter_types
# - artifact_types
# - defect_reasons
# - playbook_templates
# - automation_rules
# - sla_rules
# - prompt_library

# Check seed data
SELECT * FROM users;
SELECT * FROM practice_areas;
SELECT * FROM matter_types;

# Exit
\q
```

### Frontend Application

Test these features:

1. ✅ **Login Page** - Enter credentials and login
2. ✅ **Dashboard** - View stats and recent activity
3. ✅ **Create Matter** - Click "New Matter" button
4. ✅ **View Matters** - Navigate to Matters page
5. ✅ **View Tasks** - Navigate to My Tasks page

## Troubleshooting

### Backend won't start

**Error: "ECONNREFUSED" or "password authentication failed"**

Solution:
- Verify PostgreSQL is running: `pg_isready`
- Check your .env credentials match your PostgreSQL setup
- Ensure database exists: `psql -U postgres -l`

**Error: "Port 3001 already in use"**

Solution:
- Kill the process: `lsof -ti:3001 | xargs kill -9`
- Or change PORT in .env to 3002

### Frontend won't start

**Error: "Port 3000 already in use"**

Solution:
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or Vite will prompt you to use a different port

**Error: "Cannot find module"**

Solution:
- Delete node_modules and package-lock.json
- Run `npm install` again

### Database migration fails

**Error: "database does not exist"**

Solution:
```bash
createdb bizdeedz_platform_os
# Or using psql:
psql -U postgres -c "CREATE DATABASE bizdeedz_platform_os;"
```

**Error: "relation already exists"**

Solution:
- Drop and recreate the database:
```bash
psql -U postgres
DROP DATABASE bizdeedz_platform_os;
CREATE DATABASE bizdeedz_platform_os;
\q
npm run db:migrate
```

### Login fails

**Error: "Invalid email or password"**

Solution:
- Verify seed data was inserted: `psql -U postgres -d bizdeedz_platform_os -c "SELECT * FROM users;"`
- If no users exist, run migrations again: `npm run db:migrate`
- Use exact credentials: `admin@bizdeedz.com` / `admin123`

### API requests fail with 401

Solution:
- Clear browser localStorage: Open DevTools → Application → Local Storage → Clear
- Login again

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Backend**: Changes to .ts files automatically restart the server
- **Frontend**: Changes to .tsx/.ts files automatically refresh the browser

### View Logs

**Backend logs:**
- Server outputs to the terminal where you ran `npm run dev`
- Each API request is logged with timestamp, method, and path

**Frontend logs:**
- Open browser DevTools → Console
- Network tab shows API requests

### Database Tools

Recommended PostgreSQL GUI clients:
- **pgAdmin** (free, included with PostgreSQL)
- **TablePlus** (free tier available, very user-friendly)
- **DBeaver** (free, open source)
- **Postico** (Mac only)

### API Testing

Use these tools to test API endpoints:
- **Postman** - Full-featured API client
- **Insomnia** - Lightweight alternative
- **cURL** - Command line (examples in TESTING.md)
- **HTTPie** - User-friendly cURL alternative

### VS Code Extensions

Recommended extensions for development:
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - CSS class autocomplete
- **PostgreSQL** - Database management
- **REST Client** - Test APIs from .http files

## Next Steps

Once setup is complete:

1. **Read [TESTING.md](./TESTING.md)** - Comprehensive testing guide
2. **Review [API.md](./API.md)** - API documentation with examples
3. **Check [README.md](./README.md)** - Full project documentation

## Need Help?

If you encounter issues not covered here:

1. Check the error message carefully
2. Search the error online
3. Review the logs (backend terminal output)
4. Check browser DevTools console for frontend errors
5. Verify all prerequisites are installed correctly

## Security Reminders

Before deploying to production:

- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET (use: `openssl rand -base64 32`)
- [ ] Update database credentials
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting
- [ ] Set up database backups

---

**Setup complete!** You're ready to test Sprint 1. 🚀
