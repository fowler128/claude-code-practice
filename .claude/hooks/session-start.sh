#!/bin/bash
set -euo pipefail

# Only run in remote (web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Installing Python dependencies..."
pip install pytest flake8 --quiet

echo "Installing marketing skills from coreyhaines31/marketingskills..."
npx --yes skills add coreyhaines31/marketingskills --yes

echo "Session start setup complete."
