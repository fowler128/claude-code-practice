#!/bin/bash

# BizDeedz Platform OS - Sprint 1 Testing Script
# This script helps verify the Sprint 1 installation and basic functionality

set -e  # Exit on error

echo "🧪 BizDeedz Platform OS - Sprint 1 Test Suite"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test result
pass_test() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail_test() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn_test() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "📋 Checking Prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    pass_test "Node.js installed: $NODE_VERSION"
else
    fail_test "Node.js not found"
    echo "   Install from: https://nodejs.org/"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    pass_test "npm installed: $NPM_VERSION"
else
    fail_test "npm not found"
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    pass_test "PostgreSQL installed: $PSQL_VERSION"
else
    fail_test "PostgreSQL not found"
    echo "   Install from: https://www.postgresql.org/download/"
fi

# Check if PostgreSQL is running
if pg_isready &> /dev/null; then
    pass_test "PostgreSQL server is running"
else
    fail_test "PostgreSQL server is not running"
    echo "   Start with: brew services start postgresql (Mac)"
    echo "   or: sudo systemctl start postgresql (Linux)"
fi

echo ""
echo "📦 Checking Project Structure..."
echo ""

# Check if we're in the right directory
if [ -d "backend" ] && [ -d "frontend" ]; then
    pass_test "Project directories found"
else
    fail_test "Not in BizDeedz-Platform-OS directory"
    echo "   Run this script from: BizDeedz-Platform-OS/"
    exit 1
fi

# Check backend package.json
if [ -f "backend/package.json" ]; then
    pass_test "Backend package.json exists"
else
    fail_test "Backend package.json not found"
fi

# Check frontend package.json
if [ -f "frontend/package.json" ]; then
    pass_test "Frontend package.json exists"
else
    fail_test "Frontend package.json not found"
fi

# Check if node_modules exist
if [ -d "backend/node_modules" ]; then
    pass_test "Backend dependencies installed"
else
    warn_test "Backend dependencies not installed"
    echo "   Run: cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    pass_test "Frontend dependencies installed"
else
    warn_test "Frontend dependencies not installed"
    echo "   Run: cd frontend && npm install"
fi

echo ""
echo "🗄️  Checking Database..."
echo ""

# Check if database exists
DB_NAME="bizdeedz_platform_os"
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    pass_test "Database '$DB_NAME' exists"

    # Check if tables exist
    TABLE_COUNT=$(psql -U postgres -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
    if [ "$TABLE_COUNT" -gt 10 ]; then
        pass_test "Database tables created ($TABLE_COUNT tables)"
    else
        warn_test "Database tables may not be created"
        echo "   Run: cd backend && npm run db:migrate"
    fi

    # Check seed data
    USER_COUNT=$(psql -U postgres -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    if [ "$USER_COUNT" -gt 0 ]; then
        pass_test "Seed data loaded ($USER_COUNT users)"
    else
        warn_test "Seed data not loaded"
        echo "   Run: cd backend && npm run db:migrate"
    fi
else
    fail_test "Database '$DB_NAME' not found"
    echo "   Create with: createdb $DB_NAME"
    echo "   Then run: cd backend && npm run db:migrate"
fi

echo ""
echo "⚙️  Checking Configuration..."
echo ""

# Check backend .env
if [ -f "backend/.env" ]; then
    pass_test "Backend .env file exists"

    # Check if it's been configured (not just copied from example)
    if grep -q "your_postgres_password_here" backend/.env; then
        warn_test "Backend .env needs configuration"
        echo "   Edit backend/.env and set your PostgreSQL password"
    fi
else
    fail_test "Backend .env file not found"
    echo "   Copy: cp backend/.env.example backend/.env"
fi

echo ""
echo "🌐 Checking Servers..."
echo ""

# Check if backend is running
if curl -s http://localhost:3001/api/health &> /dev/null; then
    HEALTH_STATUS=$(curl -s http://localhost:3001/api/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH_STATUS" = "ok" ]; then
        pass_test "Backend server is running and healthy"
    else
        warn_test "Backend server responded but health check failed"
    fi
else
    warn_test "Backend server not running on port 3001"
    echo "   Start with: cd backend && npm run dev"
fi

# Check if frontend is running
if curl -s http://localhost:3000 &> /dev/null; then
    pass_test "Frontend server is running"
else
    warn_test "Frontend server not running on port 3000"
    echo "   Start with: cd frontend && npm run dev"
fi

echo ""
echo "🧪 API Tests (if backend is running)..."
echo ""

API_URL="http://localhost:3001/api"

if curl -s "$API_URL/health" &> /dev/null; then
    # Test login endpoint
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@bizdeedz.com","password":"admin123"}' 2>/dev/null)

    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        pass_test "Login endpoint works"

        # Extract token
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

        # Test authenticated endpoint
        MATTERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/matters" 2>/dev/null)
        if echo "$MATTERS_RESPONSE" | grep -q "matters"; then
            pass_test "Authenticated endpoint works"
        else
            fail_test "Authenticated endpoint failed"
        fi

        # Test practice areas
        PA_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/practice-areas" 2>/dev/null)
        PA_COUNT=$(echo "$PA_RESPONSE" | grep -o "practice_area_id" | wc -l | tr -d ' ')
        if [ "$PA_COUNT" = "4" ]; then
            pass_test "Practice areas endpoint works (4 areas found)"
        else
            fail_test "Practice areas endpoint failed (expected 4, found $PA_COUNT)"
        fi

    else
        fail_test "Login endpoint failed"
        echo "   Response: $LOGIN_RESPONSE"
    fi
else
    warn_test "Skipping API tests (backend not running)"
fi

echo ""
echo "=============================================="
echo "📊 Test Results"
echo "=============================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Sprint 1 is ready for use.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. If servers aren't running:"
    echo "     Terminal 1: cd backend && npm run dev"
    echo "     Terminal 2: cd frontend && npm run dev"
    echo "  2. Open http://localhost:3000"
    echo "  3. Login with: admin@bizdeedz.com / admin123"
    echo ""
else
    echo -e "${RED}⚠ Some tests failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Install dependencies: npm install (in backend and frontend)"
    echo "  - Create database: createdb bizdeedz_platform_os"
    echo "  - Run migrations: cd backend && npm run db:migrate"
    echo "  - Configure .env: edit backend/.env with your PostgreSQL password"
    echo ""
fi

exit $FAILED
