const { z } = require('zod');
const { arrayParam, emptyToUndefined, numberParam, pageParam, stringParam } = require('./query.validator');
const { slugSchema } = require('./event.validator');

const distanceSlugSchema = z.enum(['corta', 'media', 'larga', 'ultra']);

const limitParam = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(100).optional()
);

const shopListQuerySchema = z.object({
  categorySlug: arrayParam(slugSchema),
  category_slug: arrayParam(slugSchema),
  hostSlug: arrayParam(slugSchema),
  host_slug: arrayParam(slugSchema),
  locationSlug: arrayParam(slugSchema),
  location_slug: arrayParam(slugSchema),
  distanceSlug: stringParam(distanceSlugSchema),
  distance_slug: stringParam(distanceSlugSchema),
  minPrice: numberParam(z.coerce.number().nonnegative()),
  maxPrice: numberParam(z.coerce.number().nonnegative()),
  search: stringParam(z.string().trim().min(1).max(120)),
  page: pageParam,
  limit: limitParam,
  pageSize: limitParam
}).strict();

const shopSlugParamsSchema = z.object({ slug: slugSchema });

module.exports = {
  distanceSlugSchema,
  shopListQuerySchema,
  shopSlugParamsSchema
};
