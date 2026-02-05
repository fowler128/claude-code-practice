# Claude Code Skills

This directory contains custom skills for Claude Code that enable browser automation and workflow orchestration.

## Available Skills

### 1. agent-browser
**Purpose**: Automate browser interactions using the agent-browser CLI tool

**Use Cases**:
- Web scraping and data extraction
- Automated testing of web applications
- Form filling and submission
- Screenshot capture
- Dynamic content interaction
- Authentication flow testing

**Example Usage**:
```bash
# In Claude Code, simply describe what you need:
"Scrape the top 10 headlines from Hacker News"
"Fill out the contact form at example.com"
"Take screenshots of our homepage at different viewport sizes"
```

**Documentation**: See `skills/agent-browser/SKILL.md`

### 2. workflow-automation
**Purpose**: Create and manage automated workflows combining multiple tasks

**Use Cases**:
- Data processing pipelines
- Scheduled report generation
- Backup and sync operations
- CI/CD workflows
- Multi-system integration
- Automated monitoring and alerting

**Example Usage**:
```bash
# In Claude Code:
"Create a workflow that generates a daily sales report"
"Set up automated backups to S3 every 6 hours"
"Build a pipeline that scrapes prices and updates our database"
```

**Documentation**: See `skills/workflow-automation/SKILL.md`

## Installation

### Prerequisites

1. **agent-browser** (for browser automation skill):
```bash
npm install -g agent-browser
agent-browser install
```

2. **Python 3** (for data processing in workflows):
```bash
python3 --version  # Should be 3.7+
```

3. **jq** (for JSON processing):
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

### Setting Up Skills

These skills are automatically discovered by Claude Code when you work with files in this repository. The skills are located in `.claude/skills/` and Claude Code will load them when needed.

## How Skills Work

### Skill Structure

Each skill is a directory containing:
- `SKILL.md` - Main skill definition with YAML frontmatter and instructions
- `examples/` - Example scripts demonstrating the skill
- `templates/` (optional) - Reusable templates

### YAML Frontmatter

Each `SKILL.md` starts with metadata:
```yaml
---
name: skill-name
description: When and how to use this skill
---
```

The description tells Claude when to activate the skill automatically.

### Skill Invocation

Skills are invoked automatically when your request matches the skill's description, or you can explicitly reference them:

```bash
# Automatic (Claude detects when to use the skill):
"Scrape product data from example.com"

# Explicit reference:
"Use the agent-browser skill to capture screenshots"
```

## Examples

### Example 1: Web Scraping
```bash
# Tell Claude:
"Use agent-browser to scrape the top 5 products from amazon.com/best-sellers
and save them to products.json"
```

### Example 2: Daily Report Workflow
```bash
# Tell Claude:
"Create a workflow that:
1. Fetches sales data from our API
2. Generates an HTML report
3. Emails it to the team
4. Runs every day at 9 AM"
```

### Example 3: Combined Browser + Workflow
```bash
# Tell Claude:
"Build a workflow that monitors competitor prices hourly using agent-browser,
compares them with our prices, and alerts us if any drop below $50"
```

See the `examples/` directory in each skill for complete working examples.

## Workflow Templates

### Cron Scheduling

Add to crontab (`crontab -e`):
```bash
# Daily at 2 AM
0 2 * * * /path/to/workflow.sh

# Every hour
0 * * * * /path/to/workflow.sh

# Weekdays at 9 AM
0 9 * * 1-5 /path/to/workflow.sh
```

### GitHub Actions

Create `.github/workflows/scheduled-workflow.yml`:
```yaml
name: Scheduled Workflow
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:      # Manual trigger

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install agent-browser
        run: |
          npm install -g agent-browser
          agent-browser install
      - name: Run workflow
        run: ./workflow.sh
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}
```

## Configuration

### Environment Variables

Create a `.env` file for your workflows:
```bash
# API Credentials
API_TOKEN=your_token_here
API_URL=https://api.example.com

# Database
DB_USER=username
DB_PASS=password
DB_HOST=localhost

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password

# Cloud Storage
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=my-backups
```

Load in scripts:
```bash
if [ -f .env ]; then
  source .env
fi
```

## Best Practices

### 1. Error Handling
Always include error handling in workflows:
```bash
set -e  # Exit on error
trap 'echo "Error on line $LINENO"' ERR
```

### 2. Logging
Log all workflow steps:
```bash
LOG_FILE="workflow-$(date +%Y%m%d).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1
```

### 3. Idempotency
Make workflows safe to re-run:
```bash
if [ -f "completed.flag" ]; then
  echo "Already completed"
  exit 0
fi
```

### 4. Retry Logic
Handle transient failures:
```bash
retry_with_backoff() {
  local max=5
  local delay=1
  local attempt=1

  while [ $attempt -le $max ]; do
    "$@" && return 0
    sleep $delay
    delay=$((delay * 2))
    attempt=$((attempt + 1))
  done
  return 1
}
```

### 5. Notifications
Alert on completion or failure:
```bash
# On success
echo "Success" | mail -s "Workflow Complete" admin@example.com

# On error
trap 'echo "Failed" | mail -s "Workflow Failed" admin@example.com' ERR
```

## Troubleshooting

### agent-browser Issues

**Problem**: `agent-browser: command not found`
```bash
# Solution: Install globally
npm install -g agent-browser
agent-browser install
```

**Problem**: Browser automation fails
```bash
# Solution: Check if Chromium is installed
agent-browser install --force

# Linux: Install system dependencies
sudo apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

### Workflow Issues

**Problem**: Permission denied
```bash
# Solution: Make scripts executable
chmod +x workflow.sh
```

**Problem**: Cron not running
```bash
# Solution: Check cron logs
grep CRON /var/log/syslog

# Use absolute paths in cron
/usr/bin/bash /full/path/to/workflow.sh
```

**Problem**: Environment variables not available
```bash
# Solution: Source .env in script
if [ -f "$(dirname "$0")/.env" ]; then
  source "$(dirname "$0")/.env"
fi
```

## Resources

### Documentation
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [agent-browser GitHub](https://github.com/vercel-labs/agent-browser)
- [Claude Code Templates](https://github.com/davila7/claude-code-templates)

### Example Projects
- See `skills/agent-browser/examples/` for browser automation examples
- See `skills/workflow-automation/examples/` for workflow examples

### Community
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Claude Code Showcase](https://github.com/ChrisWiles/claude-code-showcase)

## Contributing

To add new skills:

1. Create a new directory in `.claude/skills/your-skill-name/`
2. Add `SKILL.md` with YAML frontmatter and instructions
3. Add examples in `examples/` directory
4. Update this README

## License

These skills are provided as examples for use with Claude Code. Modify and adapt them for your needs.

---

**Need Help?**

- Ask Claude directly: "How do I use the agent-browser skill?"
- Check examples in each skill's directory
- Review the SKILL.md documentation

**Pro Tip**: Skills work best when you describe your goal clearly. Claude will automatically choose and apply the right skill!
