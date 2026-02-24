#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

mkdir -p "${HOME}/.claude/skills"

# Clone the legal contract skill if not already present
SKILL_DIR="${HOME}/.claude/skills/contract-review"
if [ ! -d "$SKILL_DIR" ]; then
  echo "Cloning legal contract skill..."
  git clone https://github.com/evolsb/claude-legal-skill "$SKILL_DIR"
  echo "Legal contract skill installed at $SKILL_DIR"
else
  echo "Legal contract skill already installed at $SKILL_DIR"
fi

# Install BizDeedz Contract Agent skill from repo if not already present
BD_SKILL_DIR="${HOME}/.claude/skills/bizdeedz-contract-agent"
if [ ! -d "$BD_SKILL_DIR" ]; then
  echo "Installing BizDeedz Contract Agent skill..."
  cp -r "${CLAUDE_PROJECT_DIR}/.claude/skills/bizdeedz-contract-agent" "$BD_SKILL_DIR"
  echo "BizDeedz Contract Agent installed at $BD_SKILL_DIR"
else
  echo "BizDeedz Contract Agent already installed at $BD_SKILL_DIR"
fi

# Install BizDeedz Workflow Architect skill from repo if not already present
BW_SKILL_DIR="${HOME}/.claude/skills/bizdeedz-workflow"
if [ ! -d "$BW_SKILL_DIR" ]; then
  echo "Installing BizDeedz Workflow Architect skill..."
  cp -r "${CLAUDE_PROJECT_DIR}/.claude/skills/bizdeedz-workflow" "$BW_SKILL_DIR"
  echo "BizDeedz Workflow Architect installed at $BW_SKILL_DIR"
else
  echo "BizDeedz Workflow Architect already installed at $BW_SKILL_DIR"
fi

# Install BizDeedz AI Readiness Offer skill from repo if not already present
AR_OFFER_DIR="${HOME}/.claude/skills/bizdeedz-ai-readiness-offer"
if [ ! -d "$AR_OFFER_DIR" ]; then
  echo "Installing BizDeedz AI Readiness Offer skill..."
  cp -r "${CLAUDE_PROJECT_DIR}/.claude/skills/bizdeedz-ai-readiness-offer" "$AR_OFFER_DIR"
  echo "BizDeedz AI Readiness Offer installed at $AR_OFFER_DIR"
else
  echo "BizDeedz AI Readiness Offer already installed at $AR_OFFER_DIR"
fi

# Install BizDeedz AI Readiness Campaign skill from repo if not already present
AR_CAMPAIGN_DIR="${HOME}/.claude/skills/bizdeedz-ai-readiness-campaign"
if [ ! -d "$AR_CAMPAIGN_DIR" ]; then
  echo "Installing BizDeedz AI Readiness Campaign skill..."
  cp -r "${CLAUDE_PROJECT_DIR}/.claude/skills/bizdeedz-ai-readiness-campaign" "$AR_CAMPAIGN_DIR"
  echo "BizDeedz AI Readiness Campaign installed at $AR_CAMPAIGN_DIR"
else
  echo "BizDeedz AI Readiness Campaign already installed at $AR_CAMPAIGN_DIR"
fi

# Install BizDeedz LeadGen Agent Core skill from repo if not already present
LG_CORE_DIR="${HOME}/.claude/skills/bizdeedz-leadgen-agent-core"
if [ ! -d "$LG_CORE_DIR" ]; then
  echo "Installing BizDeedz LeadGen Agent Core skill..."
  cp -r "${CLAUDE_PROJECT_DIR}/.claude/skills/bizdeedz-leadgen-agent-core" "$LG_CORE_DIR"
  echo "BizDeedz LeadGen Agent Core installed at $LG_CORE_DIR"
else
  echo "BizDeedz LeadGen Agent Core already installed at $LG_CORE_DIR"
fi

# Install BizDeedz ClientConfig Nicole Ezer skill from repo if not already present
CC_NICOLE_DIR="${HOME}/.claude/skills/bizdeedz-clientconfig-nicole-ezer"
if [ ! -d "$CC_NICOLE_DIR" ]; then
  echo "Installing BizDeedz ClientConfig Nicole Ezer skill..."
  cp -r "${CLAUDE_PROJECT_DIR}/.claude/skills/bizdeedz-clientconfig-nicole-ezer" "$CC_NICOLE_DIR"
  echo "BizDeedz ClientConfig Nicole Ezer installed at $CC_NICOLE_DIR"
else
  echo "BizDeedz ClientConfig Nicole Ezer already installed at $CC_NICOLE_DIR"
fi
