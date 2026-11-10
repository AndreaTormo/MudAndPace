const { z } = require('zod');
const { booleanParam, stringParam } = require('./query.validator');
const { slugSchema } = require('./event.validator');

const statusSchema = stringParam(z.enum(['active', 'inactive', 'all']));

const listCategoryQuerySchema = z.object({
  search: stringParam(z.string().trim().min(1).max(120)),
  slug: stringParam(slugSchema),
  status: statusSchema,
  isActive: booleanParam,
  is_active: booleanParam
}).strict();

const listHostQuerySchema = z.object({
  search: stringParam(z.string().trim().min(1).max(120)),
  slug: stringParam(slugSchema),
  status: statusSchema,
  isActive: booleanParam,
  is_active: booleanParam
}).strict();

const listLocationQuerySchema = z.object({
  search: stringParam(z.string().trim().min(1).max(120)),
  slug: stringParam(slugSchema),
  city: stringParam(z.string().trim().min(1).max(120)),
  country: stringParam(z.string().trim().min(1).max(120)),
  status: statusSchema,
  isActive: booleanParam,
  is_active: booleanParam
}).strict();

module.exports = {
  listCategoryQuerySchema,
  listHostQuerySchema,
  listLocationQuerySchema
};
