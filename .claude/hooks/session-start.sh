#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Clone the legal contract skill if not already present
SKILL_DIR="${HOME}/.claude/skills/contract-review"
if [ ! -d "$SKILL_DIR" ]; then
  echo "Cloning legal contract skill..."
  mkdir -p "${HOME}/.claude/skills"
  git clone https://github.com/evolsb/claude-legal-skill "$SKILL_DIR"
  echo "Legal contract skill installed at $SKILL_DIR"
else
  echo "Legal contract skill already installed at $SKILL_DIR"
fi
