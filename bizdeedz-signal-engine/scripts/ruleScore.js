/**
 * ruleScore.js
 *
 * Applies lightweight rule-based pre-filter scoring before any AI call.
 * This is the gatekeeper that prevents low-quality items from consuming AI tokens.
 *
 * Scoring rules (from config/scoring.json):
 * +2  BizDeedz keyword matched
 * +2  Turea keyword matched
 * +2  Pain/problem phrase matched
 * +1  Source is a priority subreddit or high-priority RSS feed
 * +1  Engagement above threshold (Reddit upvotes or comment count)
 *
 * Minimum score to pass: 3
 *
 * Items that do not pass rule scoring are dropped — no AI call made.
 */

const scoringConfig = require('../config/scoring.json');
const sourcesConfig = require('../config/sources.json');

// Priority subreddit names (lowercase for comparison)
const PRIORITY_SUBREDDITS = new Set(
  sourcesConfig.reddit.subreddits.active
    .filter((s) => s.priority === 'high')
    .map((s) => s.name.toLowerCase())
);

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
  // For RSS, all V1 feeds are considered priority
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
 * Calculate the rule-based score for a single item.
 * Requires keyword match results from keywordMatcher.js.
 *
 * @param {Object} item - normalized signal item
 * @param {Object} keywordResult - result from matchKeywords()
 * @returns {{ score: number, breakdown: Object, pass: boolean }}
 */
function calculateRuleScore(item, keywordResult) {
  const rules = scoringConfig.rules;
  let score = 0;
  const breakdown = {};

  // +2 BizDeedz keyword
  if (keywordResult.has_bizdeedz) {
    score += rules.bizdeedz_keyword_match.points;
    breakdown.bizdeedz_keyword = rules.bizdeedz_keyword_match.points;
  }

  // +2 Turea keyword
  if (keywordResult.has_turea) {
    score += rules.turea_keyword_match.points;
    breakdown.turea_keyword = rules.turea_keyword_match.points;
  }

  // +2 Pain phrase
  if (keywordResult.has_pain) {
    score += rules.pain_phrase_match.points;
    breakdown.pain_phrase = rules.pain_phrase_match.points;
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

  return { score, breakdown, pass };
}

/**
 * Apply rule scoring to a single item and attach results.
 * Returns item with rule_score, rule_breakdown, and rule_pass fields.
 *
 * @param {Object} item
 * @param {Object} keywordResult
 * @returns {Object}
 */
function applyRuleScore(item, keywordResult) {
  const { score, breakdown, pass } = calculateRuleScore(item, keywordResult);
  return {
    ...item,
    rule_score: score,
    rule_breakdown: breakdown,
    rule_pass: pass,
  };
}

/**
 * Filter an array of items, keeping only those that pass rule scoring.
 * Each item must already have keyword match results attached.
 *
 * @param {Object[]} items - items with keyword_result field
 * @returns {Object[]} items that passed rule scoring
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
};
