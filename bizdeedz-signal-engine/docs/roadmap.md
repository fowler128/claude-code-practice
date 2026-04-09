# BizDeedz Signal Engine — Roadmap

---

## Phase 1: Foundation (Current — MVP)

**Goal**: Get signals flowing, classified, stored, and delivered daily.

### Active
- Reddit collection (5 subreddits via Apify)
- RSS feeds (5 primary sources)
- Keyword + rule-based pre-filter
- Cheap model classification (GPT-4o-mini)
- Google Sheets storage (High_Value_Signals)
- Daily digest email (both recipients)
- Daily schedule (7:00 AM collector, 7:20 AM digest)

### Deliverable
Working daily intelligence system with zero manual effort after setup.

---

## Phase 2: Depth + Weekly Reports

**Goal**: Add enrichment for high-value signals and weekly strategic view.

### Additions
- **Mid-tier enricher activation**: Run Claude Haiku on score 4–5 items with confidence != `high` to add `summary`, `why_it_matters`, and `recommended_action` fields
- **Weekly report workflow**: Activate `weekly_report.workflow.json` (already scaffolded)
- **Raw_Signals sheet**: Log all items before filtering for debugging and future training
- **Daily_Digests archive**: Store each day's digest text in a separate sheet tab
- **Dedupe from Sheets**: Connect the Dedupe Check node to actually read existing hashes from Google Sheets (currently generates hashes but doesn't check against stored ones)

### Keyword tuning
After 2–3 weeks of V1 data, review:
- Which keywords are generating false positives
- Which subreddits are most valuable
- Whether `score` distribution needs calibration
- Update `config/keywords.json` accordingly

---

## Phase 3: Source Expansion

**Goal**: Widen the signal net to GitHub, Hacker News, and content platforms.

### Additions
- **GitHub trending**: Monitor legal tech repos for adoption signals
- **Hacker News**: Search for legal tech and operations discussions
- **Content Queue sheet**: Staging area for approved content ideas
- **YouTube transcripts**: Monitor legal ops and leadership channels (via Apify)
- Additional subreddits from scaffold list:
  - r/artificial
  - r/operations
  - r/paralegal
  - r/careerguidance

---

## Phase 4: LinkedIn + X + Advanced Analysis

**Goal**: Full signal coverage and trend analysis across all channels.

### Additions
- **LinkedIn signals**: Monitor legal ops job posts, thought leader content
- **X/Twitter**: Monitor legal tech conversations and trending topics
- **Vendor review sites**: G2, Capterra for legal tech sentiment
- **Job board monitoring**: Legal ops director roles as BD signals
- **Trend scoring**: Week-over-week comparison of cluster frequency
- **Competitive intelligence**: Track specific competitors or products

---

## Maintenance Calendar

### Weekly (starting Phase 1)
- Review High_Value_Signals sheet
- Mark items as `reviewed` or `actioned`
- Note any keywords generating noise

### Monthly
- Review keyword bank for gaps or noise (edit `config/keywords.json`)
- Review RSS feed performance (add/remove in `config/rss-feeds.json`)
- Check AI score distribution — if avg score is drifting, review classifier prompt

### Quarterly
- Evaluate model routing — newer, cheaper models may replace current classifier
- Review digest format for continued usefulness
- Assess subreddit performance, add/remove sources
- Update `config/models.json` if better models are available

---

## How to Prioritize

Before adding a new source or feature, ask:
1. Does it improve signal quality or reduce noise?
2. Is it worth the added complexity?
3. Can it be done with a config change vs. a workflow change?
4. Will it run reliably without maintenance?

Prefer config-level changes over workflow changes.
Prefer workflow additions over workflow modifications.
Keep the core pipeline simple.
