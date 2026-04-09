# BizDeedz Platform OS + OpenClaw Deployment Guide
## Plan A: 95% Buttons (Hetzner + Coolify + Tailscale)

**Target**: Production VPS deployment with button-driven setup and private networking.

---

## 📋 Prerequisites

- Hetzner Cloud account (https://console.hetzner.cloud)
- Tailscale account (https://login.tailscale.com)
- Domain name (optional, for SSL/custom domains)
- 30 minutes of time

---

## 🖥️ Part 1: Hetzner Cloud VPS Setup (5 clicks)

### Step 1: Create Project
1. Go to https://console.hetzner.cloud
2. Click **"New Project"**
3. Name: `bizdeedz-production`
4. Click **"Create"**

### Step 2: Create Server
1. Click **"Add Server"** button
2. **Location**: Choose closest to you (e.g., `Ashburn, VA` or `Falkenstein, Germany`)
3. **Image**: `Ubuntu 24.04`
4. **Type**:
   - **Recommended**: `CPX31` (4 vCPU, 8 GB RAM, 160 GB SSD) - €12.90/month
   - **Minimum**: `CPX21` (3 vCPU, 4 GB RAM, 80 GB SSD) - €7.90/month
   - **Production**: `CPX41` (8 vCPU, 16 GB RAM, 240 GB SSD) - €24.90/month
5. **Networking**:
   - ✅ Public IPv4
   - ✅ Public IPv6
6. **SSH Keys**:
   - Click **"Add SSH key"** (paste your public key from `~/.ssh/id_rsa.pub`)
   - OR use password (less secure, but works)
7. **Volumes**: Skip (we'll use local storage)
8. **Firewalls**: Skip for now (we'll create it next)
9. **Backups**:
   - ❌ Skip (we'll use custom backups)
10. **Placement Groups**: Skip
11. **Labels**: Add `env=production`, `app=bizdeedz`
12. **Name**: `bizdeedz-prod-01`
13. Click **"Create & Buy Now"**

**Wait 30-60 seconds** for server to provision. Note the **public IP address**.

### Step 3: Create Firewall (Temporary - SSH Only)
1. In Hetzner sidebar, click **"Firewalls"**
2. Click **"Create Firewall"**
3. Name: `bizdeedz-temp-firewall`
4. **Inbound Rules**:
   - Rule 1: `SSH` | Protocol: `TCP` | Port: `22` | Source: `Any IPv4` + `Any IPv6`
   - Rule 2: `HTTP` | Protocol: `TCP` | Port: `80` | Source: `Any IPv4` + `Any IPv6` (for Coolify setup)
   - Rule 3: `HTTPS` | Protocol: `TCP` | Port: `443` | Source: `Any IPv4` + `Any IPv6` (for Coolify)
5. **Outbound Rules**:
   - Leave default (Allow All)
6. **Apply To**:
   - Select your server `bizdeedz-prod-01`
7. Click **"Create Firewall"**

### Step 4: First Login
```bash
ssh root@<YOUR_SERVER_IP>
```

If prompted about fingerprint, type `yes`.

---

## 🔐 Part 2: Tailscale Setup (2 commands)

Tailscale creates a private network so you can access your VPS securely without exposing SSH to the internet.

### Step 1: Install Tailscale
```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

### Step 2: Authenticate
```bash
tailscale up
```

This will output a URL like:
```
To authenticate, visit: https://login.tailscale.com/a/abc123xyz
```

1. Open that URL in your browser
2. Log in to Tailscale
3. Click **"Connect"**
4. Note your **Tailscale IP** (shown in the Tailscale admin console, e.g., `100.64.1.5`)

### Step 3: Verify Connection
From your **local machine**:
```bash
ssh root@100.64.1.5  # Use your Tailscale IP
```

✅ If this works, you can now access your VPS privately!

---

## 🚀 Part 3: Coolify Setup (3 commands)

Coolify is a self-hosted deployment platform (like Heroku/Vercel) with a web UI.

### Step 1: Install Coolify
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

This takes **5-10 minutes**. It will:
- Install Docker
- Install Coolify
- Start Coolify services
- Generate SSL certificates (if domain configured)

### Step 2: Access Coolify Dashboard
**Option A: Via Tailscale (Recommended)**
```
http://100.64.1.5:8000
```

**Option B: Via Public IP (Temporary)**
```
http://<YOUR_SERVER_IP>:8000
```

### Step 3: Initial Setup
1. **Create Account**:
   - Email: `admin@bizdeedz.local`
   - Password: (strong password, save it!)
   - Click **"Register"**

2. **Add Server** (one-click):
   - Coolify auto-detects localhost
   - Click **"Validate & Save"**

3. **Create Project**:
   - Click **"New Project"**
   - Name: `BizDeedz Platform OS`
   - Click **"Create"**

4. **Add Environment**:
   - Click **"New Environment"**
   - Name: `production`
   - Click **"Create"**

---

## 📦 Part 4: PostgreSQL Database (6 clicks)

### Step 1: Add PostgreSQL Resource
1. In Coolify dashboard, go to your project
2. Click **"New Resource"** → **"Database"**
3. Select **"PostgreSQL"**
4. **Configuration**:
   - Name: `bizdeedz-postgres`
   - Postgres Version: `16` (latest stable)
   - Database Name: `bizdeedz_platform_os`
   - Username: `bizdeedz_user`
   - Password: (auto-generated, copy it!)
   - Port: `5432` (internal)
   - Public Port: Leave empty (private only)
5. Click **"Create Database"**
6. Wait 30-60 seconds for PostgreSQL to start

### Step 2: Note Connection Details
Coolify shows:
```
Internal URL: postgresql://bizdeedz_user:PASSWORD@bizdeedz-postgres:5432/bizdeedz_platform_os
```

Copy this - you'll need it for the backend.

---

## 🏗️ Part 5: Deploy BizDeedz Backend (8 clicks)

### Step 1: Add Backend Service
1. Click **"New Resource"** → **"Application"**
2. Select **"Public Repository"**
3. **Git Configuration**:
   - Repository URL: `https://github.com/fowler128/claude-code-practice`
   - Branch: `claude/bizdeedz-platform-os-itxJo`
   - Build Pack: `nixpacks` (auto-detected)
   - Base Directory: `BizDeedz-Platform-OS/backend`
4. **Application Settings**:
   - Name: `bizdeedz-backend`
   - Port: `3001`
   - Domain: Leave empty (we'll use Tailscale)
5. Click **"Create Application"**

### Step 2: Configure Environment Variables
1. Click **"Environment Variables"** tab
2. Add the following:
   ```
   NODE_ENV=production
   PORT=3001

   # Database (use the connection string from Step 4)
   DATABASE_URL=postgresql://bizdeedz_user:PASSWORD@bizdeedz-postgres:5432/bizdeedz_platform_os
   DB_HOST=bizdeedz-postgres
   DB_PORT=5432
   DB_NAME=bizdeedz_platform_os
   DB_USER=bizdeedz_user
   DB_PASSWORD=<paste password>

   # JWT Secret (generate with: openssl rand -base64 32)
   JWT_SECRET=<your-generated-secret>
   JWT_EXPIRES_IN=24h
   ```
3. Click **"Save"**

### Step 3: Deploy
1. Click **"Deploy"** button
2. Wait 3-5 minutes for build
3. Check **"Logs"** tab to monitor deployment
4. Look for: `Server running on port 3001`

✅ Backend is live at: `http://bizdeedz-backend:3001` (internal Docker network)

---

## 🎨 Part 6: Deploy BizDeedz Frontend (8 clicks)

### Step 1: Add Frontend Service
1. Click **"New Resource"** → **"Application"**
2. **Git Configuration**:
   - Repository URL: `https://github.com/fowler128/claude-code-practice`
   - Branch: `claude/bizdeedz-platform-os-itxJo`
   - Build Pack: `nixpacks`
   - Base Directory: `BizDeedz-Platform-OS/frontend`
3. **Application Settings**:
   - Name: `bizdeedz-frontend`
   - Port: `3000`
   - Domain:
     - **With custom domain**: `app.yourdomain.com` (Coolify auto-SSL)
     - **Without domain**: Leave empty, use `http://100.64.1.5:3000` (Tailscale)
4. Click **"Create Application"**

### Step 2: Configure Build Environment
1. Click **"Environment Variables"** tab
2. Add:
   ```
   VITE_API_BASE_URL=http://bizdeedz-backend:3001/api
   ```

   **Note**: If using custom domain for backend, use:
   ```
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

3. Click **"Save"**

### Step 3: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Access at:
   - **Via Tailscale**: `http://100.64.1.5:3000`
   - **Via Domain**: `https://app.yourdomain.com`

✅ Frontend is live!

---

## 🤖 Part 7: Deploy OpenClaw (10 clicks)

### Step 1: Prepare OpenClaw Code
First, we need to complete the OpenClaw implementation. SSH into your server via Tailscale:

```bash
ssh root@100.64.1.5

# Create data directories
mkdir -p /srv/data/{inbox,clients,knowledge_base,logs,backups}
mkdir -p /srv/data/inbox/processed
mkdir -p /srv/data/logs/openclaw

# Set permissions
chmod 755 /srv/data
```

### Step 2: Add OpenClaw Service in Coolify
1. Click **"New Resource"** → **"Application"**
2. **Git Configuration**:
   - Repository URL: `https://github.com/fowler128/claude-code-practice`
   - Branch: `claude/bizdeedz-platform-os-itxJo`
   - Build Pack: `nixpacks`
   - Base Directory: `OpenClaw`
3. **Application Settings**:
   - Name: `openclaw`
   - Port: `3002` (if web interface)
   - **Public Access**: ❌ Disabled (internal only)
4. Click **"Create Application"**

### Step 3: Configure Environment Variables
1. **Generate Service Account**:

   First, we need to create a service account in BizDeedz. Access the backend container:

   ```bash
   # In Coolify, click on bizdeedz-backend → "Execute Command"
   # Or SSH to server and run:
   docker exec -it bizdeedz-backend sh

   # Run service account creation (we'll create a script for this)
   npm run create-service-account
   ```

   This will output an API key - **COPY IT** (only shown once).

2. Add environment variables:
   ```
   # BizDeedz Integration
   BIZDEEDZ_OS_BASE_URL=http://bizdeedz-backend:3001/api
   BIZDEEDZ_OS_SERVICE_KEY=<paste-api-key>

   # File System
   DATA_ROOT=/srv/data
   INBOX_PATH=/srv/data/inbox
   CLIENTS_PATH=/srv/data/clients
   LOGS_PATH=/srv/data/logs

   # Job Config
   INBOX_SCAN_ENABLED=true
   INBOX_SCAN_INTERVAL=300000
   LOCK_EXPIRY_SECONDS=300

   # Retry
   API_RETRY_COUNT=3
   API_RETRY_BASE_DELAY_MS=1000

   # Logging
   LOG_LEVEL=info
   LOG_FORMAT=json
   ```

3. Click **"Save"**

### Step 4: Mount Volume for /srv/data
1. Click **"Volumes"** tab
2. Add Volume:
   - Host Path: `/srv/data`
   - Container Path: `/srv/data`
3. Click **"Save"**

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Check logs for: `OpenClaw started successfully`

✅ OpenClaw is running!

---

## 🛡️ Part 8: Security Hardening

### Step 1: Update Hetzner Firewall (Lock SSH to Tailscale Only)

1. Go to Hetzner Cloud → **Firewalls** → `bizdeedz-temp-firewall`
2. **Edit Inbound Rules**:
   - **Delete** the SSH rule with `Any IPv4/IPv6`
   - **Add New Rule**:
     - Name: `SSH via Tailscale`
     - Protocol: `TCP`
     - Port: `22`
     - Source: `100.64.0.0/10` (Tailscale CGNAT range)
   - Keep HTTP/HTTPS rules if using custom domains
3. Click **"Save Firewall"**

✅ SSH is now only accessible via Tailscale!

### Step 2: Disable OpenClaw Public Access
1. In Coolify, go to OpenClaw application
2. Click **"Domains"** tab
3. Ensure **"Public Access"** is ❌ Disabled
4. If there's a public URL, click **"Delete"**

### Step 3: Create Non-Root User
```bash
# SSH via Tailscale
ssh root@100.64.1.5

# Create deploy user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Copy SSH keys
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Test login
exit
ssh deploy@100.64.1.5
```

### Step 4: Restrict File Permissions
```bash
# As root via Tailscale
ssh root@100.64.1.5

# Set ownership
chown -R deploy:docker /srv/data
chmod 755 /srv/data
chmod 755 /srv/data/inbox
chmod 755 /srv/data/clients
chmod 750 /srv/data/logs
chmod 750 /srv/data/backups

# OpenClaw should run as deploy user (configure in Coolify)
```

### Step 5: Enable Automated Backups

Create backup script:
```bash
cat > /usr/local/bin/backup-bizdeedz.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR=/srv/data/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
docker exec bizdeedz-postgres pg_dump -U bizdeedz_user bizdeedz_platform_os | \
  gzip > $BACKUP_DIR/database/postgres_$DATE.sql.gz

# Backup files (exclude logs)
tar -czf $BACKUP_DIR/files/data_$DATE.tar.gz \
  --exclude='/srv/data/logs/*' \
  --exclude='/srv/data/backups/*' \
  /srv/data

# Keep only last 7 days
find $BACKUP_DIR/database -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR/files -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-bizdeedz.sh

# Test backup
/usr/local/bin/backup-bizdeedz.sh
```

Add to cron:
```bash
crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-bizdeedz.sh >> /srv/data/logs/backup.log 2>&1
```

---

## 📁 Part 9: File System Architecture

### Structure
```
/srv/data/
├── inbox/                          # Watched by OpenClaw
│   ├── document1.pdf              # Raw files dropped here
│   └── processed/                  # Moved after processing
│       └── 2026-02-14/
│           └── document1.pdf
├── clients/                        # Canonical storage
│   └── {client_key}/
│       └── matters/
│           └── {matter_key}/
│               ├── artifacts/      # Filed documents
│               │   ├── intake-form-v1.pdf
│               │   └── contract-signed-v2.pdf
│               ├── work_product/   # Generated docs
│               │   └── draft-motion.docx
│               └── exports/        # Submitted files
│                   └── court-filing-2026-02-14.pdf
├── knowledge_base/                 # Future RAG
├── logs/                           # Structured logs
│   ├── openclaw/
│   │   └── inbox-scan.jsonl
│   ├── bizdeedz/
│   └── integration/
└── backups/                        # Automated backups
    ├── database/
    │   └── postgres_20260214_020000.sql.gz
    └── files/
        └── data_20260214_020000.tar.gz
```

### Client/Matter Folder Naming
Pattern: `{client_last_name}_{client_first_initial}_{client_id_suffix}`

Examples:
- `smith_j_001` → `/srv/data/clients/smith_j_001/matters/divorce_001/`
- `acme_corp_a_002` → `/srv/data/clients/acme_corp_a_002/matters/contract_dispute_001/`

Stored in `matters.folder_path` column.

---

## 🔧 Part 10: BizDeedz OS Integration Enhancements

### Step 1: Run Database Migration
```bash
# Access backend container
docker exec -it bizdeedz-backend sh

# Run migration
psql $DATABASE_URL -f /app/src/db/matter-file-tracking-migration.sql
```

### Step 2: Create Service Account Script

Create in `backend/src/scripts/create-service-account.ts`:
```typescript
import { createServiceAccount } from '../middleware/serviceAuth';
import pool from '../db/pool';

async function main() {
  const args = process.argv.slice(2);
  const name = args.find(a => a.startsWith('--name='))?.split('=')[1] || 'OpenClaw Bot';
  const scopes = args.find(a => a.startsWith('--scopes='))?.split('=')[1]?.split(',') ||
    ['ingestion:write', 'artifacts:write', 'events:write'];

  console.log(`Creating service account: ${name}`);
  console.log(`Scopes: ${scopes.join(', ')}`);

  const { account, apiKey } = await createServiceAccount(
    name,
    'OpenClaw automation runtime',
    scopes as any
  );

  console.log('\n✅ Service Account Created Successfully!\n');
  console.log('Account ID:', account.service_id);
  console.log('Name:', account.name);
  console.log('Scopes:', account.scopes.join(', '));
  console.log('\n🔑 API Key (save this - only shown once):');
  console.log(apiKey);
  console.log('\nAdd to OpenClaw .env:');
  console.log(`BIZDEEDZ_OS_SERVICE_KEY=${apiKey}`);

  await pool.end();
}

main().catch(console.error);
```

Add to `package.json`:
```json
{
  "scripts": {
    "create-service-account": "ts-node src/scripts/create-service-account.ts"
  }
}
```

### Step 3: Create Artifact Registration Endpoint

This is already done in `integrationController.ts` - the endpoint:
```
POST /api/integration/artifacts
```

---

## ✅ Part 11: Verification Checklist

### Backend Health
```bash
curl http://100.64.1.5:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Database Connection
```bash
docker exec bizdeedz-postgres psql -U bizdeedz_user -d bizdeedz_platform_os -c "\dt"
# Should list all tables
```

### Frontend Access
Visit: `http://100.64.1.5:3000`
- Should show login page
- Login: `admin@bizdeedz.com` / `admin123`

### OpenClaw Integration
```bash
# Drop test file
docker exec openclaw sh -c 'echo "test" > /srv/data/inbox/test.txt'

# Check logs
docker logs openclaw --tail 50

# Verify ingestion item created
docker exec bizdeedz-backend sh -c \
  'psql $DATABASE_URL -c "SELECT * FROM ingestion_items ORDER BY created_at DESC LIMIT 5;"'
```

### Tailscale Connectivity
```bash
# From local machine
ssh deploy@100.64.1.5
# Should work

# Try public IP (should fail)
ssh deploy@<PUBLIC_IP>
# Should timeout or refuse connection
```

---

## 🎯 Summary: What We Built

### Infrastructure
- ✅ Hetzner Cloud VPS (Ubuntu 24.04)
- ✅ Tailscale for private networking
- ✅ Coolify for container orchestration
- ✅ PostgreSQL 16 database
- ✅ Automated backups (daily at 2am)

### Applications
- ✅ BizDeedz Backend (Node.js/Express/TypeScript)
- ✅ BizDeedz Frontend (React/Vite/TypeScript)
- ✅ OpenClaw Runtime (automation engine)

### Security
- ✅ SSH locked to Tailscale IPs only
- ✅ OpenClaw not publicly accessible
- ✅ Non-root user for operations
- ✅ Service account RBAC for OpenClaw
- ✅ File system permissions locked down

### File System
- ✅ Deterministic paths in /srv/data
- ✅ Matter folder tracking in database
- ✅ Artifact file path registration
- ✅ Immutable storage (no overwrites)

---

## 📞 Support

### Coolify Dashboard
Access via Tailscale: `http://100.64.1.5:8000`

### Logs
```bash
# Backend logs
docker logs bizdeedz-backend -f

# Frontend logs
docker logs bizdeedz-frontend -f

# OpenClaw logs
docker logs openclaw -f
tail -f /srv/data/logs/openclaw/inbox-scan.jsonl

# PostgreSQL logs
docker logs bizdeedz-postgres -f
```

### Troubleshooting

**Backend won't start?**
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check logs: `docker logs bizdeedz-backend`

**Frontend can't reach backend?**
- Verify `VITE_API_BASE_URL` uses internal Docker network name
- Check backend health: `curl http://bizdeedz-backend:3001/api/health`

**OpenClaw can't auth?**
- Regenerate service account: `npm run create-service-account`
- Update `BIZDEEDZ_OS_SERVICE_KEY` in Coolify
- Redeploy OpenClaw

**Can't SSH via Tailscale?**
- Check Tailscale is running: `tailscale status`
- Verify firewall allows 100.64.0.0/10
- Try public IP temporarily to debug

---

## 🚀 Next Steps

1. **Custom Domain**: Point DNS to your server IP, add domain in Coolify for auto-SSL
2. **Email Notifications**: Configure SMTP in BizDeedz for alerts
3. **Monitoring**: Add Uptime Kuma or Prometheus
4. **CI/CD**: Connect GitHub webhooks to Coolify for auto-deploys
5. **Scaling**: Upgrade Hetzner instance or add load balancer

---

**Deployment Time**: ~45 minutes total
**Monthly Cost**: €12.90 (VPS) + €0 (Coolify) + €0 (Tailscale free tier) = **€12.90/month**

✅ **You now have a production-ready BizDeedz Platform OS deployment with private networking!**
