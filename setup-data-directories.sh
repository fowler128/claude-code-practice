#!/bin/bash
# Setup data directory structure for BizDeedz Platform OS ↔ OpenClaw integration

set -e

echo "Setting up canonical data directory structure..."

# Create base directories
sudo mkdir -p /srv/bizdeedz
sudo mkdir -p /srv/openclaw
sudo mkdir -p /srv/data/{inbox,clients,knowledge_base,logs,backups}

# Create inbox subdirectories
sudo mkdir -p /srv/data/inbox/processed

# Create logs subdirectories
sudo mkdir -p /srv/data/logs/{openclaw,bizdeedz,integration}

# Create backups subdirectories
sudo mkdir -p /srv/data/backups/{database,files}

# Set permissions (adjust as needed for your user)
sudo chown -R $USER:$USER /srv/data
sudo chmod -R 755 /srv/data

# Create example client/matter structure
sudo mkdir -p /srv/data/clients/example-client/matters/example-matter-001/{artifacts,work_product,exports}
sudo chown -R $USER:$USER /srv/data/clients

echo "Directory structure created successfully!"
echo ""
echo "Structure:"
echo "/srv/"
echo "├── bizdeedz/          # BizDeedz Platform OS (link to existing repo)"
echo "├── openclaw/          # OpenClaw runtime"
echo "└── data/"
echo "    ├── inbox/         # Raw unfiled documents"
echo "    │   └── processed/ # Processed files by date"
echo "    ├── clients/       # Canonical client/matter folders"
echo "    │   └── {client_key}/matters/{matter_key}/"
echo "    │       ├── artifacts/"
echo "    │       ├── work_product/"
echo "    │       └── exports/"
echo "    ├── knowledge_base/ # Optional RAG store"
echo "    ├── logs/"         # System logs"
echo "    │   ├── openclaw/"
echo "    │   ├── bizdeedz/"
echo "    │   └── integration/"
echo "    └── backups/"      # Backups"
echo "        ├── database/"
echo "        └── files/"
echo ""
echo "Next steps:"
echo "1. Link BizDeedz Platform OS: ln -s /home/user/claude-code-practice/BizDeedz-Platform-OS /srv/bizdeedz"
echo "2. Link OpenClaw: ln -s /home/user/claude-code-practice/OpenClaw /srv/openclaw"
echo "3. Run database migrations"
echo "4. Configure service accounts"
