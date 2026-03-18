#!/bin/bash
# Install Google Workspace CLI (gws)
# Source: https://github.com/googleworkspace/cli
#
# Option 1: Install via cargo (from source)
cargo install --git https://github.com/googleworkspace/cli --locked

# Option 2: Install via npm (requires Node.js 18+)
# npm install -g @googleworkspace/cli

# Option 3: Install via Homebrew (macOS/Linux)
# brew install googleworkspace-cli

echo "gws installed: $(gws --version)"
