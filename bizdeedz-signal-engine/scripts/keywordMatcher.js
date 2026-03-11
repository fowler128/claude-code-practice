/**
 * keywordMatcher.js
 *
 * Matches normalized content against the keyword bank.
 * - Returns matched keywords
 * - Returns detected lane (BizDeedz | Turea | Both | Ignore)
 * - Returns matched keyword clusters
 * - Returns pain phrase matches
 *
 * Uses config/keywords.json as the source of truth.
 * All matching is done on pre-normalized (lowercase) text.
 */

const keywords = require('../config/keywords.json');

/**
 * Check if any keyword from an array is present in the text.
 * Returns matched keywords (not just boolean).
 * @param {string} text - normalized lowercase text
 * @param {string[]} keywordList
 * @returns {string[]} matched keywords
 */
function findMatches(text, keywordList) {
  if (!text || !Array.isArray(keywordList)) return [];
  return keywordList.filter((kw) => text.includes(kw.toLowerCase()));
}

/**
 * Match text against all BizDeedz keyword clusters.
 * @param {string} text - normalized lowercase text
 * @returns {{ matched: string[], clusters: string[] }}
 */
function matchBizDeedz(text) {
  const matched = [];
  const clusters = [];

  for (const [cluster, kwList] of Object.entries(keywords.bizdeedz)) {
    const hits = findMatches(text, kwList);
    if (hits.length > 0) {
      matched.push(...hits);
      clusters.push(cluster);
    }
  }

  return { matched, clusters };
}

/**
 * Match text against all Turea keyword clusters.
 * @param {string} text - normalized lowercase text
 * @returns {{ matched: string[], clusters: string[] }}
 */
function matchTurea(text) {
  const matched = [];
  const clusters = [];

  for (const [cluster, kwList] of Object.entries(keywords.turea)) {
    const hits = findMatches(text, kwList);
    if (hits.length > 0) {
      matched.push(...hits);
      clusters.push(cluster);
    }
  }

  return { matched, clusters };
}

/**
 * Match text against pain/problem phrases.
 * @param {string} text - normalized lowercase text
 * @returns {string[]} matched pain phrases
 */
function matchPainPhrases(text) {
  return findMatches(text, keywords.pain_phrases);
}

/**
 * Determine the lane based on which brand's keywords matched.
 * @param {boolean} hasBizDeedz
 * @param {boolean} hasTurea
 * @returns {'BizDeedz'|'Turea'|'Both'|'Ignore'}
 */
function determineLane(hasBizDeedz, hasTurea) {
  if (hasBizDeedz && hasTurea) return 'Both';
  if (hasBizDeedz) return 'BizDeedz';
  if (hasTurea) return 'Turea';
  return 'Ignore';
}

/**
 * Run full keyword matching on a normalized text string.
 * Returns all match results needed for rule scoring and classification.
 *
 * @param {string} normalizedText - lowercase combined title + body
 * @returns {Object} match result
 */
function matchKeywords(normalizedText) {
  const bizResult = matchBizDeedz(normalizedText);
  const tureaResult = matchTurea(normalizedText);
  const painMatches = matchPainPhrases(normalizedText);

  const hasBizDeedz = bizResult.matched.length > 0;
  const hasTurea = tureaResult.matched.length > 0;
  const hasPain = painMatches.length > 0;

  const lane = determineLane(hasBizDeedz, hasTurea);

  // Deduplicate all matched keywords
  const allMatched = [...new Set([
    ...bizResult.matched,
    ...tureaResult.matched,
    ...painMatches,
  ])];

  // Combine clusters from both brands
  const allClusters = [...new Set([
    ...bizResult.clusters,
    ...tureaResult.clusters,
  ])];

  return {
    matched_keywords: allMatched,
    keyword_cluster: allClusters,
    lane,
    has_bizdeedz: hasBizDeedz,
    has_turea: hasTurea,
    has_pain: hasPain,
    pain_phrases: painMatches,
  };
}

module.exports = {
  matchKeywords,
  matchBizDeedz,
  matchTurea,
  matchPainPhrases,
  determineLane,
};
