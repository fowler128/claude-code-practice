# Claude Code Skills Setup

This repository includes custom Claude Code skills for browser automation and workflow orchestration.

## 🎯 What's Included

### Custom Skills

1. **agent-browser** - Browser automation using Vercel's agent-browser CLI
2. **workflow-automation** - Orchestrate multi-step automated workflows

### Documentation

- **[Quick Start Guide](.claude/QUICKSTART.md)** - Get started in 5 minutes
- **[Full Documentation](.claude/README.md)** - Complete reference
- **[Skill Definitions](.claude/skills/)** - Individual skill documentation

### Examples

Each skill includes working examples:
- **Browser Automation**: Web scraping, form filling, testing
- **Workflows**: Reports, backups, monitoring, CI/CD pipelines

## 🚀 Quick Start

### 1. Install Prerequisites
```bash
npm install -g agent-browser
agent-browser install
```

### 2. Use the Skills

Just describe what you want to Claude:

```
"Scrape product data from example.com"
"Create a daily report workflow"
"Monitor competitor prices and alert on changes"
```

Claude will automatically use the appropriate skill!

## 📚 Learn More

- **Getting Started**: [QUICKSTART.md](.claude/QUICKSTART.md)
- **Full Documentation**: [README.md](.claude/README.md)
- **agent-browser Skill**: [.claude/skills/agent-browser/SKILL.md](.claude/skills/agent-browser/SKILL.md)
- **workflow-automation Skill**: [.claude/skills/workflow-automation/SKILL.md](.claude/skills/workflow-automation/SKILL.md)

## 🛠️ Skill Capabilities

### agent-browser
- Web scraping and data extraction
- Automated testing
- Form automation
- Screenshot capture
- Dynamic content interaction
- Session management

### workflow-automation
- Sequential and parallel task execution
- Error handling and retry logic
- Scheduled job execution
- Data pipeline orchestration
- Multi-system integration
- Automated notifications

## 💡 Example Use Cases

### Web Scraping
```
"Use agent-browser to scrape the top 10 products from amazon.com/best-sellers
and save the data to products.json with name, price, and rating"
```

### Daily Reports
```
"Create a workflow that generates a daily sales report by:
1. Fetching data from our API
2. Generating an HTML report
3. Emailing it to team@example.com
4. Running every day at 9 AM"
```

### Price Monitoring
```
"Build a workflow that monitors competitor prices every hour using agent-browser,
compares with our database, and sends alerts if prices drop below $50"
```

### Automated Backups
```
"Create a backup workflow that:
1. Backs up our database
2. Compresses important directories
3. Uploads to S3
4. Runs every 6 hours
5. Sends confirmation emails"
```

## 📖 Resources

### Official Documentation
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills)
- [agent-browser Repository](https://github.com/vercel-labs/agent-browser)
- [Claude Code Templates](https://github.com/davila7/claude-code-templates)

### Examples
- Browser automation examples: `.claude/skills/agent-browser/examples/`
- Workflow examples: `.claude/skills/workflow-automation/examples/`

## 🎓 How Skills Work

### Automatic Activation
Skills are automatically activated when your request matches their description. You don't need to explicitly invoke them.

### Manual Reference
You can also explicitly reference skills:
```
"Use the workflow-automation skill to create a backup script"
```

### Skill Discovery
Claude Code automatically discovers skills from:
- `.claude/skills/` (project-level)
- Nested `.claude/skills/` in subdirectories (monorepo support)

## 🔧 Configuration

### Environment Variables
Create `.env` for sensitive data:
```bash
API_TOKEN=your_token
DB_USER=username
DB_PASS=password
SMTP_HOST=smtp.gmail.com
AWS_ACCESS_KEY_ID=your_key
```

### Scheduling with Cron
```bash
# Edit crontab
crontab -e

# Add your workflow
0 2 * * * /path/to/workflow.sh
```

### GitHub Actions
Create `.github/workflows/scheduled.yml`:
```yaml
name: Scheduled Workflow
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: ./workflow.sh
```

## 🐛 Troubleshooting

### agent-browser not found
```bash
npm install -g agent-browser
agent-browser install
```

### Linux: Missing browser dependencies
```bash
sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1
```

### Permission errors
```bash
chmod +x workflow.sh
```

### Cron not working
Use absolute paths:
```bash
/usr/bin/bash /full/path/to/workflow.sh
```

## 🤝 Contributing

To add new skills:

1. Create `.claude/skills/your-skill-name/`
2. Add `SKILL.md` with YAML frontmatter
3. Include examples in `examples/`
4. Update documentation

## 📝 License

These skills are provided as examples for Claude Code. Feel free to modify and adapt them for your needs.

---

**Ready to automate?** Check out the [Quick Start Guide](.claude/QUICKSTART.md)!
