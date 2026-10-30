const { z } = require('zod');
const { profileFields } = require('./profile.validator');

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID de usuario inválido');

const idParamsSchema = z.object({ id: objectIdSchema });

const statusValues = ['active', 'inactive', 'blocked'];
const roleValues = ['USER', 'ADMIN'];

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar los 72 caracteres');

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre es obligatorio').max(120).optional(),
    email: z.string().trim().toLowerCase().email('Email inválido').max(254).optional(),
    password: passwordSchema.optional(),
    role: z.enum(roleValues).optional(),
    status: z.enum(statusValues).optional(),
    isActive: z.boolean().optional()
  })
  .strict();

const createUserSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
    email: z.string().trim().toLowerCase().email('Email inválido').max(254),
    password: passwordSchema,
    role: z.enum(roleValues).optional(),
    status: z.enum(statusValues).optional(),
    isActive: z.boolean().optional(),
    ...profileFields
  })
  .strict();

const activationSchema = z
  .object({
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional()
  })
  .strict()
  .refine((value) => typeof value.isActive === 'boolean' || typeof value.is_active === 'boolean', {
    message: 'Debes indicar isActive'
  });

module.exports = {
  objectIdSchema,
  idParamsSchema,
  updateUserSchema,
  createUserSchema,
  activationSchema,
  statusValues,
  roleValues
};
