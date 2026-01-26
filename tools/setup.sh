#!/bin/bash

# =============================================================================
# Productivity Tools Setup Script
# =============================================================================
# Clones and installs the "starter pack" tools for:
# - BizDeedz revenue generation
# - Job search pipeline
# - Personal financial management
# =============================================================================

set -e  # Exit on error

TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$TOOLS_DIR"

echo "=============================================="
echo "Setting up Productivity Tools Suite"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✓ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }

# -----------------------------------------------------------------------------
# 1. Anthropics Skills + OpenSkills
# -----------------------------------------------------------------------------
echo ""
echo ">>> Installing anthropics/skills..."
if [ ! -d "anthropics-skills" ]; then
    git clone https://github.com/anthropics/skills.git anthropics-skills
    success "anthropics-skills cloned"
else
    warning "anthropics-skills already exists, skipping"
fi

echo ""
echo ">>> Installing openskills..."
if [ ! -d "openskills" ]; then
    git clone https://github.com/numman-ali/openskills.git
    cd openskills && npm install && cd ..
    success "openskills installed"
else
    warning "openskills already exists, skipping"
fi

# -----------------------------------------------------------------------------
# 2. Stagehand (Browser Automation)
# -----------------------------------------------------------------------------
echo ""
echo ">>> Installing Stagehand..."
if [ ! -d "stagehand" ]; then
    git clone https://github.com/browserbase/stagehand.git
    cd stagehand
    npm install 2>/dev/null || warning "Stagehand npm install had issues (may need pnpm)"
    cd ..
    success "stagehand cloned"
else
    warning "stagehand already exists, skipping"
fi

# -----------------------------------------------------------------------------
# 3. LangGraph (Multi-step Workflows)
# -----------------------------------------------------------------------------
echo ""
echo ">>> Installing LangGraph..."
if [ ! -d "langgraph" ]; then
    git clone https://github.com/langchain-ai/langgraph.git
    cd langgraph && pip install -e libs/langgraph && cd ..
    success "langgraph installed"
else
    warning "langgraph already exists, skipping"
fi

# -----------------------------------------------------------------------------
# 4. CrewAI (Multi-Agent Systems)
# -----------------------------------------------------------------------------
echo ""
echo ">>> Installing CrewAI..."
if [ ! -d "crewAI" ]; then
    git clone https://github.com/crewAIInc/crewAI.git
    cd crewAI && pip install -e . && cd ..
    success "crewAI installed"
else
    warning "crewAI already exists, skipping"
fi

# -----------------------------------------------------------------------------
# 5. JobSpy (Job Scraping)
# -----------------------------------------------------------------------------
echo ""
echo ">>> Installing JobSpy..."
if [ ! -d "JobSpy" ]; then
    git clone https://github.com/speedyapply/JobSpy.git
    cd JobSpy && pip install -e . && cd ..
    success "JobSpy installed"
else
    warning "JobSpy already exists, skipping"
fi

# -----------------------------------------------------------------------------
# 6. JSON Resume CLI
# -----------------------------------------------------------------------------
echo ""
echo ">>> Installing resume-cli..."
if [ ! -d "resume-cli" ]; then
    git clone https://github.com/jsonresume/resume-cli.git
    cd resume-cli
    PUPPETEER_SKIP_DOWNLOAD=1 npm install 2>/dev/null || warning "resume-cli install had issues"
    cd ..
    success "resume-cli cloned"
else
    warning "resume-cli already exists, skipping"
fi

# -----------------------------------------------------------------------------
# 7. Actual Budget
# -----------------------------------------------------------------------------
echo ""
echo ">>> Installing Actual Budget..."
if [ ! -d "actual" ]; then
    git clone https://github.com/actualbudget/actual.git
    success "actual cloned (run 'cd actual && npm install && npm run build' to complete setup)"
else
    warning "actual already exists, skipping"
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "Setup Complete!"
echo "=============================================="
echo ""
echo "Installed tools:"
echo "  - anthropics-skills  : Claude agent skills"
echo "  - openskills         : Universal skills loader"
echo "  - stagehand          : AI browser automation"
echo "  - langgraph          : Multi-step workflows"
echo "  - crewAI             : Multi-agent orchestration"
echo "  - JobSpy             : Job scraping pipeline"
echo "  - resume-cli         : JSON Resume generator"
echo "  - actual             : Personal budgeting"
echo ""
echo "Next steps:"
echo "  1. Test JobSpy:    cd JobSpy && python -c \"from jobspy import scrape_jobs; print('OK')\""
echo "  2. Test LangGraph: python -c \"import langgraph; print('OK')\""
echo "  3. Test CrewAI:    python -c \"from crewai import Agent; print('OK')\""
echo ""
