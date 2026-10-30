const { z } = require('zod');
const { profileFields } = require('./profile.validator');

const emailSchema = z.string().trim().toLowerCase().email('Email inválido').max(254);

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar los 72 caracteres')
  .regex(/[a-z]/, 'La contraseña debe incluir una minúscula')
  .regex(/[A-Z]/, 'La contraseña debe incluir una mayúscula')
  .regex(/\d/, 'La contraseña debe incluir un número');

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
    email: emailSchema,
    password: passwordSchema,
    ...profileFields
  })
  .strict();

const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'La contraseña es obligatoria').max(72)
  })
  .strict();

module.exports = {
  emailSchema,
  passwordSchema,
  registerSchema,
  loginSchema
};
