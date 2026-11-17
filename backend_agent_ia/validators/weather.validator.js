const { z } = require('zod');

function isEmptyValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

const emptyToUndefined = (value) => (isEmptyValue(value) ? undefined : value);

const optionalString = (schema) => z.preprocess(emptyToUndefined, schema.optional());
const optionalNumber = (schema) => z.preprocess(emptyToUndefined, schema.optional());

function isValidDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const dateSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .refine(isValidDate, 'La fecha no es válida')
    .optional()
);

const weatherQuerySchema = z
  .object({
    place: optionalString(
      z.string().trim().min(1, 'El lugar no puede estar vacío').max(120, 'El lugar no puede superar los 120 caracteres')
    ),
    lat: optionalNumber(
      z.coerce.number().min(-90, '"lat" debe estar entre -90 y 90').max(90, '"lat" debe estar entre -90 y 90')
    ),
    lon: optionalNumber(
      z.coerce.number().min(-180, '"lon" debe estar entre -180 y 180').max(180, '"lon" debe estar entre -180 y 180')
    ),
    elevation: optionalNumber(
      z.coerce.number().min(-500, '"elevation" debe estar entre -500 y 9000').max(9000, '"elevation" debe estar entre -500 y 9000')
    ),
    days: optionalNumber(
      z.coerce
        .number()
        .int('"days" debe ser un entero')
        .min(1, '"days" debe estar entre 1 y 16')
        .max(16, '"days" debe estar entre 1 y 16')
    ),
    date: dateSchema
  })
  .strict()
  .refine((value) => Boolean(value.place) || (value.lat !== undefined && value.lon !== undefined), {
    message: 'Indica "place" o bien "lat" y "lon"',
    path: ['place']
  });

module.exports = { weatherQuerySchema };
