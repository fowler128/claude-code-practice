# Google Sheets Schema

## Sheet: High_Value_Signals

This is the primary system of record. Every signal that passes rule scoring AND receives an AI score of 4 or 5 is stored here.

---

### Column Reference

| Column | Field Name | Type | Description |
|--------|-----------|------|-------------|
| A | `captured_at` | ISO datetime | When the signal was collected and processed (UTC) |
| B | `source` | string | Source name — subreddit name (e.g. `legaltech`) or feed name (e.g. `Artificial Lawyer`) |
| C | `source_type` | string | `reddit` or `rss` |
| D | `title` | string | Cleaned title of the post or article |
| E | `url` | string | Direct link to the original content |
| F | `author` | string | Reddit username or article author name |
| G | `published_at` | string | Original publication or post date |
| H | `matched_keywords` | string | Comma-separated list of keywords that matched this signal |
| I | `lane` | string | `BizDeedz`, `Turea`, `Both`, or `Ignore` |
| J | `signal_type` | string | Classification type: `buyer pain`, `adoption barrier`, `workflow gap`, `market trend`, `content idea`, `speaking angle`, `competitor move`, `career signal`, or `ignore` |
| K | `keyword_cluster` | string | Comma-separated cluster names: `knowledge_management`, `adoption`, `intake_handoff`, `bankruptcy_operations`, `law_firm_operations`, `leadership_capacity`, `legal_ops_leadership`, `career_elevation`, `women_in_leadership`, `change_management` |
| L | `score` | integer | AI quality score: 4 or 5 (only these values are stored) |
| M | `confidence` | string | AI confidence in classification: `high`, `medium`, or `low` |
| N | `summary` | string | Brief summary (populated by mid-tier enricher in Phase 2; empty in V1) |
| O | `why_it_matters` | string | Enrichment field (Phase 2): why this signal matters for BizDeedz/Turea |
| P | `recommended_action` | string | `lead radar`, `content radar`, `product radar`, `speaking watch`, `competitor watch`, `career watch`, or `ignore` |
| Q | `status` | string | Processing status: `new` (just collected), `reviewed`, `actioned`, `archived` |
| R | `notes` | string | Free-text notes added manually after review |
| S | `dedupe_hash` | string | SHA256(title + url) — used to prevent duplicate storage |

---

### Notes on Key Fields

**`lane`**
The primary routing field. Use this to filter signals in Google Sheets:
- Filter to `BizDeedz` for consulting and product signals
- Filter to `Turea` for thought leadership and content signals
- Filter to `Both` for crossover opportunities

**`score`**
Only 4 and 5 are stored. The classifier may assign 1–3 but those are dropped before storage.
- `4` = Strong signal — clear relevance, potential action point
- `5` = High-value — directly actionable or highly specific to brand needs

**`signal_type`**
The type of market intelligence signal:
- `buyer pain` — someone describing a problem BizDeedz could solve
- `adoption barrier` — resistance to legal tech or process change
- `workflow gap` — broken process, intake failure, or operational gap
- `market trend` — broader trend or shift in legal ops or leadership
- `content idea` — strong topic for a post or piece of content
- `speaking angle` — potential speaking topic or authority signal
- `competitor move` — activity from a competing service or tool
- `career signal` — career-related signal relevant to Turea's audience

**`status`**
Use this field to manage your review workflow:
- `new` — auto-set on creation, not yet reviewed
- `reviewed` — you have read and assessed it
- `actioned` — you took an action (wrote content, added to lead radar, etc.)
- `archived` — no longer relevant

**`dedupe_hash`**
SHA256 of normalized title + URL. Used by the collector to skip previously seen content. Do not edit this field manually.

---

## Optional Future Sheets (Scaffold Only)

These sheets are not active in V1 but are planned for later phases:

| Sheet | Purpose | Phase |
|-------|---------|-------|
| `Raw_Signals` | All collected items before filtering (for debugging) | Phase 2 |
| `Daily_Digests` | Archive of each day's digest output | Phase 2 |
| `Weekly_Reports` | Archive of weekly report outputs | Phase 2 |
| `Content_Queue` | Approved content ideas waiting to be created | Phase 3 |

---

## Setting Up the Sheet Headers

Paste this into row 1 of the `High_Value_Signals` tab:

```
captured_at	source	source_type	title	url	author	published_at	matched_keywords	lane	signal_type	keyword_cluster	score	confidence	summary	why_it_matters	recommended_action	status	notes	dedupe_hash
```

Freeze row 1 and consider applying conditional formatting:
- Score 5 rows: light green background
- Score 4 rows: light yellow background
- Lane = BizDeedz: blue text
- Lane = Turea: purple text
