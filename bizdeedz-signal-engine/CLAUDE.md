# CLAUDE.md — BizDeedz Signal Engine

AI assistant guide for working with this project.

---

## Project Purpose

This is a daily market intelligence system for two brands:

- **BizDeedz**: legal operations and workflow automation consultancy serving law firms, especially small firms and bankruptcy operations
- **Turea Simpson**: personal brand focused on legal ops leadership, operational clarity, leadership capacity, change management, and career elevation

The system collects signals from Reddit and RSS feeds, filters by keyword relevance, classifies with a cheap AI model, stores high-value items in Google Sheets, and sends a daily digest email.

---

## Design Constraints

1. **Simplicity first**: This system should be maintainable by someone who isn't a developer
2. **Low token cost**: Rule-based filtering runs before any AI call; premium model runs once per day
3. **Config-driven**: All tunable parameters live in `config/` — not hardcoded in workflows
4. **V1 scope**: Only Reddit and RSS sources are active; do not activate other sources without deliberate decision
5. **Two-gate quality control**: Rule score threshold (3) + AI score threshold (4) before storage

---

## How to Update Keywords

Edit `config/keywords.json`.

- Add keywords to existing clusters under `bizdeedz` or `turea`
- Add a new cluster by creating a new key under the brand
- Add pain phrases to the `pain_phrases` array
- All keyword matching is case-insensitive at runtime

After editing keywords, test by manually running the Daily Collector and reviewing what passes the keyword gate.

---

## How to Add RSS Feeds

Edit `config/rss-feeds.json`.

- Add a new entry to the `feeds` array with `"active": true`
- Set `"active": false` to disable without deleting
- Also update the `RSS_FEED_URLS` environment variable (comma-separated URLs) in your n8n instance

---

## How to Change AI Models

Edit `config/models.json`.

- Change `"model"` values to use different models
- Change `"provider"` if switching between OpenAI and Anthropic
- Do not change the key names (`cheap_classifier`, `mid_enricher`, `premium_digest`) as the workflows reference them
- The `mid_enricher` is scaffold-only; changing its config has no effect in V1

Model naming reference:
- OpenAI cheap: `gpt-4o-mini`
- Anthropic cheap: `claude-haiku-4-5-20251001`
- OpenAI premium: `gpt-4o` or `o1`
- Anthropic premium: `claude-sonnet-4-6` or `claude-opus-4-6`

---

## How to Update Prompts

Edit the `.md` files in `prompts/`.

**Classifier prompt** (`prompts/classify_signal.md`):
- Controls how the cheap model labels signals
- Must return strict JSON — do not remove the JSON format instruction
- If the classifier is returning wrong `lane` or `signal_type`, add clarifying examples
- Test changes with a manual workflow run before activating

**Digest prompt** (`prompts/summarize_daily_digest.md`):
- Controls the daily digest structure
- Changing section headers changes what appears in the email
- More specific brand descriptions → better signal routing in the output
- If sections are too long: add max-sentence rules

---

## How to Add a New Source

**Adding a subreddit (V1 approved)**:
1. Add entry to `config/sources.json` under `subreddits.active`
2. Increase `max_posts` in that config to compensate for volume
3. If the subreddit is in `scaffold_only`, move it to `active`
4. No workflow changes needed

**Adding a new source type (Phase 3+)**:
1. Create a new source node in the collector workflow
2. Add normalization code to map output to standard signal schema
3. Connect to the Merge node
4. Update `config/sources.json` with the new source config
5. Do not activate sources that aren't in the approved list for the current phase

---

## How to Extend the Workflows

**Modifying collector pipeline order**:
- The flow must always be: Collect → Normalize → Dedupe → Keyword → RuleScore → IF → AI → IF → Store
- Do not move the rule score gate after the AI call
- Do not move the AI call before deduplication

**Adding a new output destination**:
- Add nodes after the `Google Sheets — Append` node
- Do not add destinations before the quality gates

**Adding enrichment (Phase 2)**:
- Activate the mid-tier enricher by adding a Code node after `Parse Classification`
- Only run it on `score >= 4 AND confidence != 'high'` items
- Cap input at 1400 chars (set in `config/models.json` under `routing.enricher_excerpt_limit`)

---

## What NOT to Change Without Careful Review

- The SHA256 dedupe logic — changing it will cause previously-seen items to be re-processed
- The scoring thresholds below their current values — this increases AI cost significantly
- The `lane` taxonomy — changing allowed values breaks downstream filtering
- The Google Sheets column order — this breaks the append mapping

---

## Maintain Simplicity

When extending this system, ask:
1. Can this be done with a config change instead of a workflow change?
2. Does this add AI cost, and is it worth it?
3. Does this add a new external dependency that could break the daily run?
4. Can a non-developer maintain this after you're done?

If the answer to #4 is no, simplify the approach.
