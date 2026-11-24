function extractJson(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const source = fenced ? fenced[1] : trimmed;
  const start = source.search(/[\[{]/);
  const end = Math.max(source.lastIndexOf('}'), source.lastIndexOf(']'));
  if (start === -1 || end === -1 || end < start) return null;
  return source.slice(start, end + 1);
}

function parseJson(text) {
  const source = extractJson(text);
  if (!source) return null;
  try {
    return JSON.parse(source);
  } catch {
    return null;
  }
}

module.exports = { parseJson };
