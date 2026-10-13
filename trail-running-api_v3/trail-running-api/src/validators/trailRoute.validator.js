const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID de ruta inválido');
const slugSchema = z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug no tiene un formato válido');
const geoPointSchema = z.object({ type: z.literal('Point'), coordinates: z.tuple([z.number(), z.number()]) });

const routePayloadSchema = z.object({
  name: z.string().trim().min(3).max(120), slug: slugSchema.optional(), description: z.string().trim().max(3000).optional(),
  location: z.object({ country: z.string().trim().min(1), region: z.string().trim().optional(), province: z.string().trim().optional(), municipality: z.string().trim().optional() }),
  startPoint: geoPointSchema, distanceKm: z.number().positive(), elevationGainM: z.number().nonnegative(), elevationLossM: z.number().nonnegative().optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard', 'expert']).optional(), surface: z.array(z.enum(['trail', 'rock', 'dirt', 'gravel', 'asphalt', 'mixed'])).optional(),
  tags: z.array(z.string().trim()).optional(), imageUrl: z.string().trim().optional(), gpxUrl: z.string().trim().optional(),
  isPublished: z.boolean().optional(), isActive: z.boolean().optional(), status: z.enum(['active', 'inactive']).optional()
}).strict();

const updateRouteSchema = routePayloadSchema.partial();
const idParamsSchema = z.object({ id: objectIdSchema });
const slugParamsSchema = z.object({ slug: slugSchema });
const listQuerySchema = z.object({
  difficulty: z.enum(['easy', 'moderate', 'hard', 'expert']).optional(), country: z.string().trim().optional(), region: z.string().trim().optional(),
  minDistance: z.coerce.number().nonnegative().optional(), maxDistance: z.coerce.number().positive().optional(), isActive: z.coerce.boolean().optional(),
  status: z.enum(['active', 'inactive', 'deleted', 'all']).optional(), includeDeleted: z.coerce.boolean().optional(), isPublished: z.coerce.boolean().optional()
}).strict();
const nearbyQuerySchema = z.object({ longitude: z.coerce.number().min(-180).max(180), latitude: z.coerce.number().min(-90).max(90), radiusKm: z.coerce.number().positive().default(25) }).strict();

module.exports = { objectIdSchema, slugSchema, routePayloadSchema, updateRouteSchema, idParamsSchema, slugParamsSchema, listQuerySchema, nearbyQuerySchema };
