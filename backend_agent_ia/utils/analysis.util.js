const { createHash } = require('crypto');

function chunk(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function cleanList(value, limit = 3) {
  if (!Array.isArray(value)) return [];
  return value
    .map(cleanText)
    .filter(Boolean)
    .slice(0, limit);
}

function hashContent(content) {
  return createHash('sha256').update(content || '').digest('hex');
}

function contentRevision(comment, includeStatus = false) {
  const content = comment.contentHash || hashContent(comment.content);
  const date = comment.updated_at || comment.created_At || '';
  const dateText = date instanceof Date ? date.toISOString() : String(date);
  return includeStatus
    ? `${comment._id}|${content}|${comment.status}|${dateText}`
    : `${comment._id}|${content}|${dateText}`;
}

function ratingRevision(rating) {
  const review = hashContent(rating.review || '');
  const date = rating.updated_at || rating.created_At || '';
  const dateText = date instanceof Date ? date.toISOString() : String(date);
  return `${rating._id}|${rating.score}|${review}|${dateText}`;
}

function buildFingerprint(prefix, comments, { includeStatus = false, meta = '' } = {}, ratings = []) {
  const hash = createHash('sha256');
  hash.update(`${prefix}:${meta}\n`);
  for (const comment of comments) {
    hash.update(`${contentRevision(comment, includeStatus)}\n`);
  }
  for (const rating of ratings) {
    hash.update(`rating:${ratingRevision(rating)}\n`);
  }
  return hash.digest('hex');
}

module.exports = {
  chunk,
  unique,
  cleanText,
  cleanList,
  hashContent,
  buildFingerprint
};
