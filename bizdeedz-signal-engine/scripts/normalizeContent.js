/**
 * normalizeContent.js
 *
 * Prepares raw signal data for keyword matching and AI classification.
 * - Strips HTML tags
 * - Lowercases all text
 * - Combines title + body into a single searchable string
 * - Trims to excerpt limit for AI calls
 * - Generates the ai_excerpt field (title + first 800 chars of cleaned body)
 */

const EXCERPT_BODY_LIMIT = 800;

/**
 * Remove HTML tags from a string.
 * @param {string} text
 * @returns {string}
 */
function stripHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, ' ')  // replace tags with space
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Collapse multiple whitespace characters into a single space.
 * @param {string} text
 * @returns {string}
 */
function collapseWhitespace(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Build a normalized, lowercase combined text from title + body/snippet.
 * Used for keyword matching (not sent to AI directly).
 * @param {string} title
 * @param {string} body - raw HTML or plain text body/snippet
 * @returns {string} normalized_text
 */
function buildNormalizedText(title, body) {
  const cleanTitle = collapseWhitespace(stripHtml(title)).toLowerCase();
  const cleanBody = collapseWhitespace(stripHtml(body)).toLowerCase();
  return `${cleanTitle} ${cleanBody}`.trim();
}

/**
 * Build the ai_excerpt field.
 * Format: cleaned title + first EXCERPT_BODY_LIMIT chars of cleaned body.
 * This is what gets sent to the AI classifier — never the full body.
 * @param {string} title
 * @param {string} body
 * @param {number} [bodyLimit=800]
 * @returns {string} ai_excerpt
 */
function buildAiExcerpt(title, body, bodyLimit = EXCERPT_BODY_LIMIT) {
  const cleanTitle = collapseWhitespace(stripHtml(title));
  const cleanBody = collapseWhitespace(stripHtml(body));
  const trimmedBody = cleanBody.slice(0, bodyLimit);
  return `${cleanTitle}\n\n${trimmedBody}`.trim();
}

/**
 * Normalize a single raw signal item.
 * Accepts Reddit posts and RSS items (both share title + body fields after mapping).
 *
 * @param {Object} item - raw signal with at least { title, body, url, source, source_type }
 * @returns {Object} normalized item with added fields: normalized_text, ai_excerpt
 */
function normalizeItem(item) {
  const title = item.title || '';
  const body = item.body || item.snippet || item.description || item.content || '';

  return {
    ...item,
    title: collapseWhitespace(stripHtml(title)),
    normalized_text: buildNormalizedText(title, body),
    ai_excerpt: buildAiExcerpt(title, body),
  };
}

/**
 * Normalize an array of raw signal items.
 * @param {Object[]} items
 * @returns {Object[]}
 */
function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeItem);
}

module.exports = {
  normalizeItem,
  normalizeItems,
  buildNormalizedText,
  buildAiExcerpt,
  stripHtml,
};
