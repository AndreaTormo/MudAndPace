const { z } = require('zod');

const MAX_DURATION_SEC = 7 * 24 * 3600;
const STATUSES = ['planned', 'completed'];

function isEmptyValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

const emptyToUndefined = (value) => (isEmptyValue(value) ? undefined : value);

const optionalString = (schema) => z.preprocess(emptyToUndefined, schema.optional());
const optionalNumber = (schema) => z.preprocess(emptyToUndefined, schema.optional());

const userIdSchema = z
  .string()
  .trim()
  .min(1, '"userId" es obligatorio')
  .max(64, '"userId" no puede superar los 64 caracteres');

const titleSchema = z
  .string()
  .trim()
  .min(1, '"title" es obligatorio')
  .max(120, '"title" no puede superar los 120 caracteres');

const dateSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'La fecha debe ser válida (YYYY-MM-DD o ISO 8601)');

const optionalDateSchema = z.preprocess(emptyToUndefined, dateSchema.optional());

const paceSchema = z.union([
  z.string().trim().regex(/^\d{1,3}:\d{2}$/, '"paceMinPerKm" debe tener formato m:ss o ser minutos (ej. 6.5)'),
  z.coerce.number().min(2, '"paceMinPerKm" debe estar entre 2 y 30 minutos').max(30, '"paceMinPerKm" debe estar entre 2 y 30 minutos')
]);

const durationSchema = z.union([
  z
    .string()
    .trim()
    .regex(/^\d{1,4}:\d{1,2}(?::\d{1,2})?$/, 'La duración debe tener formato h:mm:ss, mm:ss o ser segundos'),
  z.coerce.number().int('La duración debe ser un número entero de segundos').min(1).max(MAX_DURATION_SEC)
]);

const distanceSchema = z.coerce
  .number()
  .min(0.1, '"distanceKm" debe estar entre 0.1 y 1000')
  .max(1000, '"distanceKm" debe estar entre 0.1 y 1000');

const elevationSchema = z.coerce
  .number()
  .min(0, '"elevationGainM" debe estar entre 0 y 50000')
  .max(50000, '"elevationGainM" debe estar entre 0 y 50000');

const caloriesSchema = z.coerce
  .number()
  .min(0, '"calories" debe estar entre 0 y 50000')
  .max(50000, '"calories" debe estar entre 0 y 50000');

const weightSchema = z.coerce
  .number()
  .min(30, '"weightKg" debe estar entre 30 y 250')
  .max(250, '"weightKg" debe estar entre 30 y 250');

const eventIdSchema = z.string().trim().min(1).max(64);
const statusSchema = z.enum(STATUSES);

const estimateQuerySchema = z
  .object({
    distanceKm: distanceSchema,
    elevationGainM: optionalNumber(elevationSchema),
    paceMinPerKm: z.preprocess(emptyToUndefined, paceSchema.optional()),
    weightKg: optionalNumber(weightSchema)
  })
  .strict();

const createActivitySchema = z
  .object({
    userId: userIdSchema,
    title: titleSchema,
    date: dateSchema,
    status: z.preprocess(emptyToUndefined, statusSchema.optional()),
    distanceKm: distanceSchema,
    elevationGainM: optionalNumber(elevationSchema),
    durationSec: z.preprocess(emptyToUndefined, durationSchema.optional()),
    duration: z.preprocess(emptyToUndefined, durationSchema.optional()),
    calories: optionalNumber(caloriesSchema),
    eventId: optionalString(eventIdSchema),
    notes: z.string().trim().max(1000, '"notes" no puede superar los 1000 caracteres').optional(),
    paceMinPerKm: z.preprocess(emptyToUndefined, paceSchema.optional()),
    weightKg: optionalNumber(weightSchema)
  })
  .strict();

const updateActivitySchema = z
  .object({
    userId: userIdSchema,
    title: titleSchema.optional(),
    date: dateSchema.optional(),
    status: statusSchema.optional(),
    distanceKm: distanceSchema.optional(),
    elevationGainM: elevationSchema.optional(),
    durationSec: durationSchema.optional(),
    duration: durationSchema.optional(),
    calories: caloriesSchema.optional(),
    eventId: eventIdSchema.optional(),
    notes: z.string().trim().max(1000, '"notes" no puede superar los 1000 caracteres').optional(),
    paceMinPerKm: paceSchema.optional(),
    weightKg: weightSchema.optional()
  })
  .strict()
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'userId'),
    'No hay ningún campo que actualizar'
  );

const listQuerySchema = z
  .object({
    userId: userIdSchema,
    eventId: optionalString(eventIdSchema),
    status: z.preprocess(emptyToUndefined, statusSchema.optional()),
    from: optionalDateSchema,
    to: optionalDateSchema,
    page: optionalNumber(z.coerce.number().int('"page" debe ser un entero').min(1, '"page" debe ser mayor o igual que 1')),
    limit: optionalNumber(
      z.coerce
        .number()
        .int('"limit" debe ser un entero')
        .min(1, '"limit" debe estar entre 1 y 100')
        .max(100, '"limit" debe estar entre 1 y 100')
    )
  })
  .strict();

const statsQuerySchema = z
  .object({
    userId: userIdSchema,
    eventId: optionalString(eventIdSchema),
    from: optionalDateSchema,
    to: optionalDateSchema
  })
  .strict();

const ownerQuerySchema = z.object({ userId: userIdSchema }).strict();

const activityIdParamsSchema = z
  .object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'El id no es válido')
  })
  .strict();

module.exports = {
  estimateQuerySchema,
  createActivitySchema,
  updateActivitySchema,
  listQuerySchema,
  statsQuerySchema,
  ownerQuerySchema,
  activityIdParamsSchema
};
