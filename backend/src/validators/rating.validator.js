const { z } = require('zod');
const { objectIdSchema } = require('./departure.validator');

const HTML_PATTERN = /<[^>]*>/i;
const HTML_ENTITY_PATTERN = /&(?:lt|gt|#x?0*(?:3c|3e|60|62))\b/i;
const DANGEROUS_SCHEME_PATTERN = /\b(?:javascript|data|vbscript)\s*:/i;

function sanitizeReview(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

const ratingScoreSchema = z
  .number({ error: 'La valoración debe ser un número' })
  .int('La valoración debe ser un número entero')
  .min(1, 'La valoración mínima es 1')
  .max(5, 'La valoración máxima es 5');

const reviewSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .string()
    .superRefine((value, ctx) => {
      if (HTML_PATTERN.test(value) || HTML_ENTITY_PATTERN.test(value) || DANGEROUS_SCHEME_PATTERN.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La opinión no puede contener HTML ni esquemas peligrosos'
        });
      }
    })
    .transform(sanitizeReview)
    .pipe(
      z
        .string()
        .min(3, 'La opinión debe tener al menos 3 caracteres')
        .max(600, 'La opinión no puede superar 600 caracteres')
    )
    .optional()
);

const createRatingSchema = z.object({ score: ratingScoreSchema, review: reviewSchema }).strict();
const ratingIdParamsSchema = z.object({ id: objectIdSchema });
const departureIdParamsSchema = z.object({ departureId: objectIdSchema });

module.exports = {
  ratingScoreSchema,
  createRatingSchema,
  ratingIdParamsSchema,
  departureIdParamsSchema
};
