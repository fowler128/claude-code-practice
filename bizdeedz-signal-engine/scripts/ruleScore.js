/**
 * ruleScore.js
 *
 * Applies lightweight rule-based pre-filter scoring before any AI call.
 * This is the primary gatekeeper. Items that fail are dropped silently — no AI tokens consumed.
 *
 * Scoring rules (from config/scoring.json):
 *  +2  BizDeedz keyword matched
 *  +2  Turea keyword matched
 *  +2  Pain/problem phrase matched
 *  +1  DUAL MATCH BONUS: both a brand keyword AND a pain phrase matched
 *  +1  SPECIFICITY BONUS: a high-specificity cluster matched (intake_handoff, bankruptcy_operations, etc.)
 *  +1  Source is a priority subreddit or high-priority RSS feed
 *  +1  Reddit engagement above threshold
 *
 * Minimum score to pass: 4 (raised from 3 — a single broad keyword match no longer passes)
 *
 * Hard disqualifiers (checked before scoring, zero AI cost):
 *  - Content contains a negative keyword → immediate fail
 *  - Content is too short → immediate fail
 */

const scoringConfig = require('../config/scoring.json');
const sourcesConfig = require('../config/sources.json');
const keywords = require('../config/keywords.json');

// Build the negative keyword list once at startup
const NEGATIVE_KEYWORDS = (keywords.negative_keywords && keywords.negative_keywords.terms)
  ? keywords.negative_keywords.terms.map((kw) => kw.toLowerCase())
  : [];

// High-specificity clusters from config — matching these earns +1 bonus
const HIGH_SPECIFICITY_CLUSTERS = new Set(scoringConfig.high_specificity_clusters || []);

// Priority subreddit names (lowercase for comparison)
const PRIORITY_SUBREDDITS = new Set(
  sourcesConfig.reddit.subreddits.active
    .filter((s) => s.priority === 'high')
    .map((s) => s.name.toLowerCase())
);

/**
 * Check if the content contains any negative keywords.
 * If yes, the item is immediately disqualified before scoring.
 *
 * @param {string} normalizedText - lowercase combined title + body
 * @returns {{ failed: boolean, matched_negative: string|null }}
 */
function checkNegativeKeywords(normalizedText) {
  for (const term of NEGATIVE_KEYWORDS) {
    if (normalizedText.includes(term)) {
      return { failed: true, matched_negative: term };
    }
  }
  return { failed: false, matched_negative: null };
}

/**
 * Check minimum content length.
 * Link posts, titles-only, and very short items are unreliable signals.
 *
 * @param {string} normalizedText
 * @returns {boolean} true if long enough to score
 */
function meetsMinLength(normalizedText) {
  const min = scoringConfig.thresholds.min_content_length_chars || 80;
  return (normalizedText || '').length >= min;
}

/**
 * Check if a source is a high-priority source.
 * @param {string} source - subreddit name or feed name
 * @param {string} source_type - 'reddit' | 'rss'
 * @returns {boolean}
 */
function isPrioritySource(source, source_type) {
  if (source_type === 'reddit') {
    return PRIORITY_SUBREDDITS.has((source || '').toLowerCase().replace('r/', ''));
  }
  // All V1 RSS feeds are considered priority
  if (source_type === 'rss') return true;
  return false;
}

/**
 * Check if a Reddit post has above-threshold engagement.
 * @param {number} upvotes
 * @param {number} comment_count
 * @returns {boolean}
 */
function hasHighEngagement(upvotes, comment_count) {
  const { reddit_upvote_threshold, reddit_comment_threshold } = scoringConfig.thresholds;
  return (upvotes >= reddit_upvote_threshold) || (comment_count >= reddit_comment_threshold);
}

/**
 * Check if any matched keyword cluster is in the high-specificity set.
 * These clusters only appear in practitioner-written content, not vendor blogs.
 *
 * @param {string[]} clusters - matched keyword clusters from keywordMatcher.js
 * @returns {boolean}
 */
function hasHighSpecificityCluster(clusters) {
  if (!Array.isArray(clusters)) return false;
  return clusters.some((c) => HIGH_SPECIFICITY_CLUSTERS.has(c));
}

