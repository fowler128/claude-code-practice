/**
 * dedupeHash.js
 *
 * Generates a deterministic deduplication hash for each signal.
 * Uses SHA256(title + url) to identify exact or near-duplicate content.
 *
 * Usage:
 * - Generate hash before any processing
 * - Check against Google Sheets dedupe_hash column before AI classification
 * - Store hash alongside each saved signal
 */

const crypto = require('crypto');

/**
 * Generate a SHA256 deduplication hash from title and URL.
 * Both values are normalized before hashing to handle minor formatting differences.
 *
 * @param {string} title - raw or normalized title
 * @param {string} url - canonical URL of the signal
 * @returns {string} hex SHA256 hash
 */
function generateDedupeHash(title, url) {
  // Normalize both inputs before hashing
  const normalizedTitle = (title || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizedUrl = (url || '').toLowerCase().trim().replace(/\/+$/, ''); // strip trailing slashes

  const input = `${normalizedTitle}::${normalizedUrl}`;
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Add dedupe_hash to a single item.
 * Non-destructive — returns a new object with the hash added.
 *
 * @param {Object} item - signal item with title and url fields
 * @returns {Object} item with dedupe_hash added
 */
function addDedupeHash(item) {
  return {
    ...item,
    dedupe_hash: generateDedupeHash(item.title, item.url),
  };
}

/**
 * Add dedupe_hash to an array of items.
 * @param {Object[]} items
 * @returns {Object[]}
 */
function addDedupeHashes(items) {
  if (!Array.isArray(items)) return [];
  return items.map(addDedupeHash);
}

/**
 * Filter out items whose dedupe_hash already exists in a known set.
 * The knownHashes set should be loaded from Google Sheets before calling this.
 *
 * @param {Object[]} items - items with dedupe_hash field
 * @param {Set<string>} knownHashes - set of already-processed hashes
 * @returns {Object[]} items not previously seen
 */
function filterDuplicates(items, knownHashes) {
  if (!knownHashes || knownHashes.size === 0) return items;
  return items.filter((item) => !knownHashes.has(item.dedupe_hash));
}

module.exports = {
  generateDedupeHash,
  addDedupeHash,
  addDedupeHashes,
  filterDuplicates,
};
