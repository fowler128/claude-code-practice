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