/**
 * Calculate the full rule-based score for a single item.
 * Returns early with pass=false on hard disqualifiers.
 *
 * @param {Object} item - normalized signal item with normalized_text field
 * @param {Object} keywordResult - result from matchKeywords() in keywordMatcher.js
 * @returns {{ score: number, breakdown: Object, pass: boolean, disqualified: boolean, disqualify_reason: string|null }}
 */
function calculateRuleScore(item, keywordResult) {
  const text = item.normalized_text || '';
  const rules = scoringConfig.rules;

  // --- Hard disqualifier 1: Negative keyword present ---
  const negCheck = checkNegativeKeywords(text);
  if (negCheck.failed) {
    return {
      score: 0,
      breakdown: {},
      pass: false,
      disqualified: true,
      disqualify_reason: `negative_keyword: "${negCheck.matched_negative}"`,
    };
  }

  // --- Hard disqualifier 2: Content too short to be meaningful ---
  if (!meetsMinLength(text)) {
    return {
      score: 0,
      breakdown: {},
      pass: false,
      disqualified: true,
      disqualify_reason: `content_too_short: ${text.length} chars`,
    };
  }

  // --- Standard scoring ---
  let score = 0;
  const breakdown = {};

  // +2 BizDeedz keyword matched
  if (keywordResult.has_bizdeedz) {
    score += rules.bizdeedz_keyword_match.points;
    breakdown.bizdeedz_keyword = rules.bizdeedz_keyword_match.points;
  }

  // +2 Turea keyword matched
  if (keywordResult.has_turea) {
    score += rules.turea_keyword_match.points;
    breakdown.turea_keyword = rules.turea_keyword_match.points;
  }

  // +2 Pain phrase matched
  if (keywordResult.has_pain) {
    score += rules.pain_phrase_match.points;
    breakdown.pain_phrase = rules.pain_phrase_match.points;
  }

  // +1 DUAL MATCH BONUS: brand keyword + pain phrase together = practitioner describing a real problem
  const hasBrand = keywordResult.has_bizdeedz || keywordResult.has_turea;
  if (hasBrand && keywordResult.has_pain) {
    score += rules.dual_match_bonus.points;
    breakdown.dual_match_bonus = rules.dual_match_bonus.points;
  }

  // +1 SPECIFICITY BONUS: cluster only appears in practitioner content, not vendor/academic writing
  if (hasHighSpecificityCluster(keywordResult.keyword_cluster)) {
    score += rules.specificity_bonus.points;
    breakdown.specificity_bonus = rules.specificity_bonus.points;
  }

  // +1 Priority source
  if (isPrioritySource(item.source, item.source_type)) {
    score += rules.priority_source.points;
    breakdown.priority_source = rules.priority_source.points;
  }

  // +1 High engagement (Reddit only)
  if (item.source_type === 'reddit') {
    if (hasHighEngagement(item.upvotes || 0, item.comment_count || 0)) {
      score += rules.high_engagement.points;
      breakdown.high_engagement = rules.high_engagement.points;
    }
  }

  const pass = score >= scoringConfig.thresholds.min_rule_score;

  return { score, breakdown, pass, disqualified: false, disqualify_reason: null };
}

/**
 * Apply rule scoring to a single item and attach results.
 * @param {Object} item
 * @param {Object} keywordResult
 * @returns {Object} item with rule_score, rule_breakdown, rule_pass, disqualified, disqualify_reason added
 */
function applyRuleScore(item, keywordResult) {
  const result = calculateRuleScore(item, keywordResult);
  return {
    ...item,
    rule_score: result.score,
    rule_breakdown: result.breakdown,
    rule_pass: result.pass,
    disqualified: result.disqualified,
    disqualify_reason: result.disqualify_reason,
  };
}

/**
 * Filter an array of items, keeping only those that passed rule scoring.
 * @param {Object[]} items - items with rule_pass field already set
 * @returns {Object[]}
 */
function filterByRuleScore(items) {
  return items.filter((item) => item.rule_pass === true);
}

module.exports = {
  calculateRuleScore,
  applyRuleScore,
  filterByRuleScore,
  isPrioritySource,
  hasHighEngagement,
  checkNegativeKeywords,
  hasHighSpecificityCluster,
  meetsMinLength,
};
