# BizDeedz Signal Engine — System Overview

## What This System Does

The BizDeedz Signal Engine is a daily market intelligence pipeline that:

1. Collects signals from Reddit and RSS feeds every morning
2. Filters them using keyword matching and rule-based scoring (no AI)
3. Classifies surviving items using a cheap AI model
4. Stores only high-quality signals (score 4–5) in Google Sheets
5. Synthesizes a daily digest email using a premium AI model
6. Delivers the digest to both BizDeedz and Turea Simpson inboxes

## Architecture

```
[CRON 7:00 AM]
      |
      v
[SOURCES]
  Reddit (Apify) ──┐
  RSS Feeds ────────┤
                    v
              [MERGE + NORMALIZE]
                    |
                    v
              [DEDUPE CHECK]
              SHA256(title+url)
                    |
                    v
              [KEYWORD MATCH]
              BizDeedz keywords
              Turea keywords
              Pain phrases
                    |
                    v
              [RULE SCORE]
              Min score: 3
              Drop anything below
                    |
                    v
           [CHEAP CLASSIFIER]
           GPT-4o-mini
           Max 900 chars
           Returns: lane, score,
           signal_type, cluster,
           confidence, keep
                    |
                    v
           [SCORE GATE]
           Keep only score >= 4
                    |
                    v
           [GOOGLE SHEETS]
           High_Value_Signals

[CRON 7:20 AM]
      |
      v
[READ SHEETS]
Today's rows only
      |
      v
[PREMIUM DIGEST]
Claude Sonnet (one batch call)
      |
      v
[EMAIL]
tureasimpson@gmail.com
info@bizdeedz.com
```

## Token Efficiency Design

The system is designed to minimize AI costs:

| Stage | Action | AI Tokens Used |
|-------|--------|----------------|
| Collection | Pull from Reddit + RSS | 0 |
| Normalization | Strip HTML, trim | 0 |
| Deduplication | SHA256 hash check | 0 |
| Keyword match | String matching | 0 |
| Rule scoring | Math on keyword counts | 0 |
| **Classification** | Cheap model, 900 chars | **Low** |
| Digest synthesis | Premium model, 1 batch call | **Medium** |

Most items are dropped before any AI call. The expensive model is called exactly once per day.

## Two Brands, One System

**BizDeedz** signals focus on:
- Law firm operational pain
- Legal tech adoption barriers
- Intake and workflow breakdowns
- Bankruptcy operations
- Knowledge management gaps

**Turea Simpson** signals focus on:
- Leadership capacity and burnout
- Career elevation for legal ops professionals
- Women in leadership
- Change management
- Legal ops leadership content

Items can be classified as `BizDeedz`, `Turea`, `Both`, or `Ignore`.

## Files and Their Roles

| File | Purpose |
|------|---------|
| `config/keywords.json` | Keyword bank — edit to tune signal relevance |
| `config/rss-feeds.json` | RSS feed list — add/remove feeds here |
| `config/models.json` | Model routing — change models here |
| `config/scoring.json` | Rule score weights — tune sensitivity here |
| `config/sources.json` | Source settings — subreddits, active flags |
| `prompts/classify_signal.md` | Classifier prompt — edit to improve accuracy |
| `prompts/summarize_daily_digest.md` | Digest prompt — edit digest format here |
| `scripts/*.js` | Helper logic for n8n Code nodes |
| `n8n/*.workflow.json` | Import these into n8n |

## Daily Flow Summary

- 7:00 AM Central: Collector runs, stores high-value signals
- 7:20 AM Central: Digest runs, reads today's signals, emails digest
- Monday 8:00 AM Central: Weekly report (Phase 2, not active in V1)
