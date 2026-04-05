# Content Intelligence Repo

## Discovery v1

Discovery v1 adds an input-acquisition layer that collects public creator/video/post candidates across YouTube, TikTok, and LinkedIn-related search results, then normalizes them into `output/market_intelligence.csv`.

### Files
- `discovery/seed_queries.yaml`: lane-based seed queries and platform toggles.
- `configs/platform_rules.yaml`: platform discovery modes and actor env bindings.
- `discovery/apify_runner.py`: candidate collection runner with Apify + public fallback.
- `discovery/normalize_to_market_intelligence.py`: maps raw JSON to flat CSV.
- `discovery/review_candidates.py`: record quality checks and review summary.
- `data/raw_candidates.json`: persisted raw candidate payload.

### Environment
Copy `.env.example` to `.env` and set values as needed:

```bash
cp .env.example .env
```

Required/optional variables:
- `APIFY_TOKEN` (optional if using only fallback sources)
- `APIFY_ACTOR_YOUTUBE` (optional)
- `APIFY_ACTOR_TIKTOK` (optional)
- `APIFY_ACTOR_LINKEDIN` (optional)

### Install
```bash
python3 -m pip install -r requirements.txt
```

### Run discovery
Dry-run mode (no external calls):
```bash
python3 discovery/apify_runner.py --dry-run
```

Live mode (uses Apify actors if configured; otherwise public fallback sources):
```bash
python3 discovery/apify_runner.py
```

### Normalize to market intelligence CSV
```bash
python3 discovery/normalize_to_market_intelligence.py
```

Behavior:
- Preserves existing header order when `output/market_intelligence.csv` already exists.
- Appends `needs_review` and `confidence_score` if missing.
- Leaves unavailable fields blank.

### Review candidate quality
```bash
python3 discovery/review_candidates.py
```

Checks include:
- incomplete core metadata (`creator_name`, `platform`, `source_url`)
- missing transcript/summary
- missing opening hook
- missing CTA

The script prints a summary + sample flagged records for triage.
