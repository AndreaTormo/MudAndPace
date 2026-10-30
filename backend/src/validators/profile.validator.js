const { z } = require('zod');

const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value);

const birthDateSchema = z.preprocess(emptyToUndefined, z.coerce.date().optional());

const avatarUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.union([z.literal(''), z.string().url('La URL del avatar no es válida').max(500)]).optional()
);

const profileFields = {
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  avatarUrl: avatarUrlSchema,
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  birthDate: birthDateSchema
};

const updateProfileSchema = z
  .object(profileFields)
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo del perfil'
  });

const profileFieldKeys = Object.keys(profileFields);

module.exports = { profileFields, profileFieldKeys, updateProfileSchema, birthDateSchema };
