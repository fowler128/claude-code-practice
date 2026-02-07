#!/bin/bash

# BizDeedz Platform OS - MVP+ Setup Script
# This script sets up the complete development environment

set -e  # Exit on error

echo "🚀 BizDeedz Platform OS - MVP+ Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_NAME=${DB_NAME:-bizdeedz_platform}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "📋 Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
  echo -e "${RED}❌ PostgreSQL is not running on $DB_HOST:$DB_PORT${NC}"
  echo "Please start PostgreSQL and try again."
  exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Step 1: Create database (if it doesn't exist)
echo "📦 Step 1: Creating database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Step 2: Run migrations
echo "🔄 Step 2: Running database migrations..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/complete-migration.sql
echo -e "${GREEN}✓ Migrations complete${NC}"
echo ""

# Step 3: Load seed data
echo "🌱 Step 3: Loading seed data..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/seed-data.sql
echo -e "${GREEN}✓ Seed data loaded${NC}"
echo ""

# Step 4: Install backend dependencies
echo "📚 Step 4: Installing backend dependencies..."
cd backend
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 5: Create .env file if it doesn't exist
echo "⚙️  Step 5: Setting up environment..."
if [ ! -f .env ]; then
  cat > .env << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI Configuration (optional - add your key)
# OPENAI_API_KEY=your_key_here
EOF
  echo -e "${GREEN}✓ Created .env file${NC}"
else
  echo -e "${YELLOW}⚠ .env file already exists - skipping${NC}"
fi
echo ""

# Step 6: Load playbook templates
echo "📋 Step 6: Loading playbook templates..."
node scripts/loadTemplates.js
echo -e "${GREEN}✓ Templates loaded${NC}"
echo ""

cd ..

# All done!
echo ""
echo "======================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "======================================"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "  1. Start the server:"
echo "     cd backend && npm run dev"
echo ""
echo "  2. Test the endpoints:"
echo "     http://localhost:3000/health"
echo "     http://localhost:3000/api/reports/all"
echo ""
echo "  3. View the Smart Queue:"
echo "     http://localhost:3000/api/smart-queue?role=paralegal"
echo ""
echo "  4. Test OpenClaw import:"
echo "     POST http://localhost:3000/api/openclaw/import"
echo ""
echo "📚 Documentation:"
echo "  - API Docs: backend/README.md"
echo "  - Agent Layer: AGENTS.md"
echo "  - Governance: GOVERNANCE.md"
echo ""
echo "Happy coding! 🚀"
echo ""
