const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'El identificador no es válido')
  .transform((value) => value.toLowerCase());

const summaryParamsSchema = z.object({ departureId: objectIdSchema }).strict();

const booleanQueryParam = z.preprocess((value) => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
}, z.boolean().optional());

const sentimentQuerySchema = z
  .object({
    scope: z.enum(['global', 'departure', 'event']).default('global'),
    departureId: objectIdSchema.optional(),
    eventId: objectIdSchema.optional(),
    includeDeleted: booleanQueryParam,
    includeRatings: booleanQueryParam.default(true)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.scope === 'departure' && !value.departureId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'departureId es obligatorio para el ámbito departure' });
    }
    if (value.scope === 'event' && !value.eventId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'eventId es obligatorio para el ámbito event' });
    }
    if (value.scope === 'global' && (value.departureId || value.eventId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El ámbito global no admite departureId ni eventId' });
    }
    if (value.scope === 'departure' && value.eventId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El ámbito departure no admite eventId' });
    }
    if (value.scope === 'event' && value.departureId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El ámbito event no admite departureId' });
    }
  });

module.exports = { objectIdSchema, summaryParamsSchema, sentimentQuerySchema };
