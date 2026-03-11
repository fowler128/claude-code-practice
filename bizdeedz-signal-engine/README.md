# BizDeedz Signal Engine MVP

A daily market intelligence system for two brands: **BizDeedz** and **Turea Simpson**.

Every morning, this system collects signals from Reddit and RSS feeds, filters them, classifies them with a cheap AI model, stores the high-value ones, and delivers an executive digest email.

---

## What It Does

1. **Collects** — Pulls posts from 5 Reddit communities and 5 legal tech RSS feeds
2. **Filters** — Keyword matching + rule scoring removes noise before any AI call
3. **Classifies** — A cheap model (GPT-4o-mini) scores surviving items 1–5
4. **Stores** — Only score 4–5 items are saved to Google Sheets
5. **Digests** — One premium model call synthesizes the daily digest email
6. **Delivers** — Email sent to both tureasimpson@gmail.com and info@bizdeedz.com

---

## Architecture

```
7:00 AM Central
  Reddit (Apify) + RSS Feeds
        ↓
  Normalize + Dedupe + Keyword Match
        ↓
  Rule Score Gate (min 3)
        ↓
  Cheap Classifier (GPT-4o-mini, max 900 chars)
        ↓
  Score Gate (keep only 4–5)
        ↓
  Google Sheets — High_Value_Signals

7:20 AM Central
  Read today's signals from Sheets
        ↓
  Premium Digest (Claude Sonnet, one batch call)
        ↓
  Email → tureasimpson@gmail.com + info@bizdeedz.com
```

---

## MVP Scope

**Active in V1:**
- Reddit (5 subreddits: legaltech, lawyers, LawFirm, smallbusiness, Entrepreneur)
- RSS (5 feeds: Artificial Lawyer, LawSites, Legal Tech Trends, LawDroid, Legal Evolution)
- Daily collector + digest
- Google Sheets storage

**Scaffolded but not active:**
- Weekly report workflow
- Mid-tier enrichment
- LinkedIn, X, GitHub, Hacker News, YouTube sources

---

## Quick Start

1. **Clone/copy this project** to your working directory
2. **Copy `.env.example` to `.env`** and fill in your credentials
3. **Set up Google Sheets** — create `High_Value_Signals` sheet with correct headers
4. **Set up n8n credentials** — OpenAI, Anthropic, Google Sheets, Gmail
5. **Import n8n workflows** from `n8n/` directory
6. **Test manually** before activating schedules
7. **Activate** `daily_collector` and `daily_digest` workflows

Full instructions: `docs/setup-guide.md`

---

## Project Structure

```
bizdeedz-signal-engine/
├── .env.example              # Environment variable template
├── README.md                 # This file
├── CLAUDE.md                 # AI assistant guide for this project
├── config/
│   ├── keywords.json         # Keyword bank — edit to tune signal relevance
│   ├── rss-feeds.json        # RSS feed list — add/remove feeds here
│   ├── models.json           # Model routing — change models here
│   ├── scoring.json          # Rule score weights — tune sensitivity here
│   └── sources.json          # Source config — subreddits, active flags
├── prompts/
│   ├── classify_signal.md    # Cheap classifier prompt
│   ├── summarize_daily_digest.md   # Premium digest prompt
│   └── summarize_weekly_report.md  # Weekly report prompt (Phase 2)
├── scripts/
│   ├── normalizeContent.js   # HTML stripping, text normalization, ai_excerpt
│   ├── keywordMatcher.js     # Keyword matching and lane detection
│   ├── dedupeHash.js         # SHA256 deduplication hashing
│   ├── ruleScore.js          # Rule-based pre-filter scoring
│   └── formatDigest.js       # Digest batch input and email formatting
├── n8n/
│   ├── daily_collector.workflow.json   # Main collection pipeline
│   ├── daily_digest.workflow.json      # Digest synthesis + email
│   └── weekly_report.workflow.json     # Weekly report (scaffold, Phase 2)
└── docs/
    ├── system-overview.md     # Architecture and design
    ├── setup-guide.md         # Step-by-step setup instructions
    ├── google-sheets-schema.md  # Column definitions for Sheets
    ├── prompt-library.md      # Prompt documentation
    └── roadmap.md             # Phase plan
```

---

## Key Configuration Files

| File | What to edit here |
|------|-------------------|
| `config/keywords.json` | Add/remove keywords to tune signal relevance |
| `config/rss-feeds.json` | Add/remove RSS feeds |
| `config/models.json` | Switch AI models without touching workflows |
| `config/scoring.json` | Adjust rule score weights |
| `config/sources.json` | Enable/disable subreddits |

---

## Signal Quality Strategy

The system prioritizes **quality over volume**. Most items are dropped before any AI call.

**BizDeedz signals** focus on: law firm operational pain, legal tech adoption, intake/workflow breakdowns, bankruptcy operations, knowledge management gaps.

**Turea Simpson signals** focus on: leadership burnout, career elevation, women in leadership, change management, legal ops leadership thought leadership.

---

## Cost Profile

- Most items: dropped at keyword/rule filter (zero AI cost)
- Surviving items: cheap classifier, 900 char limit
- All high-value items: one batch digest call per day
- Expected daily cost: under $0.10 on typical signal volume

---

## Credentials Required

- OpenAI API key
- Anthropic API key
- Google Service Account (Sheets access)
- Apify API token
- Gmail account with App Password

See `docs/setup-guide.md` for full setup instructions.
