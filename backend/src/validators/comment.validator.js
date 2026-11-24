const { z } = require('zod');
const { objectIdSchema } = require('./departure.validator');
const { paginationFields } = require('./query.validator');

const HTML_PATTERN = /<[^>]*>/i;
const HTML_ENTITY_PATTERN = /&(?:lt|gt|#x?0*(?:3c|3e|60|62))\b/i;
const DANGEROUS_SCHEME_PATTERN = /\b(?:javascript|data|vbscript)\s*:/i;

function sanitizeContent(value) {
  if (typeof value !== 'string') return value;

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const contentSchema = z
  .string()
  .superRefine((value, ctx) => {
    if (HTML_PATTERN.test(value) || HTML_ENTITY_PATTERN.test(value) || DANGEROUS_SCHEME_PATTERN.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El comentario no puede contener HTML ni esquemas peligrosos'
      });
    }
  })
  .transform(sanitizeContent)
  .pipe(
    z
      .string()
      .min(3, 'El comentario debe tener al menos 3 caracteres')
      .max(1500, 'El comentario no puede superar 1500 caracteres')
  );

const createCommentSchema = z.object({ content: contentSchema }).strict();
const updateCommentSchema = z.object({ content: contentSchema }).strict();
const commentStatusSchema = z.object({ status: z.enum(['visible', 'hidden']) }).strict();

const commentIdParamsSchema = z.object({ id: objectIdSchema });
const departureIdParamsSchema = z.object({ departureId: objectIdSchema });
const reportCommentSchema = z.object({}).strict();
const commentListQuerySchema = z.object({ ...paginationFields }).strict();
const commentAdminListQuerySchema = z
  .object({ ...paginationFields, status: z.enum(['visible', 'hidden', 'reported']).optional() })
  .strict();
const commentDeletedListQuerySchema = z.object({ ...paginationFields }).strict();

module.exports = {
  objectIdSchema,
  contentSchema,
  createCommentSchema,
  updateCommentSchema,
  commentStatusSchema,
  reportCommentSchema,
  commentIdParamsSchema,
  departureIdParamsSchema,
  commentListQuerySchema,
  commentAdminListQuerySchema,
  commentDeletedListQuerySchema
};
