const { z } = require('zod');

function isEmptyValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

const emptyToUndefined = (value) => (isEmptyValue(value) ? undefined : value);

function normalizeArrayValue(value) {
  if (isEmptyValue(value)) return undefined;

  const values = (Array.isArray(value) ? value : String(value).split(','))
    .map((item) => String(item).trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

const arrayParam = (itemSchema) =>
  z.preprocess(normalizeArrayValue, z.array(itemSchema).optional());

const stringParam = (schema = z.string().trim().min(1)) =>
  z.preprocess(emptyToUndefined, schema.optional());

const numberParam = (schema = z.coerce.number()) =>
  z.preprocess(emptyToUndefined, schema.optional());

const booleanParam = z.preprocess((value) => {
  if (isEmptyValue(value)) return undefined;
  if (typeof value === 'boolean') return value;

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;

  return value;
}, z.boolean().optional());

const dateParam = z.preprocess(emptyToUndefined, z.coerce.date().optional());

const pageParam = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).optional()
);

const pageSizeParam = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(100).optional()
);

const paginationFields = {
  page: pageParam,
  pageSize: pageSizeParam
};

module.exports = {
  isEmptyValue,
  emptyToUndefined,
  normalizeArrayValue,
  arrayParam,
  stringParam,
  numberParam,
  booleanParam,
  dateParam,
  pageParam,
  pageSizeParam,
  paginationFields
};
