const { z } = require('zod');
const {
  arrayParam,
  booleanParam,
  dateParam,
  numberParam,
  paginationFields,
  stringParam
} = require('./query.validator');

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID de evento inválido');
const slugSchema = z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug no tiene un formato válido');

const skuSchema = z.string().trim().min(3).max(80).regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 'El SKU no tiene un formato válido');

const MIN_EVENT_VARIANTS = 3;

const eventVariantSchema = z.object({
  name: z.string().trim().min(1).max(80),
  distanceKm: z.number().positive(),
  elevationGain: z.number().nonnegative(),
  price: z.number().nonnegative()
}).strict();

const eventPayloadSchema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: slugSchema.optional(),
  sku: skuSchema.optional(),
  description: z.string().trim().max(3000).optional(),
  hostId: objectIdSchema,
  categoryId: objectIdSchema,
  locationId: objectIdSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  distanceKm: z.number().positive(),
  elevationGain: z.number().nonnegative(),
  elevationLossM: z.number().nonnegative().optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard', 'expert']).optional(),
  surface: z.array(z.enum(['trail', 'rock', 'dirt', 'gravel', 'asphalt', 'mixed'])).optional(),
  tags: z.array(z.string().trim()).optional(),
  gpxUrl: z.string().trim().optional(),
  price: z.number().nonnegative(),
  variants: z.array(eventVariantSchema).min(MIN_EVENT_VARIANTS, `El evento debe tener al menos ${MIN_EVENT_VARIANTS} modalidades`).optional(),
  status: z.enum(['published', 'draft']).optional(),
  isActive: z.boolean().optional()
}).strict();

const updateEventSchema = eventPayloadSchema.partial();
const idParamsSchema = z.object({ id: objectIdSchema });
const imageParamsSchema = z.object({ id: objectIdSchema, imageId: objectIdSchema });
const slugParamsSchema = z.object({ slug: slugSchema });
const listQuerySchema = z.object({
  status: stringParam(z.enum(['published', 'draft', 'all'])),
  categorySlug: arrayParam(slugSchema),
  category_slug: arrayParam(slugSchema),
  hostSlug: arrayParam(slugSchema),
  host_slug: arrayParam(slugSchema),
  locationSlug: arrayParam(slugSchema),
  location_slug: arrayParam(slugSchema),
  minDistance: numberParam(z.coerce.number().positive()),
  maxDistance: numberParam(z.coerce.number().positive()),
  minElevationGain: numberParam(z.coerce.number().nonnegative()),
  maxElevationGain: numberParam(z.coerce.number().nonnegative()),
  minPrice: numberParam(z.coerce.number().nonnegative()),
  maxPrice: numberParam(z.coerce.number().nonnegative()),
  fromDate: dateParam,
  toDate: dateParam,
  isActive: booleanParam,
  is_active: booleanParam,
  difficulty: arrayParam(z.enum(['easy', 'moderate', 'hard', 'expert'])),
  surface: arrayParam(z.enum(['trail', 'rock', 'dirt', 'gravel', 'asphalt', 'mixed'])),
  tags: arrayParam(z.string().trim().toLowerCase().min(1).max(40)),
  search: stringParam(z.string().trim().min(1).max(120)),
  ...paginationFields
}).strict();

module.exports = {
  objectIdSchema,
  slugSchema,
  skuSchema,
  MIN_EVENT_VARIANTS,
  eventPayloadSchema,
  updateEventSchema,
  idParamsSchema,
  imageParamsSchema,
  slugParamsSchema,
  listQuerySchema
};
