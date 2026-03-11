# Prompt Library

Documentation for all prompts used in the BizDeedz Signal Engine.

---

## Prompt 1: Signal Classifier

**File**: `prompts/classify_signal.md`
**Model tier**: Cheap classifier (GPT-4o-mini)
**Called by**: Daily Collector workflow
**Called per**: Each item that passes rule scoring
**Max input**: 900 characters (ai_excerpt)
**Max output**: 256 tokens

### Purpose

Classify each signal into the correct lane, score its relevance, and determine whether to keep it.

### Variables Injected

| Variable | Source | Description |
|----------|--------|-------------|
| `{{ai_excerpt}}` | `normalizeContent.js` | Title + first 800 chars of cleaned body |
| `{{matched_keywords}}` | `keywordMatcher.js` | Keywords already matched by rule filter |
| `{{source}}` | Raw signal | Subreddit name or feed name |
| `{{source_type}}` | Raw signal | `reddit` or `rss` |
| `{{rule_score}}` | `ruleScore.js` | Pre-filter score (>= 3 to reach this step) |

### Output Schema

```json
{
  "lane": "BizDeedz | Turea | Both | Ignore",
  "score": 1-5,
  "signal_type": "buyer pain | adoption barrier | workflow gap | market trend | content idea | speaking angle | competitor move | career signal | ignore",
  "keyword_cluster": ["cluster_name"],
  "confidence": "high | medium | low",
  "keep": true | false
}
```

### Tuning Notes

- If too many items are being kept: increase the system message strictness or add negative examples
- If too few items: check keyword bank first (add more keywords before adjusting prompt)
- If `lane` is wrong: add a clarifying sentence in the `lane` definitions
- The prompt enforces strict JSON — if the model returns markdown wrappers, the parse step handles extraction

---

## Prompt 2: Daily Digest Synthesizer

**File**: `prompts/summarize_daily_digest.md`
**Model tier**: Premium (Claude Sonnet)
**Called by**: Daily Digest workflow
**Called per**: Once per day (batch call)
**Max input**: All today's high-value signals (titles + metadata)
**Max output**: 2048 tokens

### Purpose

Synthesize all high-value signals into an actionable executive digest covering both brands.

### Variables Injected

| Variable | Source | Description |
|----------|--------|-------------|
| `{{digest_input}}` | `formatDigest.js buildDigestInput()` | Compact numbered signal list |

The digest input format per signal:
```
[N] LANE: BizDeedz | SOURCE: legaltech | TYPE: buyer pain | CLUSTER: intake_handoff
TITLE: Law firm intake chaos — nobody knows who owns what
URL: https://reddit.com/r/legaltech/...
KEYWORDS: law firm intake process, workflow inconsistency
```

### Output Structure

1. Top 5 BizDeedz Signals
2. Top 5 Turea Simpson Signals
3. 3 Recurring Patterns Today
4. 3 Content Ideas
5. 2 Lead or Opportunity Signals
6. Recommended Post Angle for Today

### Tuning Notes

- If sections are too verbose: add "Maximum 2 sentences per item" to the rules
- If signals are misrouted to wrong brand: strengthen the brand descriptions at the top of the prompt
- If content ideas are generic: add "Be specific — name the exact pain point or audience"
- Changing `temperature` higher (0.6–0.7) produces more creative content ideas but less consistent structure

---

## Prompt 3: Weekly Report Synthesizer

**File**: `prompts/summarize_weekly_report.md`
**Model tier**: Premium (Claude Sonnet)
**Called by**: Weekly Report workflow (Phase 2)
**Status**: Scaffold — NOT active in V1
**Called per**: Once per week (batch call)
**Max input**: Last 7 days of high-value signals
**Max output**: 3000 tokens

### Purpose

Provide a strategic weekly analysis: recurring themes, rising topics, offer suggestions, content ideas, and BD opportunities.

### Output Structure

1. Recurring Pain Themes This Week
2. Strongest BizDeedz Themes
3. Strongest Turea Simpson Themes
4. Rising Tools or Topics
5. Suggested Offer or Positioning Changes
6. 5 Post Ideas for Next Week
7. 3 Business Development Opportunities

---

## Adding New Prompts

To add a new prompt for a new workflow or use case:

1. Create `prompts/your_prompt_name.md`
2. Use `{{variable_name}}` syntax for injected values
3. Include:
   - Purpose description
   - Brand context (BizDeedz + Turea)
   - Explicit output format
   - Rules section at the bottom
4. Document the prompt in this file
5. Update `CLAUDE.md` if the prompt changes system behavior

---

## Prompt Quality Checklist

Before deploying a modified prompt:

- [ ] Returns only the required JSON structure (no extra text for classifier)
- [ ] Variable names match what the n8n Code node injects
- [ ] Output format is documented and tested
- [ ] Brand context is accurate and current
- [ ] Temperature is set appropriately (0 for classifiers, 0.3–0.5 for synthesis)
- [ ] Token limit is appropriate for the model tier being used
