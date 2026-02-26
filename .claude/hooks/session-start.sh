#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Installing Python development tools..."

# Install flake8 (linter) and pytest (testing) if not already present
pip install --quiet --user flake8 pytest

echo "Python tools installed successfully."

# Set PYTHONPATH to include repo root
echo 'export PYTHONPATH="${CLAUDE_PROJECT_DIR:-.}:${PYTHONPATH:-}"' >> "${CLAUDE_ENV_FILE:-/dev/null}"

echo "Session start hook complete."
