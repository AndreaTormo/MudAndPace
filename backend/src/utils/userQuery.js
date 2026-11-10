const { buildMongoFilter, regexOr } = require('./queryBuilder');

const USER_FILTERS = [
  { param: 'search', build: (value) => regexOr(['name', 'email'], value) },
  { param: 'role', build: (value) => ({ role: value }) },
  { param: 'status', build: (value) => ({ status: value }) },
  { param: 'isActive', build: (value) => ({ isActive: value }) }
];

function normalizeUserQuery(input) {
  return {
    ...input,
    role: input.role === 'all' ? undefined : input.role,
    status: input.status === 'all' ? undefined : input.status,
    isActive: input.isActive !== undefined ? input.isActive : input.is_active
  };
}

function buildUserFilter(input) {
  return buildMongoFilter(normalizeUserQuery(input), USER_FILTERS);
}

module.exports = { buildUserFilter };
