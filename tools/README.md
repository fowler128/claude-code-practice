# Productivity Tools Suite

This directory contains the "starter pack" - a curated set of tools for BizDeedz revenue generation, job search, and personal financial management.

## Quick Setup

```bash
cd tools
chmod +x setup.sh
./setup.sh
```

This will clone and install all repositories automatically.

## Quick Reference

| Tool | Purpose | Lane |
|------|---------|------|
| **anthropics-skills** | Agent skills for Claude | All |
| **openskills** | Universal skills loader for AI agents | All |
| **stagehand** | AI browser automation (web ops, lead research) | BizDeedz |
| **langgraph** | Multi-step delivery systems, routing | BizDeedz |
| **crewAI** | Multi-agent orchestration | BizDeedz |
| **JobSpy** | Job pipeline scraping | Job Search |
| **resume-cli** | JSON Resume variants | Job Search |
| **actual** | Personal finance/budgeting | Personal |
| **clawdbot** | Personal AI assistant (WhatsApp, Telegram, Discord, iMessage) | All |

---

## 1. Anthropics Skills + OpenSkills

### anthropics-skills
Official Anthropic repository for Claude agent skills.

```bash
cd anthropics-skills
# Skills are folders with SKILL.md files - load them in Claude Code
```

**Use for:** Standardizing how Claude handles tasks (documents, PDFs, branding)

### openskills
Universal skills loader for AI coding agents (Claude Code, Cursor, Codex).

```bash
cd openskills
npm install -g .  # Install globally
openskills install <skill-name>
```

**Use for:** Loading Anthropic's skills into any AI coding agent

---

## 2. Stagehand (Web Automation)

AI-powered browser automation framework by Browserbase.

```bash
cd stagehand
npm install
```

**Use for:**
- Lead research automation
- Web scraping for prospect data
- Application flow automation
- Competitive analysis

**Example:**
```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand();
await stagehand.init();
await stagehand.page.goto("https://linkedin.com/company/target");
const data = await stagehand.extract({
  instruction: "Extract company size, industry, and recent posts",
  schema: z.object({
    companySize: z.string(),
    industry: z.string(),
    recentPosts: z.array(z.string())
  })
});
```

---

## 3. LangGraph & CrewAI (Multi-Agent Systems)

### langgraph
Build stateful, multi-step agent workflows with durable execution.

```bash
cd langgraph
pip install -e libs/langgraph
```

**Use for:**
- Complex BizDeedz delivery workflows
- Multi-step automation pipelines
- State management across long-running tasks

### crewAI
Framework for orchestrating role-playing autonomous AI agents.

```bash
cd crewAI
pip install -e .
```

**Use for:**
- Creating agent teams (researcher, writer, reviewer)
- Automated content generation
- Complex task delegation

**Example Crew:**
```python
from crewai import Agent, Task, Crew

researcher = Agent(
    role="Market Researcher",
    goal="Research bankruptcy law firms in target market",
    backstory="Expert at finding business intelligence"
)

writer = Agent(
    role="Outreach Writer",
    goal="Write personalized outreach messages",
    backstory="Expert copywriter for B2B services"
)

crew = Crew(agents=[researcher, writer], tasks=[...])
result = crew.kickoff()
```

---

## 4. JobSpy + JSON Resume (Job Search Pipeline)

### JobSpy
Scrape job postings from LinkedIn, Indeed, Glassdoor, ZipRecruiter, Google.

```bash
cd JobSpy
pip install -e .
```

**Use for:**
- Building job application pipeline
- Finding VP/Director Operations roles in healthcare tech
- Tracking new postings automatically

**Example:**
```python
from jobspy import scrape_jobs

jobs = scrape_jobs(
    site_name=["linkedin", "indeed", "glassdoor"],
    search_term="VP Operations Healthcare",
    location="Remote",
    results_wanted=50,
    hours_old=24,  # Only jobs posted in last 24 hours
    country_indeed='USA'
)

jobs.to_csv("healthcare_ops_jobs.csv")
```

### resume-cli
Generate resume variants from JSON schema.

```bash
cd resume-cli
npm install
npx resume init  # Create resume.json
npx resume export resume.html --theme actual
npx resume export resume.pdf --theme actual
```

**Use for:**
- Maintaining single source of truth for resume
- Generating variants for different roles
- ATS-optimized formatting

---

## 5. Actual Budget (Personal Finance)

Local-first personal finance application.

```bash
cd actual
npm install
npm run build
npm start
```

**Use for:**
- Tracking emergency fund runway
- Budget monitoring
- Financial clarity during job transition

**Note:** Requires Node.js v22+. Access via browser at localhost:5006.

---

## 6. Clawdbot (Personal AI Assistant)

Open-source personal AI assistant that bridges messaging platforms to AI agents.

```bash
cd clawdbot
npm install  # or pnpm install
npx clawdbot onboard --install-daemon
```

**Supported Platforms:**
- WhatsApp (via Baileys)
- Telegram (Bot API / grammY)
- Discord (Bot API)
- iMessage (imsg CLI)
- Mattermost (via plugin)

**Use for:**
- Personal AI assistant across all your messaging apps
- Automating responses and workflows via chat
- Bridging AI capabilities to mobile/messaging

**Example:**
```bash
# Install globally
npm install -g clawdbot@latest

# Run onboarding
clawdbot onboard --install-daemon

# Or build from source
git clone https://github.com/clawdbot/clawdbot.git
cd clawdbot
pnpm install
pnpm ui:build
pnpm build
```

**Note:** Requires Node.js v22+.

---

## Implementation Sequence

### If Prioritizing BizDeedz Revenue:
1. **openskills** - Standardize Claude workflows
2. **stagehand** - Automate lead research
3. **crewAI** - Build content generation crews
4. **langgraph** - Complex delivery automation

### If Prioritizing Job Search:
1. **JobSpy** - Set up daily job scraping
2. **resume-cli** - Create resume variants
3. **stagehand** - Automate application tracking research

### If Prioritizing Personal Stability:
1. **actual** - Get budget visibility
2. **JobSpy** - Systematic job pipeline
3. Then BizDeedz tools for revenue

---

## Environment Variables

Create a `.env` file in the project root:

```bash
# AI Providers
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key

# Stagehand (optional - for cloud execution)
BROWSERBASE_API_KEY=your_key
BROWSERBASE_PROJECT_ID=your_id

# JobSpy (optional - for proxy rotation)
PROXY_URL=your_proxy
```

---

## Troubleshooting

### Stagehand build fails
The build requires pnpm. Install with: `npm install -g pnpm && pnpm install`

### resume-cli Puppeteer error
Skip Chromium download: `PUPPETEER_SKIP_DOWNLOAD=1 npm install`
Use system Chrome for PDF export instead.

### JobSpy rate limiting
Use proxies and add delays between scrapes. Indeed is most permissive.

---

## Next Steps

1. **Test JobSpy** - Run first job scrape for target roles
2. **Setup Actual** - Import bank data for runway visibility
3. **Configure OpenSkills** - Load document skills for BizDeedz proposals
4. **Build First Crew** - Create lead research agent with CrewAI
