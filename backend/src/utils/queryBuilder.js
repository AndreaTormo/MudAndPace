function hasValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function isEmptyObject(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

function combineClauses(clauses) {
  const valid = clauses.filter((clause) => clause && !isEmptyObject(clause));
  if (valid.length === 0) return {};
  if (valid.length === 1) return valid[0];
  return { $and: valid };
}

function buildMongoFilter(query, definitions, context = {}) {
  const clauses = definitions
    .filter((definition) => hasValue(query[definition.param]))
    .map((definition) => definition.build(query[definition.param], context));

  return combineClauses(clauses);
}

function mergeValues(...values) {
  const merged = values.flatMap((value) => {
    if (value === undefined || value === null || value === '') return [];
    return Array.isArray(value) ? value : [value];
  });

  const unique = [...new Set(merged)];
  return unique.length > 0 ? unique : undefined;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function regexOr(fields, value) {
  const regex = new RegExp(escapeRegex(value), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

module.exports = {
  hasValue,
  combineClauses,
  buildMongoFilter,
  mergeValues,
  escapeRegex,
  regexOr
};
