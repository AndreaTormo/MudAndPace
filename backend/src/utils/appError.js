class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR', details = undefined) {
    super(message); this.name = 'AppError'; this.statusCode = statusCode; this.code = code; this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

function normalizeAppError(error) {
  if (error instanceof AppError) return error;
  if (error?.name === 'ValidationError') return new AppError('Los datos enviados no son válidos', 400, 'VALIDATION_ERROR', Object.values(error.errors).map((item) => item.message));
  if (error?.code === 11000) return new AppError('Ya existe un recurso con uno de los campos únicos enviados', 409, 'DUPLICATE_RESOURCE');
  if (error?.name === 'CastError') return new AppError('Identificador o parámetro inválido', 400, 'INVALID_PARAMETER');
  if (Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode < 500) {
    return new AppError(error.message || 'Petición inválida', error.statusCode, error.code || 'BAD_REQUEST', error.details);
  }
  return new AppError('Error interno del servidor', 500, 'INTERNAL_ERROR');
}

const { slugify } = require('./slugify');

module.exports = { AppError, normalizeAppError, slugify };
