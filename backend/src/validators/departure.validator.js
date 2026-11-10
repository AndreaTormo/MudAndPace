const { z } = require('zod');
const { booleanParam, dateParam, stringParam } = require('./query.validator');

const departureStatusSchema = z.enum(['scheduled', 'full', 'cancelled', 'completed']);

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'ID inválido');

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug no tiene un formato válido');

const departurePayloadSchema = z
  .object({
    eventId: objectIdSchema.optional(),
    startDatetime: z.coerce.date(),
    endDatetime: z.coerce.date(),
    capacity: z.coerce.number().int().min(1),
    price: z.coerce.number().min(0),
    bookedParticipants: z.coerce.number().int().min(0).optional(),
    status: departureStatusSchema.optional(),
    isActive: z.boolean().optional()
  })
  .strict();

const updateDepartureSchema = departurePayloadSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviarse al menos un campo'
  });

const activationSchema = z.object({ isActive: z.boolean() }).strict();

const idParamsSchema = z.object({ id: objectIdSchema });
const eventIdParamsSchema = z.object({ eventId: objectIdSchema });
const slugParamsSchema = z.object({ slug: slugSchema });

const listQuerySchema = z
  .object({
    eventId: stringParam(objectIdSchema),
    status: stringParam(departureStatusSchema),
    isActive: booleanParam,
    is_active: booleanParam,
    fromDate: dateParam,
    toDate: dateParam
  })
  .strict();

const eventDepartureListQuerySchema = listQuerySchema.omit({ eventId: true });

module.exports = {
  departureStatusSchema,
  objectIdSchema,
  slugSchema,
  departurePayloadSchema,
  updateDepartureSchema,
  activationSchema,
  idParamsSchema,
  eventIdParamsSchema,
  slugParamsSchema,
  listQuerySchema,
  eventDepartureListQuerySchema
};
