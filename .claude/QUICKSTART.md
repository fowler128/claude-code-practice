# Quick Start Guide

Get started with Claude Code skills in under 5 minutes!

## Step 1: Install Prerequisites

### Install agent-browser
```bash
npm install -g agent-browser
agent-browser install
```

### Verify Installation
```bash
agent-browser --version
```

## Step 2: Try Your First Browser Automation

### Example 1: Simple Screenshot
Tell Claude:
```
Use agent-browser to take a screenshot of google.com
```

Claude will:
1. Navigate to google.com
2. Capture a screenshot
3. Save it to a file

### Example 2: Extract Data
Tell Claude:
```
Scrape the top 5 headlines from news.ycombinator.com and save them to headlines.json
```

Claude will:
1. Use the agent-browser skill
2. Navigate to Hacker News
3. Extract headline data
4. Save to JSON file

## Step 3: Create Your First Workflow

### Example: Daily Report
Tell Claude:
```
Create a workflow that:
1. Fetches weather data from wttr.in
2. Saves it to a JSON file
3. Generates an HTML report
4. Can run daily via cron
```

Claude will:
1. Use the workflow-automation skill
2. Create a complete bash script
3. Include error handling and logging
4. Provide cron setup instructions

## Step 4: Combine Skills

### Example: Price Monitor
Tell Claude:
```
Build a workflow that monitors prices on example.com using agent-browser,
compares with previous data, and emails alerts if prices drop
```

Claude will:
1. Combine both skills
2. Create a complete monitoring system
3. Include scheduling setup
4. Add email notifications

## Common Use Cases

### Web Scraping
```
"Scrape product data from [website] and save to CSV"
```

### Automated Testing
```
"Test the login flow at [url] using credentials from .env"
```

### Report Generation
```
"Create a weekly report workflow that aggregates data from [sources]"
```

### Backup Automation
```
"Set up automated backups of [directories] to S3"
```

### Form Automation
```
"Fill out the contact form at [url] with test data"
```

### Price Monitoring
```
"Monitor competitor prices hourly and alert on changes"
```

## Tips for Success

### 1. Be Specific
❌ "Scrape some data"
✅ "Scrape product names and prices from example.com/products"

### 2. Describe the Complete Goal
❌ "Use agent-browser"
✅ "Use agent-browser to test our checkout flow and capture screenshots at each step"

### 3. Include Context
❌ "Create a workflow"
✅ "Create a workflow that runs daily to sync data between our API and database"

### 4. Request Error Handling
❌ "Scrape the website"
✅ "Scrape the website with retry logic and error notifications"

### 5. Specify Output Format
❌ "Get the data"
✅ "Get the data and save to JSON with timestamp"

## Next Steps

### Learn More
- Read full documentation: `.claude/README.md`
- Browse examples: `.claude/skills/*/examples/`
- Check skill docs: `.claude/skills/*/SKILL.md`

### Advanced Topics
- Session management with agent-browser
- Parallel workflow execution
- Cloud deployment with GitHub Actions
- Integration with external APIs

### Common Patterns
- **ETL Pipelines**: Extract → Transform → Load
- **Monitoring**: Check → Compare → Alert
- **Testing**: Navigate → Interact → Verify
- **Reporting**: Collect → Generate → Distribute

## Troubleshooting

### Issue: Skills not working
**Solution**: Make sure you're in the repository root where `.claude/` exists

### Issue: agent-browser not found
**Solution**: Install globally: `npm install -g agent-browser`

### Issue: Permission errors
**Solution**: Make scripts executable: `chmod +x script.sh`

### Issue: Workflow not running on schedule
**Solution**: Use absolute paths in cron: `/usr/bin/bash /full/path/script.sh`

## Example Session

```
You: "I need to monitor competitor prices daily"

Claude: "I'll help you create a price monitoring workflow using
the agent-browser and workflow-automation skills..."
[Creates complete workflow with browser scraping, data comparison,
alerts, and scheduling]

You: "Can you add email notifications?"

Claude: "I'll add email notifications to the workflow..."
[Updates workflow with mail command and alert logic]

You: "How do I schedule this to run daily?"

Claude: "Here's how to set up the cron job..."
[Provides cron setup instructions]
```

## Ready to Start?

Just tell Claude what you want to automate! The skills will be automatically activated when needed.

**Examples to try right now:**

1. "Take a screenshot of my favorite website"
2. "Scrape the top posts from reddit.com/r/programming"
3. "Create a backup workflow for my project files"
4. "Test our login page at localhost:3000"
5. "Monitor when products go on sale at example.com"

Happy automating! 🚀
