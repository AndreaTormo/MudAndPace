const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID de evento inválido');
const slugSchema = z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug no tiene un formato válido');

const eventPayloadSchema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(3000).optional(),
  hostId: objectIdSchema,
  categoryId: objectIdSchema,
  locationId: objectIdSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  distanceKm: z.number().positive(),
  elevationGain: z.number().nonnegative(),
  price: z.number().nonnegative(),
  status: z.enum(['published', 'draft']).optional(),
  isActive: z.boolean().optional()
}).strict();

const updateEventSchema = eventPayloadSchema.partial();
const idParamsSchema = z.object({ id: objectIdSchema });
const slugParamsSchema = z.object({ slug: slugSchema });
const listQuerySchema = z.object({
  status: z.enum(['published', 'draft', 'all']).optional(),
  categoryId: objectIdSchema.optional(),
  locationId: objectIdSchema.optional(),
  hostId: objectIdSchema.optional(),
  minDistance: z.coerce.number().positive().optional(),
  maxDistance: z.coerce.number().positive().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
<<<<<<< HEAD
  isActive: z.coerce.boolean().optional()
=======
  isActive: z.coerce.boolean().optional(),
  includeDeleted: z.coerce.boolean().optional()
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce
}).strict();

module.exports = { objectIdSchema, slugSchema, eventPayloadSchema, updateEventSchema, idParamsSchema, slugParamsSchema, listQuerySchema };
