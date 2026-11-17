const { AppError } = require('./appError');

function validateService(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }));
    throw new AppError('Datos de entrada inválidos', 400, 'VALIDATION_ERROR', details);
  }
  return result.data;
}

module.exports = { validateService };
